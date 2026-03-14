"""
backend/models/password_reset.py

PasswordResetToken model.
One row per reset request. Tokens are hashed (SHA-256) before storage —
the raw token only lives in the email link.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from ..database import Base


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id         = Column(String, primary_key=True)          # UUID
    user_id    = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(64), nullable=False, unique=True)  # SHA-256 hex
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used       = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="reset_tokens")

    __table_args__ = (
        Index("ix_prt_token_hash", "token_hash"),
        Index("ix_prt_user_id",    "user_id"),
    )
    