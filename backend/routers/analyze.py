"""
Analyze router — full implementation.
Enforces guest lifetime limit and auth daily limit.
Queues analysis as background task, returns immediately with analysis_id.
IDOR protection: every query scoped to owner.
"""
import uuid
import logging
from datetime import datetime, timezone, date

from backend.security.encryption import decrypt_text
from backend.services.scorer import run_full_score
import json
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from backend.services.llm import get_llm_analysis, _call_with_retry
import importlib
import backend.services.llm as llm_module
importlib.reload(llm_module)
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
        # Reset daily count if date has changed
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
        # Guest flow
        session = await get_or_create_guest_session(fingerprint_hash, db)
        if await check_guest_limit(session):
            raise HTTPException(
                status_code=429,
                detail={
                    "error": f"You have used all {settings.GUEST_LIFETIME_LIMIT} free guest analyses.",
                    "message": "Create a free account for 50 analyses per day.",
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
        # Return 403 not 404 — do not reveal existence of other resumes
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
    cached = await get_cached(db, cache_key, owner_id)
    if cached:
        logger.info("analyze", extra={"action": "cache_hit"})
        return {
            "analysis_id": str(cached.id),
            "status": cached.status,
            "overall_score": cached.overall_score,
            "skills_score": cached.skills_score,
            "experience_score": cached.experience_score,
            "keywords_score": cached.keywords_score,
            "matched_skills": cached.matched_skills,
            "missing_skills": cached.missing_skills,
            "recommendations": cached.recommendations,
            "cached": True,
        }

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

    # Increment usage counters
    if current_user:
        current_user.daily_analyses_count += 1
    else:
        await increment_guest_count(session, db)

    await db.commit()
    await db.refresh(analysis)

    # Queue background processing
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
    """
    Runs in background — decrypts resume, scores, calls LLM, saves results.
    Clears resume text from memory after use.
    Handles retries and marks as failed after 3 attempts.
    """


    async with AsyncSessionLocal() as db:
        try:
            # Fetch analysis row
            result = await db.execute(
                select(Analysis).where(Analysis.id == uuid.UUID(analysis_id))
            )
            analysis = result.scalar_one_or_none()
            if not analysis:
                return

            # Mark as processing
            analysis.status = "processing"
            analysis.last_attempted = datetime.now(timezone.utc)
            await db.commit()

            # Fetch resume — owner scoped
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

            # Decrypt resume text
            resume_text = decrypt_text(resume.encrypted_text)

            # Run local NLP scoring
            scorer_result = run_full_score(resume_text, jd_text)

            # Run LLM analysis — skills only, no PII
            llm_result = await get_llm_analysis(scorer_result, jd_text)

            # Merge recommendations from LLM
            recommendations = json.dumps({
                "overall_assessment": llm_result.get("overall_assessment", ""),
                "top_strengths": llm_result.get("top_strengths", []),
                "critical_gaps": llm_result.get("critical_gaps", []),
                "quick_wins": llm_result.get("quick_wins", []),
                "ats_warning": llm_result.get("ats_warning"),
                "score_explanation": llm_result.get("score_explanation", ""),
            })

            # Save results
            analysis.status = "complete"
            analysis.overall_score = scorer_result["overall_score"]
            analysis.skills_score = scorer_result["skills_score"]
            analysis.experience_score = scorer_result["experience_score"]
            analysis.keywords_score = scorer_result["keywords_score"]
            analysis.matched_skills = scorer_result["matched_skills"]
            analysis.missing_skills = scorer_result["missing_skills"]
            analysis.recommendations = recommendations
            await db.commit()

            # Clear resume text from memory
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