from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import delete, desc, func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.bookmark_list import BookmarkList
from app.models.bookmarked_news_item import BookmarkedNewsItem
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


def get_news_by_external_id(
    db: Session,
    external_id: str,
) -> NewsItem | None:
    statement = select(NewsItem).where(NewsItem.external_id == external_id)

    return db.scalar(statement)


def get_recent_news_duplicate_candidates(
    db: Session,
    published_after: datetime | None = None,
) -> Sequence[NewsItem]:
    statement = select(NewsItem)

    if published_after is not None:
        statement = statement.where(NewsItem.published_at >= published_after)

    return db.scalars(statement).all()


def get_latest_news(
    db: Session,
    limit: int,
    offset: int,
    published_after: datetime | None = None,
    sort_by: str = "latest",
) -> Sequence[NewsItem]:
    statement = select(NewsItem)

    if published_after is not None:
        statement = statement.where(NewsItem.published_at >= published_after)

    statement = (
        apply_news_order(statement, sort_by)
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
    sort_by: str = "latest",
) -> Sequence[NewsItem]:
    statement = select(NewsItem).where(build_news_search_condition(query))

    if published_after is not None:
        statement = statement.where(NewsItem.published_at >= published_after)

    statement = (
        apply_news_order(statement, sort_by)
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
    sort_by: str = "latest",
) -> Sequence[NewsItem]:
    statement = select(NewsItem).where(build_topic_condition(topic))

    if published_after is not None:
        statement = statement.where(NewsItem.published_at >= published_after)

    statement = (
        apply_news_order(statement, sort_by)
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(statement).all()


def get_news_by_topics(
    db: Session,
    topics: Sequence[str],
    published_after: datetime | None = None,
) -> Sequence[NewsItem]:
    cleaned_topics = [
        topic.strip()
        for topic in topics
        if topic.strip()
    ]

    if not cleaned_topics:
        return []

    statement = select(NewsItem).where(
        or_(
            *(
                build_topic_condition(topic)
                for topic in cleaned_topics
            )
        )
    )

    if published_after is not None:
        statement = statement.where(NewsItem.published_at >= published_after)

    return db.scalars(statement).all()


def get_news_by_id(
    db: Session,
    news_id: int,
) -> NewsItem | None:
    statement = select(NewsItem).where(NewsItem.id == news_id)

    return db.scalar(statement)


def get_bookmarked_news_ids(
    db: Session,
    user_id: int,
) -> set[int]:
    statement = select(BookmarkedNewsItem.news_item_id).where(
        BookmarkedNewsItem.user_id == user_id,
    )

    return set(db.scalars(statement).all())


def get_bookmarked_news(
    db: Session,
    user_id: int,
    limit: int,
    offset: int,
    list_id: int | None = None,
) -> Sequence[NewsItem]:
    statement = (
        select(NewsItem)
        .join(
            BookmarkedNewsItem,
            BookmarkedNewsItem.news_item_id == NewsItem.id,
        )
        .where(BookmarkedNewsItem.user_id == user_id)
    )

    if list_id is not None:
        statement = statement.where(BookmarkedNewsItem.list_id == list_id)

    statement = statement.order_by(desc(BookmarkedNewsItem.created_at)).offset(offset).limit(limit)

    return db.scalars(statement).all()


def count_bookmarked_news(
    db: Session,
    user_id: int,
    list_id: int | None = None,
) -> int:
    statement = (
        select(func.count())
        .select_from(BookmarkedNewsItem)
        .where(BookmarkedNewsItem.user_id == user_id)
    )

    if list_id is not None:
        statement = statement.where(BookmarkedNewsItem.list_id == list_id)

    return db.scalar(statement) or 0


def get_bookmark_lists(
    db: Session,
    user_id: int,
) -> Sequence[BookmarkList]:
    statement = (
        select(BookmarkList)
        .where(BookmarkList.user_id == user_id)
        .order_by(desc(BookmarkList.updated_at), BookmarkList.name)
    )

    return db.scalars(statement).all()


def get_bookmark_list_by_id(
    db: Session,
    user_id: int,
    list_id: int,
) -> BookmarkList | None:
    statement = select(BookmarkList).where(
        BookmarkList.id == list_id,
        BookmarkList.user_id == user_id,
    )

    return db.scalar(statement)


def get_bookmark_list_by_name(
    db: Session,
    user_id: int,
    name: str,
) -> BookmarkList | None:
    statement = select(BookmarkList).where(
        BookmarkList.user_id == user_id,
        func.lower(BookmarkList.name) == name.strip().lower(),
    )

    return db.scalar(statement)


def create_bookmark_list(
    db: Session,
    user_id: int,
    name: str,
) -> BookmarkList:
    bookmark_list = BookmarkList(
        user_id=user_id,
        name=name.strip(),
    )
    db.add(bookmark_list)
    db.flush()

    return bookmark_list


def bookmark_news_item(
    db: Session,
    user_id: int,
    news_item_id: int,
    list_id: int | None = None,
) -> None:
    statement = insert(BookmarkedNewsItem).values(
        user_id=user_id,
        news_item_id=news_item_id,
        list_id=list_id,
    )
    statement = statement.on_conflict_do_update(
        constraint="uq_bookmarked_news_items_user_news",
        set_={
            "list_id": statement.excluded.list_id,
        },
    )
    db.execute(statement)


def remove_bookmarked_news_item(
    db: Session,
    user_id: int,
    news_item_id: int,
) -> None:
    statement = delete(BookmarkedNewsItem).where(
        BookmarkedNewsItem.user_id == user_id,
        BookmarkedNewsItem.news_item_id == news_item_id,
    )
    db.execute(statement)


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


def get_trending_topic_counts(
    db: Session,
    published_after: datetime | None = None,
) -> list[tuple[str, int, datetime | None]]:
    statement = (
        select(
            NewsItem.primary_topic,
            func.count(NewsItem.id),
            func.max(NewsItem.published_at),
        )
        .where(NewsItem.primary_topic.is_not(None))
        .group_by(NewsItem.primary_topic)
    )

    if published_after is not None:
        statement = statement.where(NewsItem.published_at >= published_after)

    return [
        (topic, count, latest_published_at)
        for topic, count, latest_published_at in db.execute(statement).all()
        if topic
    ]


def build_topic_condition(topic: str):
    cleaned_topic = topic.strip().upper()

    return or_(
        NewsItem.primary_topic == cleaned_topic,
        (
            NewsItem.primary_topic.is_(None)
            & NewsItem.topics.any(cleaned_topic)
        ),
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


def build_upvote_score_expression():
    return (
        120
        + ((NewsItem.id * 37) % 900)
        + (func.coalesce(NewsItem.topic_confidence, 0) * 80)
    )


def apply_news_order(statement, sort_by: str):
    if sort_by == "upvotes":
        return statement.order_by(
            desc(build_upvote_score_expression()),
            desc(NewsItem.published_at),
        )

    return statement.order_by(desc(NewsItem.published_at))
