"""
Results router — fetch and delete analysis results.
IDOR protection: always scoped to owner.
Supports polling for async results.
"""
import uuid
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from backend.database import get_db
from backend.models.analysis import Analysis
from backend.security.auth import get_optional_user
from backend.middleware.guest_cookie import get_guest_fingerprint_hash
from backend.security.rate_limit import limiter
from backend.models.job import JobDescription

logger = logging.getLogger("resume_analyzer")
router = APIRouter()


@router.get("/results/{analysis_id}")
@limiter.limit("120/hour")
async def get_results(
    request: Request,
    analysis_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
    fingerprint_hash: str = Depends(get_guest_fingerprint_hash),
):
    """
    Fetch analysis results by ID.
    Returns status immediately if still processing.
    Frontend polls this every 2 seconds until status == 'complete'.
    """
    if current_user:
        result = await db.execute(
            select(Analysis).where(
                Analysis.id == analysis_id,
                Analysis.user_id == current_user.id,
            )
        )
    else:
        result = await db.execute(
            select(Analysis).where(
                Analysis.id == analysis_id,
                Analysis.guest_fingerprint == fingerprint_hash,
            )
        )

    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    if analysis.status in ("pending", "processing"):
        return {"analysis_id": str(analysis.id), "status": analysis.status}

    if analysis.status == "failed":
        return {
            "analysis_id": str(analysis.id),
            "status": "failed",
            "error": "Analysis failed after 3 attempts. Please try again.",
        }

    recommendations = {}
    if analysis.recommendations:
        try:
            recommendations = json.loads(analysis.recommendations)
        except (json.JSONDecodeError, ValueError):
            recommendations = {}

    return {
        "analysis_id":      str(analysis.id),
        "status":           analysis.status,
        "overall_score":    analysis.overall_score,
        "skills_score":     analysis.skills_score,
        "experience_score": analysis.experience_score,
        "keywords_score":   analysis.keywords_score,
        "matched_skills":   analysis.matched_skills or [],
        "missing_skills":   analysis.missing_skills or [],
        "model_version":    analysis.model_version,
        "created_at":       analysis.created_at.isoformat() if analysis.created_at else None,
        "overall_assessment": recommendations.get("overall_assessment", ""),
        "top_strengths":    recommendations.get("top_strengths", []),
        "critical_gaps":    recommendations.get("critical_gaps", []),
        "quick_wins":       recommendations.get("quick_wins", []),
        "ats_warning":      recommendations.get("ats_warning"),
        "score_explanation": recommendations.get("score_explanation", ""),
        "sections":         recommendations.get("sections", []),
    }


@router.delete("/results/{analysis_id}")
@limiter.limit("30/hour")
async def delete_analysis(
    request: Request,
    analysis_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
    fingerprint_hash: str = Depends(get_guest_fingerprint_hash),
):
    """
    Delete an analysis by ID.
    Always scoped to owner — prevents IDOR.
    Returns 404 (not 403) if not found or not owned.
    """
    if current_user:
        result = await db.execute(
            select(Analysis).where(
                Analysis.id == analysis_id,
                Analysis.user_id == current_user.id,
            )
        )
    else:
        result = await db.execute(
            select(Analysis).where(
                Analysis.id == analysis_id,
                Analysis.guest_fingerprint == fingerprint_hash,
            )
        )

    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    await db.execute(
        delete(Analysis).where(Analysis.id == analysis_id)
    )
    await db.commit()

    logger.info("analysis_deleted", extra={"analysis_id": str(analysis_id)})
    return Response(status_code=204)


@router.get("/history")
@limiter.limit("30/hour")
async def get_history(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
    fingerprint_hash: str = Depends(get_guest_fingerprint_hash),
):
    """
    Return list of past analyses for the current user/guest.
    Always scoped to owner.
    """
    if current_user:
        result = await db.execute(
            select(Analysis, JobDescription)
            .join(JobDescription, Analysis.job_id == JobDescription.id)
            .where(Analysis.user_id == current_user.id)
            .order_by(Analysis.created_at.desc())
            .limit(50)
        )
    else:
        result = await db.execute(
            select(Analysis, JobDescription)
            .join(JobDescription, Analysis.job_id == JobDescription.id)
            .where(Analysis.guest_fingerprint == fingerprint_hash)
            .order_by(Analysis.created_at.desc())
            .limit(10)
        )

    rows = result.all()

    return {
        "analyses": [
            {
                "analysis_id":  str(a.id),
                "status":       a.status,
                "overall_score": a.overall_score,
                "job_title":    j.title,
                "company":      j.company,
                "created_at":   a.created_at.isoformat() if a.created_at else None,
            }
            for a, j in rows
        ]
    }