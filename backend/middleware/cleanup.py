import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from backend.models.resume import Resume


logger = logging.getLogger("resume_analyzer")


async def delete_expired_resume_text(db: AsyncSession) -> None:
    now = datetime.now(timezone.utc)

    # FIX 7: filter on text_deleted boolean flag instead of comparing encrypted_text
    # to the "[DELETED]" string sentinel, which was fragile and error-prone.
    result = await db.execute(
        select(Resume.id).where(
            Resume.raw_text_expires < now,
            Resume.text_deleted == False,   # noqa: E712 — SQLAlchemy requires == not `is`
        )
    )
    expired_ids = result.scalars().all()

    if not expired_ids:
        return

    await db.execute(
        update(Resume)
        .where(Resume.id.in_(expired_ids))
        .values(
            encrypted_text="",   # clear the ciphertext
            text_deleted=True,   # set the flag — no more string sentinels
        )
    )
    await db.commit()

    logger.info("cleanup", extra={"expired_resumes_cleared": len(expired_ids)})
