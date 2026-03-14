
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0004_password_reset"
down_revision: Union[str, None] = "0003_resumes_jobs_analyses"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "password_reset_tokens",
        sa.Column("id",         sa.String(),                nullable=False),
        sa.Column("user_id",    sa.String(),                nullable=False),
        sa.Column("token_hash", sa.String(64),              nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used",       sa.Boolean(),               nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_prt_token_hash", "password_reset_tokens", ["token_hash"])
    op.create_index("ix_prt_user_id",    "password_reset_tokens", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_prt_user_id",    table_name="password_reset_tokens")
    op.drop_index("ix_prt_token_hash", table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")