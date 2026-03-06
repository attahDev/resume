"""
Auth router — register, login, refresh, logout, me.

Security rules:
- Passwords never in logs, responses, or errors
- Tokens never logged
- All auth errors → 401, never 422 or 500
- Login error always "Invalid credentials" — never reveals email existence
"""
import asyncio
import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.models.user import User
from backend.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
)
from backend.security.passwords import hash_password, verify_password, check_password_strength
from backend.security.auth import (
    create_access_token,
    create_refresh_token,
    verify_token,
    get_current_user,
)
from backend.security.rate_limit import limiter

router = APIRouter()


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# ── Register ─────────────────────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    # Password strength check
    errors = check_password_strength(body.password)
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})

    # Duplicate email check
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ── Login ─────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()

    # Timing-safe: always delay if user not found to prevent email enumeration
    if not user:
        await asyncio.sleep(0.1)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Issue tokens
    access_token = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token(user.id)

    # Store hash of refresh token — never the raw value
    user.refresh_token_hash = _hash_token(refresh_token)
    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


# ── Refresh ───────────────────────────────────────────────────────────────────
@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    payload = verify_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid credentials")

    import uuid
    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Token rotation theft detection — hash mismatch means token already used
    submitted_hash = _hash_token(body.refresh_token)
    if user.refresh_token_hash != submitted_hash:
        # Possible token theft — invalidate account
        user.is_active = False
        user.refresh_token_hash = None
        await db.commit()
        raise HTTPException(
            status_code=401,
            detail="Session invalidated. Please log in again.",
        )

    # Issue new token pair
    new_access = create_access_token(user.id, user.email)
    new_refresh = create_refresh_token(user.id)

    user.refresh_token_hash = _hash_token(new_refresh)
    await db.commit()

    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


# ── Logout ────────────────────────────────────────────────────────────────────
@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.refresh_token_hash = None
    await db.commit()
    return {"message": "Logged out successfully"}


# ── Me ────────────────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user