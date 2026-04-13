"""Add text_deleted flag to resumes — replaces fragile [DELETED] string sentinel

Revision ID: 0005_resume_text_deleted_flag
Revises: 0004_password_reset
Create Date: 2026-04-13
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0005_resume_text_deleted_flag"
down_revision: Union[str, None] = "0004_password_reset"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1 — add the column, nullable first so existing rows don't violate NOT NULL
    op.add_column(
        "resumes",
        sa.Column(
            "text_deleted",
            sa.Boolean(),
            nullable=True,          # temporarily nullable for backfill
            server_default="false",
        ),
    )

    # Step 2 — backfill: any row whose encrypted_text is "[DELETED]" was already cleaned up
    op.execute(
        """
        UPDATE resumes
        SET text_deleted = true
        WHERE encrypted_text = '[DELETED]'
        """
    )

    # Step 3 — also clear the sentinel string on those rows so the column is clean
    op.execute(
        """
        UPDATE resumes
        SET encrypted_text = ''
        WHERE encrypted_text = '[DELETED]'
        """
    )

    # Step 4 — set remaining rows explicitly to false (handles DB engines that ignore server_default on existing rows)
    op.execute(
        """
        UPDATE resumes
        SET text_deleted = false
        WHERE text_deleted IS NULL
        """
    )

    # Step 5 — now safe to make NOT NULL
    op.alter_column("resumes", "text_deleted", nullable=False)


def downgrade() -> None:
    # Restore the sentinel string for rows flagged as deleted before dropping column
    op.execute(
        """
        UPDATE resumes
        SET encrypted_text = '[DELETED]'
        WHERE text_deleted = true
        """
    )
    op.drop_column("resumes", "text_deleted")
