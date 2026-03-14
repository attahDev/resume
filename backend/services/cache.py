
import hashlib
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger("resume_analyzer")


def generate_cache_key(
    resume_id: str,
    job_id: str,
    owner_id: str,
    model_version: str,
) -> str:

    raw = f"{owner_id}:{resume_id}:{job_id}:{model_version}"
    return hashlib.sha256(raw.encode()).hexdigest()


async def get_cached(db: AsyncSession, cache_key: str, owner_id: str):

    from backend.models.analysis import Analysis
    import uuid

    query = select(Analysis).where(
        Analysis.cache_key == cache_key,
        Analysis.status == "complete",
    )

    # Apply owner filter
    try:
        uid = uuid.UUID(str(owner_id))
        query = query.where(
            (Analysis.user_id == uid) | (Analysis.guest_fingerprint == owner_id)
        )
    except (ValueError, AttributeError):
        query = query.where(Analysis.guest_fingerprint == owner_id)

    result = await db.execute(query)
    return result.scalar_one_or_none()