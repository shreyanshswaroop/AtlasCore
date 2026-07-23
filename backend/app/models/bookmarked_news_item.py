from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BookmarkedNewsItem(Base):
    __tablename__ = "bookmarked_news_items"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "news_item_id",
            name="uq_bookmarked_news_items_user_news",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    news_item_id: Mapped[int] = mapped_column(
        ForeignKey("news_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    list_id: Mapped[int | None] = mapped_column(
        ForeignKey("bookmark_lists.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
