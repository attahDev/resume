import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.types import Uuid
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base
from datetime import datetime, timezone

class GuestSession(Base):
    __tablename__ = "guest_sessions"
    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fingerprint: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    analyses_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_seen:  Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)