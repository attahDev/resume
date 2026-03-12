"""create guest_sessions table

Revision ID: 0002_guest_sessions
Revises: 0001_users
Create Date: 2026-03-01
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002_guest_sessions"
down_revision: Union[str, None] = "0001_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "guest_sessions",
        sa.Column("id",           sa.String(),                nullable=False),
        sa.Column("cookie_hash",  sa.String(64),              nullable=False),
        sa.Column("analysis_count", sa.Integer(),             nullable=False, server_default="0"),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at",   sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cookie_hash"),
    )
    op.create_index("ix_guest_sessions_cookie_hash", "guest_sessions", ["cookie_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_guest_sessions_cookie_hash", table_name="guest_sessions")
    op.drop_table("guest_sessions")