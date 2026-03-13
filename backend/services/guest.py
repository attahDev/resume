
import secrets
import hashlib
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.config import settings


def generate_fingerprint() -> str:
    return secrets.token_hex(32)


def hash_fingerprint(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


async def get_or_create_guest_session(fingerprint_hash: str, db: AsyncSession):
    from backend.models.guest_session import GuestSession

    result = await db.execute(
        select(GuestSession).where(GuestSession.fingerprint == fingerprint_hash)
    )
    session = result.scalar_one_or_none()

    if not session:
        session = GuestSession(
            fingerprint=fingerprint_hash,
            analyses_count=0,
            first_seen=datetime.now(timezone.utc),
            last_seen=datetime.now(timezone.utc),
        )
        db.add(session)
    else:
        session.last_seen = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(session)
    return session


async def check_guest_limit(session) -> bool:
    """Return True if the guest has hit their lifetime limit."""
    return session.analyses_count >= settings.GUEST_LIFETIME_LIMIT


async def increment_guest_count(session, db: AsyncSession) -> None:
    """Increment guest analysis count and persist."""
    session.analyses_count += 1
    await db.commit()