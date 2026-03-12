"""create users table

Revision ID: 0001_users
Revises:
Create Date: 2026-03-01
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001_users"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id",              sa.String(),                 nullable=False),
        sa.Column("email",           sa.String(),                 nullable=False),
        sa.Column("hashed_password", sa.String(),                 nullable=False),
        sa.Column("is_active",       sa.Boolean(),                nullable=False, server_default="true"),
        sa.Column("is_verified",     sa.Boolean(),                nullable=False, server_default="false"),
        sa.Column("tier",            sa.String(),                 nullable=False, server_default="free"),
        sa.Column("daily_count",     sa.Integer(),                nullable=False, server_default="0"),
        sa.Column("daily_reset_at",  sa.DateTime(timezone=True),  nullable=True),
        sa.Column("created_at",      sa.DateTime(timezone=True),  nullable=True),
        sa.Column("updated_at",      sa.DateTime(timezone=True),  nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")