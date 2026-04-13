
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
from backend.routers import auth, upload, analyze, results, history, auth_reset
from backend.database import Base
import backend.models  # noqa: F401
from backend.routers.compare import router as compare_router
from backend.models.analysis import Analysis





logger = logging.getLogger("resume_analyzer")


async def _recover_dead_jobs(db) -> None:
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


def _run_migrations() -> None:
    """Run any pending Alembic migrations on startup.

    Safe to call on every boot — Alembic tracks which migrations have already
    run in the alembic_version table and skips them automatically.
    This removes the need to run 'alembic upgrade head' manually.
    """
    import subprocess
    import sys
    try:
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            check=True,
        )
        logger.info("startup", extra={"action": "migrations_ok", "output": result.stdout.strip()})
    except subprocess.CalledProcessError as e:
        # Log but don't crash — app can still serve if DB is already up to date
        logger.error("startup", extra={"action": "migration_failed", "error": e.stderr.strip()})


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────

    # Run pending Alembic migrations before anything else touches the DB.
    # Alembic skips migrations it has already applied, so this is always safe.
    _run_migrations()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        await delete_expired_resume_text(db)
        await _recover_dead_jobs(db)

    # Pre-warm NLP models so first analysis is fast
    try:
        from backend.services.nlp import get_nlp, get_embedder
        get_nlp()
        get_embedder()
        logger.info("startup", extra={"action": "models_loaded"})
    except Exception as e:
        logger.warning("startup", extra={"action": "model_warmup_failed", "error": str(e)})

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


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(analyze.router, prefix="", tags=["analyze"])
app.include_router(compare_router)   # prefix="/analyze" declared inside the router
app.include_router(results.router, prefix="", tags=["results"])
app.include_router(history.router, prefix="", tags=["history"])
app.include_router(auth_reset.router)

# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "env": settings.ENV}