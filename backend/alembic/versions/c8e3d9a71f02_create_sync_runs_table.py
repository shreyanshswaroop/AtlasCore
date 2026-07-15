"""create sync runs table

Revision ID: c8e3d9a71f02
Revises: b7f1a42c2c4d
Create Date: 2026-07-15 14:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8e3d9a71f02"
down_revision: Union[str, Sequence[str], None] = "b7f1a42c2c4d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sync_runs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("fetched", sa.Integer(), nullable=False),
        sa.Column("processed", sa.Integer(), nullable=False),
        sa.Column("failed", sa.Integer(), nullable=False),
        sa.Column("total_items", sa.Integer(), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sync_runs_started_at"), "sync_runs", ["started_at"], unique=False)
    op.create_index(op.f("ix_sync_runs_status"), "sync_runs", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_sync_runs_status"), table_name="sync_runs")
    op.drop_index(op.f("ix_sync_runs_started_at"), table_name="sync_runs")
    op.drop_table("sync_runs")
