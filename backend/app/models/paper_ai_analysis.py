from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PaperAIAnalysis(Base):
    __tablename__ = "paper_ai_analyses"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    paper_id: Mapped[int] = mapped_column(
        ForeignKey("papers.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    executive_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    why_it_matters: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    difficulty: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    reading_time_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    key_contributions: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
    )

    limitations: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
    )

    use_cases: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
    )

    prerequisites: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
    )

    target_roles: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
    )

    model_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    paper = relationship(
        "Paper",
        back_populates="ai_analysis",
    )