from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import desc, func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.news_item import NewsItem


def upsert_news_item(
    db: Session,
    item_data: dict,
) -> NewsItem:
    statement = insert(NewsItem).values(
        external_id=item_data["external_id"],
        title=item_data["title"],
        summary=item_data["summary"],
        source_name=item_data["source_name"],
        source_url=item_data["source_url"],
        image_url=item_data.get("image_url"),
        topics=item_data["topics"],
        primary_topic=item_data["primary_topic"],
        topic_confidence=item_data["topic_confidence"],
        tagging_model=item_data["tagging_model"],
        topic_reason=item_data["topic_reason"],
        published_at=item_data["published_at"],
    )

    statement = statement.on_conflict_do_update(
        index_elements=[NewsItem.external_id],
        set_={
            "title": statement.excluded.title,
            "summary": statement.excluded.summary,
            "source_name": statement.excluded.source_name,
            "source_url": statement.excluded.source_url,
            "image_url": statement.excluded.image_url,
            "topics": statement.excluded.topics,
            "primary_topic": statement.excluded.primary_topic,
            "topic_confidence": statement.excluded.topic_confidence,
            "tagging_model": statement.excluded.tagging_model,
            "topic_reason": statement.excluded.topic_reason,
            "published_at": statement.excluded.published_at,
        },
    ).returning(NewsItem)

    return db.execute(statement).scalar_one()


def get_latest_news(
    db: Session,
    limit: int,
    offset: int,
    published_after: datetime | None = None,
) -> Sequence[NewsItem]:
    statement = select(NewsItem)

    if published_after is not None:
        statement = statement.where(NewsItem.published_at >= published_after)

    statement = (
        statement.order_by(desc(NewsItem.published_at))
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(statement).all()


def search_news(
    db: Session,
    query: str,
    limit: int,
    offset: int,
    published_after: datetime | None = None,
) -> Sequence[NewsItem]:
    statement = select(NewsItem).where(build_news_search_condition(query))

    if published_after is not None:
        statement = statement.where(NewsItem.published_at >= published_after)

    statement = (
        statement.order_by(desc(NewsItem.published_at))
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(statement).all()


def get_news_by_topic(
    db: Session,
    topic: str,
    limit: int,
    offset: int,
    published_after: datetime | None = None,
) -> Sequence[NewsItem]:
    statement = select(NewsItem).where(build_topic_condition(topic))

    if published_after is not None:
        statement = statement.where(NewsItem.published_at >= published_after)

    statement = (
        statement.order_by(desc(NewsItem.published_at))
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(statement).all()


def get_news_by_id(
    db: Session,
    news_id: int,
) -> NewsItem | None:
    statement = select(NewsItem).where(NewsItem.id == news_id)

    return db.scalar(statement)


def count_news(
    db: Session,
    published_after: datetime | None = None,
) -> int:
    statement = select(func.count()).select_from(NewsItem)

    if published_after is not None:
        statement = statement.where(NewsItem.published_at >= published_after)

    return db.scalar(statement) or 0


def count_search_news(
    db: Session,
    query: str,
    published_after: datetime | None = None,
) -> int:
    statement = (
        select(func.count())
        .select_from(NewsItem)
        .where(build_news_search_condition(query))
    )

    if published_after is not None:
        statement = statement.where(NewsItem.published_at >= published_after)

    return db.scalar(statement) or 0


def count_news_by_topic(
    db: Session,
    topic: str,
    published_after: datetime | None = None,
) -> int:
    statement = (
        select(func.count())
        .select_from(NewsItem)
        .where(build_topic_condition(topic))
    )

    if published_after is not None:
        statement = statement.where(NewsItem.published_at >= published_after)

    return db.scalar(statement) or 0


def build_topic_condition(topic: str):
    cleaned_topic = topic.strip().upper()

    return or_(
        NewsItem.primary_topic == cleaned_topic,
        NewsItem.topics.any(cleaned_topic),
    )


def build_news_search_condition(query: str):
    aliases = [
        alias.strip()
        for alias in query.split("|")
        if alias.strip()
    ]

    if not aliases:
        aliases = [query.strip()]

    conditions = []

    for alias in aliases:
        pattern = f"%{alias}%"
        conditions.append(NewsItem.title.ilike(pattern))
        conditions.append(NewsItem.summary.ilike(pattern))
        conditions.append(NewsItem.source_name.ilike(pattern))
        conditions.append(
            func.array_to_string(
                NewsItem.topics,
                " ",
            ).ilike(pattern)
        )

    return or_(*conditions)
