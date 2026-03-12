import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Boolean, Integer, DateTime, Date, text
from sqlalchemy.types import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(128), nullable=False)
    refresh_token_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    plan: Mapped[str] = mapped_column(String(20), default="free", nullable=False)
    plan_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    daily_analyses_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    daily_reset_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")