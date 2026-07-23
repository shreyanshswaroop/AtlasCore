"""create bookmarked news items

Revision ID: 9b6d7f2a4c10
Revises: f3b0a6d47c91
Create Date: 2026-07-23 21:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9b6d7f2a4c10"
down_revision: Union[str, Sequence[str], None] = "f3b0a6d47c91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "bookmarked_news_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("news_item_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["news_item_id"], ["news_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "news_item_id",
            name="uq_bookmarked_news_items_user_news",
        ),
    )
    op.create_index(
        op.f("ix_bookmarked_news_items_news_item_id"),
        "bookmarked_news_items",
        ["news_item_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_bookmarked_news_items_user_id"),
        "bookmarked_news_items",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_bookmarked_news_items_user_id"),
        table_name="bookmarked_news_items",
    )
    op.drop_index(
        op.f("ix_bookmarked_news_items_news_item_id"),
        table_name="bookmarked_news_items",
    )
    op.drop_table("bookmarked_news_items")
