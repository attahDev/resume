"""
Analyze router — stub with guest limit enforcement.
Full implementation in Phase 7.
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.middleware.guest_cookie import get_guest_fingerprint_hash
from backend.security.auth import get_optional_user
from backend.services.guest import get_or_create_guest_session, check_guest_limit
from backend.config import settings

router = APIRouter()


@router.post("/analyze")
async def analyze(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
    fingerprint_hash: str = Depends(get_guest_fingerprint_hash),
):
    """
    Analyze endpoint stub.
    Enforces guest and auth user limits.
    Full logic implemented in Phase 7.
    """
    if current_user is None:
        # Guest flow — check lifetime limit
        session = await get_or_create_guest_session(fingerprint_hash, db)
        if await check_guest_limit(session):
            return {
                "error": f"You have used all {settings.GUEST_LIFETIME_LIMIT} free guest analyses.",
                "message": "Create a free account for 50 analyses per day.",
                "action": "register",
            }

    return {"message": "Analyze endpoint — Phase 7 implementation coming soon."}