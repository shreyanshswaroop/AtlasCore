"""create company leaderboard snapshots

Revision ID: d4b83a9c6e21
Revises: c8e3d9a71f02
Create Date: 2026-07-15 15:40:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4b83a9c6e21"
down_revision: Union[str, Sequence[str], None] = "c8e3d9a71f02"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "company_leaderboard_snapshots",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("company_name", sa.String(length=160), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("global_mentions", sa.Integer(), nullable=False),
        sa.Column("importance_score", sa.Float(), nullable=False),
        sa.Column("rank_basis", sa.Text(), nullable=False),
        sa.Column("source", sa.String(length=120), nullable=False),
        sa.Column("calculated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_company_leaderboard_snapshots_calculated_at"),
        "company_leaderboard_snapshots",
        ["calculated_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_company_leaderboard_snapshots_rank"),
        "company_leaderboard_snapshots",
        ["rank"],
        unique=False,
    )
    op.create_index(
        op.f("ix_company_leaderboard_snapshots_slug"),
        "company_leaderboard_snapshots",
        ["slug"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_company_leaderboard_snapshots_slug"),
        table_name="company_leaderboard_snapshots",
    )
    op.drop_index(
        op.f("ix_company_leaderboard_snapshots_rank"),
        table_name="company_leaderboard_snapshots",
    )
    op.drop_index(
        op.f("ix_company_leaderboard_snapshots_calculated_at"),
        table_name="company_leaderboard_snapshots",
    )
    op.drop_table("company_leaderboard_snapshots")
