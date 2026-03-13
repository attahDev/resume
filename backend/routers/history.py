
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from backend.database import get_db
from backend.security.auth import get_current_user
from backend.models.user import User
from backend.models.analysis import Analysis
from backend.models.job import JobDescription

router = APIRouter()


@router.get("/history", tags=["history"])
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    
    result = await db.execute(
        select(
            Analysis.id,
            Analysis.overall_score,
            Analysis.status,
            Analysis.created_at,
            Analysis.job_id,
        )
        .where(
            Analysis.user_id == current_user.id,
            Analysis.status == "complete",
        )
        .order_by(Analysis.created_at.desc())
        .limit(20)
    )
    rows = result.fetchall()

    if not rows:
        return []

    # Fetch job details for each analysis
    job_ids = [row.job_id for row in rows if row.job_id]
    jobs_map = {}

    if job_ids:
        jobs_result = await db.execute(
            select(JobDescription.id, JobDescription.title, JobDescription.company)
            .where(JobDescription.id.in_(job_ids))
        )
        for job in jobs_result.fetchall():
            jobs_map[job.id] = {"title": job.title, "company": job.company}

    return [
        {
            "analysis_id": str(row.id),
            "job_title":   jobs_map.get(row.job_id, {}).get("title")   or "Untitled Role",
            "company":     jobs_map.get(row.job_id, {}).get("company") or "Unknown Company",
            "overall_score": row.overall_score,
            "status":      row.status,
            "created_at":  row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]