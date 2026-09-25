"""add news item content

Revision ID: 5e8a1f4d9c2b
Revises: 41c8b2d9e714
Create Date: 2026-08-06 01:10:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5e8a1f4d9c2b"
down_revision: Union[str, Sequence[str], None] = "41c8b2d9e714"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "news_items",
        sa.Column(
            "content",
            sa.Text(),
            nullable=False,
            server_default="",
        ),
    )
    op.execute("UPDATE news_items SET content = summary WHERE content = ''")
    op.alter_column("news_items", "content", server_default=None)


def downgrade() -> None:
    op.drop_column("news_items", "content")
