"""create resumes, job_descriptions, and analyses tables

Revision ID: 0003_resumes_jobs_analyses
Revises: 0002_guest_sessions
Create Date: 2026-03-01
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0003_resumes_jobs_analyses"
down_revision: Union[str, None] = "0002_guest_sessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── resumes ───────────────────────────────────────────────────────────
    op.create_table(
        "resumes",
        sa.Column("id",            sa.String(),                nullable=False),
        sa.Column("user_id",       sa.String(),                nullable=True),
        sa.Column("guest_id",      sa.String(),                nullable=True),
        sa.Column("filename",      sa.String(),                nullable=False),
        sa.Column("file_hash",     sa.String(64),              nullable=False),
        sa.Column("encrypted_text", sa.Text(),                 nullable=True),
        sa.Column("file_size",     sa.Integer(),               nullable=True),
        sa.Column("mime_type",     sa.String(),                nullable=True),
        sa.Column("created_at",    sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"],  ["users.id"],          ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["guest_id"], ["guest_sessions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_resumes_file_hash", "resumes", ["file_hash"])
    op.create_index("ix_resumes_user_id",   "resumes", ["user_id"])
    op.create_index("ix_resumes_guest_id",  "resumes", ["guest_id"])

    # ── job_descriptions ──────────────────────────────────────────────────
    op.create_table(
        "job_descriptions",
        sa.Column("id",            sa.String(),                nullable=False),
        sa.Column("user_id",       sa.String(),                nullable=True),
        sa.Column("guest_id",      sa.String(),                nullable=True),
        sa.Column("job_title",     sa.String(),                nullable=True),
        sa.Column("company",       sa.String(),                nullable=True),
        sa.Column("raw_text",      sa.Text(),                  nullable=False),
        sa.Column("created_at",    sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"],  ["users.id"],          ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["guest_id"], ["guest_sessions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_jd_user_id",  "job_descriptions", ["user_id"])
    op.create_index("ix_jd_guest_id", "job_descriptions", ["guest_id"])

    # ── analyses ──────────────────────────────────────────────────────────
    op.create_table(
        "analyses",
        sa.Column("id",               sa.String(),                nullable=False),
        sa.Column("user_id",          sa.String(),                nullable=True),
        sa.Column("guest_id",         sa.String(),                nullable=True),
        sa.Column("resume_id",        sa.String(),                nullable=False),
        sa.Column("job_id",           sa.String(),                nullable=False),
        sa.Column("status",           sa.String(),                nullable=False, server_default="pending"),
        # scores
        sa.Column("overall_score",    sa.Float(),                 nullable=True),
        sa.Column("skills_score",     sa.Float(),                 nullable=True),
        sa.Column("experience_score", sa.Float(),                 nullable=True),
        sa.Column("keywords_score",   sa.Float(),                 nullable=True),
        sa.Column("education_score",  sa.Float(),                 nullable=True),
        # JSON result fields (stored as Text, parsed in app)
        sa.Column("matched_skills",   sa.Text(),                  nullable=True),
        sa.Column("missing_skills",   sa.Text(),                  nullable=True),
        sa.Column("critical_gaps",    sa.Text(),                  nullable=True),
        sa.Column("quick_wins",       sa.Text(),                  nullable=True),
        sa.Column("overall_assessment", sa.Text(),                nullable=True),
        sa.Column("ats_warning",      sa.Text(),                  nullable=True),
        sa.Column("experience_level", sa.String(),                nullable=True),
        sa.Column("error_message",    sa.Text(),                  nullable=True),
        sa.Column("created_at",       sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at",     sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"],   ["users.id"],           ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["guest_id"],  ["guest_sessions.id"],  ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"],          ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["job_id"],    ["job_descriptions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_analyses_user_id",  "analyses", ["user_id"])
    op.create_index("ix_analyses_guest_id", "analyses", ["guest_id"])
    op.create_index("ix_analyses_status",   "analyses", ["status"])


def downgrade() -> None:
    op.drop_index("ix_analyses_status",   table_name="analyses")
    op.drop_index("ix_analyses_guest_id", table_name="analyses")
    op.drop_index("ix_analyses_user_id",  table_name="analyses")
    op.drop_table("analyses")

    op.drop_index("ix_jd_guest_id", table_name="job_descriptions")
    op.drop_index("ix_jd_user_id",  table_name="job_descriptions")
    op.drop_table("job_descriptions")

    op.drop_index("ix_resumes_guest_id",  table_name="resumes")
    op.drop_index("ix_resumes_user_id",   table_name="resumes")
    op.drop_index("ix_resumes_file_hash", table_name="resumes")
    op.drop_table("resumes")