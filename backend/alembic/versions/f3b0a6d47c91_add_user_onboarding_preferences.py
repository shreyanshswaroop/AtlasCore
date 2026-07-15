"""add user onboarding preferences

Revision ID: f3b0a6d47c91
Revises: e8c7f2b91a33
Create Date: 2026-07-15 00:10:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "f3b0a6d47c91"
down_revision: Union[str, Sequence[str], None] = "e8c7f2b91a33"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("users", sa.Column("job_title", sa.String(length=80), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "preferred_topics",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "preferred_content_types",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
    )
    op.alter_column("users", "onboarding_completed", server_default=None)
    op.alter_column("users", "preferred_topics", server_default=None)
    op.alter_column("users", "preferred_content_types", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "preferred_content_types")
    op.drop_column("users", "preferred_topics")
    op.drop_column("users", "job_title")
    op.drop_column("users", "onboarding_completed")
