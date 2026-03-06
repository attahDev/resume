"""
Resume Analyzer & Job Match Scorer — FastAPI application entry point.

Middleware order (outermost → innermost):
  1. SecurityHeadersMiddleware  — security headers on every response
  2. PIILoggingMiddleware       — structured logging, PII scrubbed
  3. GuestCookieMiddleware      — injected in Phase 3
  4. CORSMiddleware             — CORS, locked to ALLOWED_ORIGINS

Startup:
  - Create DB tables
  - Clear expired resume text
  - Recover dead jobs (stuck in 'processing' > 5 min)
"""
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from sqlalchemy import select, update

from backend.config import settings
from backend.database import engine, AsyncSessionLocal
from backend.security.headers import SecurityHeadersMiddleware
from backend.security.rate_limit import limiter, rate_limit_exceeded_handler
from backend.middleware.logging import PIILoggingMiddleware
from backend.middleware.cleanup import delete_expired_resume_text
from backend.middleware.guest_cookie import GuestCookieMiddleware

# Import all models so metadata is populated before create_all
import backend.models  # noqa: F401

logger = logging.getLogger("resume_analyzer")


async def _recover_dead_jobs(db) -> None:
    """Reset analyses stuck in 'processing' for more than 5 minutes back to 'pending'."""
    from backend.models.analysis import Analysis

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    result = await db.execute(
        select(Analysis.id).where(
            Analysis.status == "processing",
            Analysis.last_attempted < cutoff,
        )
    )
    dead_ids = result.scalars().all()

    if dead_ids:
        await db.execute(
            update(Analysis)
            .where(Analysis.id.in_(dead_ids))
            .values(status="pending")
        )
        await db.commit()
        logger.info("startup", extra={"dead_jobs_recovered": len(dead_ids)})


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────
    async with engine.begin() as conn:
        from backend.database import Base
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        await delete_expired_resume_text(db)
        await _recover_dead_jobs(db)

    logger.info("Resume Analyzer API started", extra={"env": settings.ENV})
    yield
    # ── Shutdown ─────────────────────────────────────────────────────────
    await engine.dispose()


app = FastAPI(
    title="Resume Analyzer & Job Match Scorer",
    version="1.0.0",
    docs_url="/docs" if settings.ENV != "production" else None,
    redoc_url="/redoc" if settings.ENV != "production" else None,
    lifespan=lifespan,
)

# ── State for slowapi ────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# ── Middleware stack (FIFO — first added = outermost) ────────────────────────
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(PIILoggingMiddleware)
app.add_middleware(GuestCookieMiddleware)

# CORS — production never allows wildcard
_origins = settings.get_allowed_origins()
if settings.ENV == "production" and "*" in _origins:
    raise RuntimeError("CORS wildcard origin is not allowed in production.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
# Stubs included; fully implemented in later phases
from backend.routers import auth, upload, analyze, results  # noqa: E402

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(analyze.router, prefix="", tags=["analyze"])
app.include_router(results.router, prefix="", tags=["results"])


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health():
    """Returns service status. Safe to expose publicly."""
    return {"status": "ok", "env": settings.ENV}