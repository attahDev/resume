import uuid
import logging
from datetime import datetime, timezone, date

from backend.security.encryption import decrypt_text
from backend.services.scorer import run_full_score
import json
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete as sql_delete

from backend.services.llm import get_llm_analysis
from backend.database import get_db, AsyncSessionLocal
from backend.models.analysis import Analysis
from backend.models.resume import Resume
from backend.models.job import JobDescription
from backend.schemas.analysis import AnalyzeRequest
from backend.security.auth import get_optional_user
from backend.security.sanitise import sanitise_text
from backend.middleware.guest_cookie import get_guest_fingerprint_hash
from backend.services.guest import get_or_create_guest_session, check_guest_limit, increment_guest_count
from backend.services.cache import generate_cache_key, get_cached
from backend.config import settings
from backend.security.rate_limit import limiter

logger = logging.getLogger("resume_analyzer")
router = APIRouter()


# ── POST /analyze ─────────────────────────────────────────────────────────────
@router.post("/analyze")
@limiter.limit("60/hour")
async def analyze(
    request: Request,
    body: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
    fingerprint_hash: str = Depends(get_guest_fingerprint_hash),
):
    # ── Step 1: determine caller and enforce limits ───────────────────────────
    if current_user:
        today = date.today()
        if current_user.daily_reset_date != today:
            current_user.daily_analyses_count = 0
            current_user.daily_reset_date = today
            await db.commit()

        if current_user.daily_analyses_count >= settings.DAILY_FREE_LIMIT:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Daily limit reached",
                    "limit": settings.DAILY_FREE_LIMIT,
                    "resets_at": "midnight UTC",
                    "action": "upgrade",
                },
            )
        owner_id = str(current_user.id)

    else:
        session = await get_or_create_guest_session(fingerprint_hash, db)
        if await check_guest_limit(session):
            raise HTTPException(
                status_code=429,
                detail={
                    "error": f"You have used all {settings.GUEST_LIFETIME_LIMIT} free guest analyses.",
                    "message": f"Create a free account for {settings.DAILY_FREE_LIMIT} analyses per day.",
                    "action": "register",
                },
            )
        owner_id = fingerprint_hash

    # ── Step 2: ownership check on resume ────────────────────────────────────
    if current_user:
        resume_result = await db.execute(
            select(Resume).where(
                Resume.id == body.resume_id,
                Resume.user_id == current_user.id,
            )
        )
    else:
        resume_result = await db.execute(
            select(Resume).where(
                Resume.id == body.resume_id,
                Resume.guest_fingerprint == fingerprint_hash,
            )
        )

    resume = resume_result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=403, detail="Resume not found or access denied.")

    # ── Step 3: sanitise and store job description ────────────────────────────
    clean_jd = sanitise_text(body.job_description)
    jd_hash = generate_cache_key(clean_jd[:100], "", "", "jd")

    jd_result = await db.execute(
        select(JobDescription).where(JobDescription.jd_hash == jd_hash)
    )
    job = jd_result.scalar_one_or_none()

    if not job:
        job = JobDescription(
            user_id=current_user.id if current_user else None,
            raw_text=clean_jd,
            title=body.job_title or None,
            company=body.company or None,
            jd_hash=jd_hash,
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

    # ── Step 4: cache check ───────────────────────────────────────────────────
    cache_key = generate_cache_key(
        str(body.resume_id), str(job.id), owner_id, settings.MODEL_VERSION
    )

    # Return completed cached analysis
    cached = await get_cached(db, cache_key, owner_id)
    if cached:
        logger.info("analyze", extra={"action": "cache_hit"})
        return {
            "analysis_id":    str(cached.id),
            "status":         cached.status,
            "overall_score":  cached.overall_score,
            "skills_score":   cached.skills_score,
            "experience_score": cached.experience_score,
            "keywords_score": cached.keywords_score,
            "matched_skills": cached.matched_skills,
            "missing_skills": cached.missing_skills,
            "recommendations": cached.recommendations,
            "cached": True,
        }

    # Delete any stale failed or pending rows with this cache_key
    # so we can insert a fresh analysis without hitting the unique constraint
    stale_result = await db.execute(
        select(Analysis).where(
            Analysis.cache_key == cache_key,
            Analysis.status.in_(["failed", "pending"]),
        )
    )
    stale = stale_result.scalar_one_or_none()
    if stale:
        await db.execute(
            sql_delete(Analysis).where(Analysis.id == stale.id)
        )
        await db.commit()
        logger.info("analyze", extra={"action": "stale_deleted", "status": stale.status})

    # ── Step 5: create analysis row and queue background task ─────────────────
    analysis = Analysis(
        user_id=current_user.id if current_user else None,
        guest_fingerprint=fingerprint_hash if not current_user else None,
        resume_id=resume.id,
        job_id=job.id,
        cache_key=cache_key,
        status="pending",
        model_version=settings.MODEL_VERSION,
    )
    db.add(analysis)

    if current_user:
        current_user.daily_analyses_count += 1
    else:
        await increment_guest_count(session, db)

    await db.commit()
    await db.refresh(analysis)

    background_tasks.add_task(
        process_analysis,
        str(analysis.id),
        str(resume.id),
        str(job.id),
        owner_id,
        current_user is None,
        clean_jd,
    )

    return {"analysis_id": str(analysis.id), "status": "pending"}


# ── Background processing ─────────────────────────────────────────────────────
async def process_analysis(
    analysis_id: str,
    resume_id: str,
    job_id: str,
    owner_id: str,
    is_guest: bool,
    jd_text: str,
):
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(Analysis).where(Analysis.id == uuid.UUID(analysis_id))
            )
            analysis = result.scalar_one_or_none()
            if not analysis:
                return

            analysis.status = "processing"
            analysis.last_attempted = datetime.now(timezone.utc)
            await db.commit()

            if is_guest:
                resume_result = await db.execute(
                    select(Resume).where(
                        Resume.id == uuid.UUID(resume_id),
                        Resume.guest_fingerprint == owner_id,
                    )
                )
            else:
                resume_result = await db.execute(
                    select(Resume).where(
                        Resume.id == uuid.UUID(resume_id),
                        Resume.user_id == uuid.UUID(owner_id),
                    )
                )

            resume = resume_result.scalar_one_or_none()
            if not resume:
                analysis.status = "failed"
                await db.commit()
                return

            resume_text = decrypt_text(resume.encrypted_text)
            scorer_result = run_full_score(resume_text, jd_text)
            llm_result = await get_llm_analysis(scorer_result, jd_text)

            # Save all fields including sections
            recommendations = json.dumps({
                "overall_assessment": llm_result.get("overall_assessment", ""),
                "top_strengths":      llm_result.get("top_strengths", []),
                "critical_gaps":      llm_result.get("critical_gaps", []),
                "quick_wins":         llm_result.get("quick_wins", []),
                "ats_warning":        llm_result.get("ats_warning"),
                "score_explanation":  llm_result.get("score_explanation", ""),
                "sections":           llm_result.get("sections", []),
            })

            analysis.status = "complete"
            analysis.overall_score    = scorer_result["overall_score"]
            analysis.skills_score     = scorer_result["skills_score"]
            analysis.experience_score = scorer_result["experience_score"]
            analysis.keywords_score   = scorer_result["keywords_score"]
            analysis.matched_skills   = scorer_result["matched_skills"]
            analysis.missing_skills   = scorer_result["missing_skills"]
            analysis.recommendations  = recommendations
            await db.commit()

            resume_text = None
            logger.info("analysis_complete", extra={"analysis_id": analysis_id})

        except Exception as e:
            logger.warning("analysis_error", extra={"error": type(e).__name__})
            try:
                result = await db.execute(
                    select(Analysis).where(Analysis.id == uuid.UUID(analysis_id))
                )
                analysis = result.scalar_one_or_none()
                if analysis:
                    analysis.retry_count += 1
                    if analysis.retry_count >= 3:
                        analysis.status = "failed"
                    else:
                        analysis.status = "pending"
                    await db.commit()
            except Exception:
                pass