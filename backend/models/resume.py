import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.types import Uuid
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    guest_fingerprint: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    encrypted_text: Mapped[str] = mapped_column(Text, nullable=False)
    parsed_skills: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    file_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    raw_text_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # FIX 7: proper boolean flag instead of "[DELETED]" string sentinel.
    # Migration 0005_resume_text_deleted_flag.py backfills existing rows.
    text_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),  # FIX 5: was datetime.utcnow (deprecated)
        nullable=False,
    )
