"""add bookmark lists

Revision ID: 41c8b2d9e714
Revises: 9b6d7f2a4c10
Create Date: 2026-07-23 21:35:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "41c8b2d9e714"
down_revision: Union[str, Sequence[str], None] = "9b6d7f2a4c10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "bookmark_lists",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "name", name="uq_bookmark_lists_user_name"),
    )
    op.create_index(
        op.f("ix_bookmark_lists_user_id"),
        "bookmark_lists",
        ["user_id"],
        unique=False,
    )
    op.add_column(
        "bookmarked_news_items",
        sa.Column("list_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        op.f("ix_bookmarked_news_items_list_id"),
        "bookmarked_news_items",
        ["list_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_bookmarked_news_items_list_id_bookmark_lists",
        "bookmarked_news_items",
        "bookmark_lists",
        ["list_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_bookmarked_news_items_list_id_bookmark_lists",
        "bookmarked_news_items",
        type_="foreignkey",
    )
    op.drop_index(
        op.f("ix_bookmarked_news_items_list_id"),
        table_name="bookmarked_news_items",
    )
    op.drop_column("bookmarked_news_items", "list_id")
    op.drop_index(op.f("ix_bookmark_lists_user_id"), table_name="bookmark_lists")
    op.drop_table("bookmark_lists")
