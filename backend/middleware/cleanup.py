"""
Background cleanup — zeroes out encrypted resume text after 24h expiry.
Logs count only — no IDs or user data.
"""
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from backend.models.resume import Resume


logger = logging.getLogger("resume_analyzer")


async def delete_expired_resume_text(db: AsyncSession) -> None:
    """
    Find resumes past their raw_text_expires timestamp and overwrite
    encrypted_text with '[DELETED]'. Logs count only.
    """
    

    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(Resume.id).where(
            Resume.raw_text_expires < now,
            Resume.encrypted_text != "[DELETED]",
        )
    )
    expired_ids = result.scalars().all()

    if not expired_ids:
        return

    await db.execute(
        update(Resume)
        .where(Resume.id.in_(expired_ids))
        .values(encrypted_text="[DELETED]")
    )
    await db.commit()

    logger.info("cleanup", extra={"expired_resumes_cleared": len(expired_ids)})
