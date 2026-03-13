from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator

from backend.config import settings


def _build_url(raw_url: str) -> str:
    if raw_url.startswith("postgresql://"):
        return raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if raw_url.startswith("postgresql+asyncpg://"):
        return raw_url
    if raw_url.startswith("sqlite://"):
        return raw_url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    if raw_url.startswith("sqlite+aiosqlite://"):
        return raw_url
    return raw_url


_url = _build_url(settings.DATABASE_URL)

# Connect args differ between drivers
_connect_args = {}
if "sqlite" in _url:
    _connect_args = {"check_same_thread": False}

engine = create_async_engine(
    _url,
    echo=False,  # Never echo SQL — would expose query params
    pool_pre_ping=True,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
