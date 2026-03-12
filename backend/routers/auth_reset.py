"""
backend/routers/auth_reset.py

Password reset endpoints.
Wire into main.py:
    from backend.routers.auth_reset import router as reset_router
    app.include_router(reset_router, prefix="/api/v1")

Routes:
    POST /auth/forgot-password   — request reset link
    POST /auth/reset-password    — submit new password with token
"""

import os
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.user import User
from ..models.password_reset import PasswordResetToken
from ..security.passwords import hash_password, validate_password_strength
from ..services.email import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])

RESET_TOKEN_EXPIRY_MINUTES = 15


# ── Schemas ────────────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token:    str
    password: str


class MessageResponse(BaseModel):
    message: str


# ── Helpers ────────────────────────────────────────────────────────────────

def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


# ── Routes ─────────────────────────────────────────────────────────────────

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    db:   AsyncSession = Depends(get_db),
):
    """
    Request a password reset link.

    Always returns 200 with the same message regardless of whether the
    email exists — prevents user enumeration.
    """
    SAFE_MESSAGE = "If that email is registered, you'll receive a reset link within a minute."

    # Look up user
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        # Return success to prevent email enumeration
        return MessageResponse(message=SAFE_MESSAGE)

    # Invalidate any existing unused tokens for this user
    existing = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,
        )
    )
    for old_token in existing.scalars().all():
        old_token.used = True

    # Generate new token
    raw_token  = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRY_MINUTES)

    reset_token = PasswordResetToken(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        used=False,
    )
    db.add(reset_token)
    await db.commit()

    # Send email (fire and don't raise — safe_message returned either way)
    await send_password_reset_email(user.email, raw_token)

    return MessageResponse(message=SAFE_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    body: ResetPasswordRequest,
    db:   AsyncSession = Depends(get_db),
):
    """
    Consume a reset token and set a new password.
    Token is single-use and expires after 15 minutes.
    """
    INVALID = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="This reset link is invalid or has expired. Please request a new one.",
    )

    token_hash = _hash_token(body.token)

    # Look up token
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
        )
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token:
        raise INVALID

    # Check used
    if reset_token.used:
        raise INVALID

    # Check expiry
    now = datetime.now(timezone.utc)
    if reset_token.expires_at < now:
        reset_token.used = True
        await db.commit()
        raise INVALID

    # Validate password strength
    errors = validate_password_strength(body.password)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": errors},
        )

    # Fetch user and update password
    result = await db.execute(select(User).where(User.id == reset_token.user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise INVALID

    user.hashed_password = hash_password(body.password)

    # Mark token used
    reset_token.used = True

    await db.commit()

    return MessageResponse(message="Password updated successfully. You can now log in.")