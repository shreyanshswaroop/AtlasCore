"""add news topic tags

Revision ID: b7f1a42c2c4d
Revises: a1d2f4f1c9a0
Create Date: 2026-07-14 01:10:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7f1a42c2c4d"
down_revision: Union[str, Sequence[str], None] = "a1d2f4f1c9a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "news_items",
        sa.Column("primary_topic", sa.String(length=80), nullable=True),
    )
    op.add_column(
        "news_items",
        sa.Column("topic_confidence", sa.Float(), nullable=True),
    )
    op.add_column(
        "news_items",
        sa.Column("tagging_model", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "news_items",
        sa.Column("topic_reason", sa.Text(), nullable=True),
    )
    op.create_index(
        op.f("ix_news_items_primary_topic"),
        "news_items",
        ["primary_topic"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_news_items_primary_topic"), table_name="news_items")
    op.drop_column("news_items", "topic_reason")
    op.drop_column("news_items", "tagging_model")
    op.drop_column("news_items", "topic_confidence")
    op.drop_column("news_items", "primary_topic")
