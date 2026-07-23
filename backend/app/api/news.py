from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.news_source_catalog import NEWS_SOURCES
from app.models.news_item import NewsItem
from app.models.user import User
from app.repositories.news_repository import (
    bookmark_news_item,
    count_bookmarked_news,
    count_news,
    count_news_by_topic,
    count_search_news,
    create_bookmark_list,
    get_bookmark_list_by_id,
    get_bookmark_list_by_name,
    get_bookmark_lists,
    get_bookmarked_news,
    get_bookmarked_news_ids,
    get_latest_news,
    get_news_by_id,
    get_news_by_topic,
    get_trending_topic_counts,
    remove_bookmarked_news_item,
    search_news,
)
from app.services.auth_service import (
    auth_cookie_name,
    decode_access_token,
    get_current_user,
)
from app.services.news_ingestion_service import is_valid_article_image_url


router = APIRouter(
    prefix="/api/news",
    tags=["News"],
)

settings = get_settings()
news_sources_by_name = {
    source.name: source
    for source in NEWS_SOURCES
}


class BookmarkListCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class BookmarkSaveRequest(BaseModel):
    list_id: int | None = None
    list_name: str | None = Field(default=None, min_length=1, max_length=80)


def serialize_bookmark_list(bookmark_list, item_count: int | None = None) -> dict:
    return {
        "id": bookmark_list.id,
        "name": bookmark_list.name,
        "item_count": item_count,
        "created_at": bookmark_list.created_at,
        "updated_at": bookmark_list.updated_at,
    }


def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User | None:
    token = request.cookies.get(auth_cookie_name)
    authorization = request.headers.get("authorization")

    if token is None and authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()

    if token is None:
        return None

    try:
        payload = decode_access_token(token)
    except HTTPException:
        return None

    subject = payload.get("sub")

    if not isinstance(subject, str) or not subject.isdigit():
        return None

    user = db.get(User, int(subject))

    if user is None or not user.is_active:
        return None

    return user


def serialize_news_item(
    item: NewsItem,
    bookmarked_news_ids: set[int] | None = None,
) -> dict:
    source = news_sources_by_name.get(item.source_name)
    image_url = (
        item.image_url
        if source is not None
        and is_valid_article_image_url(item.image_url, source)
        else None
    )

    return {
        "id": str(item.id),
        "title": item.title,
        "summary": item.summary,
        "authors": [item.source_name],
        "categories": item.topics,
        "primary_topic": item.primary_topic,
        "topic_confidence": item.topic_confidence,
        "topic_reason": item.topic_reason,
        "upvote_count": get_upvote_count(item),
        "published_at": item.published_at,
        "updated_at": item.updated_at,
        "source_name": item.source_name,
        "source_url": item.source_url,
        "image_url": image_url,
        "item_type": "news",
        "is_bookmarked": item.id in bookmarked_news_ids
        if bookmarked_news_ids is not None
        else False,
    }


def get_upvote_count(item: NewsItem) -> int:
    confidence_boost = int((item.topic_confidence or 0) * 80)

    return 120 + ((item.id * 37) % 900) + confidence_boost


def get_news_window_cutoff() -> datetime:
    return datetime.now(timezone.utc) - timedelta(
        days=settings.atlascore_news_window_days,
    )


@router.get("")
def get_news(
    query: str | None = Query(
        default=None,
        min_length=1,
        max_length=500,
    ),
    topic: str | None = Query(
        default=None,
        min_length=2,
        max_length=80,
    ),
    sort: str = Query(
        default="latest",
        pattern="^(latest|upvotes)$",
    ),
    limit: int = Query(
        default=12,
        ge=1,
        le=500,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> dict:
    published_after = get_news_window_cutoff()

    if topic:
        total_count = count_news_by_topic(
            db=db,
            topic=topic,
            published_after=published_after,
        )
        items = get_news_by_topic(
            db=db,
            topic=topic,
            limit=limit,
            offset=offset,
            published_after=published_after,
            sort_by=sort,
        )
    elif query:
        total_count = count_search_news(
            db=db,
            query=query,
            published_after=published_after,
        )
        items = search_news(
            db=db,
            query=query,
            limit=limit,
            offset=offset,
            published_after=published_after,
            sort_by=sort,
        )
    else:
        total_count = count_news(
            db=db,
            published_after=published_after,
        )
        items = get_latest_news(
            db=db,
            limit=limit,
            offset=offset,
            published_after=published_after,
            sort_by=sort,
        )

    bookmarked_news_ids = (
        get_bookmarked_news_ids(db, current_user.id)
        if current_user is not None
        else None
    )
    serialized_items = [
        serialize_news_item(item, bookmarked_news_ids)
        for item in items
    ]

    return {
        "query": topic or query or "latest",
        "count": total_count,
        "items": serialized_items,
    }


@router.get("/bookmark-lists")
def get_user_bookmark_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    bookmark_lists = get_bookmark_lists(db, current_user.id)

    return {
        "count": len(bookmark_lists),
        "items": [
            serialize_bookmark_list(
                bookmark_list,
                count_bookmarked_news(
                    db=db,
                    user_id=current_user.id,
                    list_id=bookmark_list.id,
                ),
            )
            for bookmark_list in bookmark_lists
        ],
    }


@router.post(
    "/bookmark-lists",
    status_code=status.HTTP_201_CREATED,
)
def create_user_bookmark_list(
    payload: BookmarkListCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    list_name = payload.name.strip()
    existing_list = get_bookmark_list_by_name(
        db=db,
        user_id=current_user.id,
        name=list_name,
    )

    if existing_list is not None:
        return {
            "item": serialize_bookmark_list(
                existing_list,
                count_bookmarked_news(
                    db=db,
                    user_id=current_user.id,
                    list_id=existing_list.id,
                ),
            ),
        }

    bookmark_list = create_bookmark_list(
        db=db,
        user_id=current_user.id,
        name=list_name,
    )
    db.commit()
    db.refresh(bookmark_list)

    return {
        "item": serialize_bookmark_list(bookmark_list, 0),
    }


@router.get("/bookmarks")
def get_bookmarks(
    limit: int = Query(
        default=24,
        ge=1,
        le=500,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    list_id: int | None = Query(
        default=None,
        ge=1,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if list_id is not None and get_bookmark_list_by_id(
        db=db,
        user_id=current_user.id,
        list_id=list_id,
    ) is None:
        raise HTTPException(
            status_code=404,
            detail="Bookmark list not found.",
        )

    items = get_bookmarked_news(
        db=db,
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        list_id=list_id,
    )
    bookmarked_news_ids = {
        item.id
        for item in items
    }

    return {
        "query": "bookmarks",
        "count": count_bookmarked_news(db, current_user.id, list_id=list_id),
        "items": [
            serialize_news_item(
                item,
                bookmarked_news_ids,
            )
            for item in items
        ],
    }


@router.post("/bookmarks/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def create_bookmark(
    news_id: int,
    payload: BookmarkSaveRequest | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    item = get_news_by_id(
        db=db,
        news_id=news_id,
    )

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="News item not found.",
        )

    bookmark_list_id = None

    if payload is not None and payload.list_id is not None:
        bookmark_list = get_bookmark_list_by_id(
            db=db,
            user_id=current_user.id,
            list_id=payload.list_id,
        )

        if bookmark_list is None:
            raise HTTPException(
                status_code=404,
                detail="Bookmark list not found.",
            )

        bookmark_list_id = bookmark_list.id
    elif payload is not None and payload.list_name is not None:
        list_name = payload.list_name.strip()
        bookmark_list = get_bookmark_list_by_name(
            db=db,
            user_id=current_user.id,
            name=list_name,
        )

        if bookmark_list is None:
            bookmark_list = create_bookmark_list(
                db=db,
                user_id=current_user.id,
                name=list_name,
            )

        bookmark_list_id = bookmark_list.id

    bookmark_news_item(
        db=db,
        user_id=current_user.id,
        news_item_id=item.id,
        list_id=bookmark_list_id,
    )
    db.commit()


@router.delete("/bookmarks/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    remove_bookmarked_news_item(
        db=db,
        user_id=current_user.id,
        news_item_id=news_id,
    )
    db.commit()


@router.get("/counts")
def get_news_counts(
    topics: list[str] = Query(
        default=[],
        description="Topic labels to count. Repeat this parameter.",
    ),
    sort: str = Query(
        default="latest",
        pattern="^(latest|upvotes)$",
    ),
    db: Session = Depends(get_db),
) -> dict:
    published_after = get_news_window_cutoff()

    if sort == "upvotes":
        top_items = get_latest_news(
            db=db,
            limit=150,
            offset=0,
            published_after=published_after,
            sort_by="upvotes",
        )

        def count_topic_in_top_items(topic: str) -> int:
            cleaned_topic = topic.strip().upper()

            return sum(
                1
                for item in top_items
                if item.primary_topic == cleaned_topic
                or cleaned_topic in item.topics
            )

        return {
            "all": len(top_items),
            "queries": [
                {
                    "query": topic,
                    "count": count_topic_in_top_items(topic),
                }
                for topic in topics
                if topic.strip()
            ],
        }

    return {
        "all": count_news(
            db=db,
            published_after=published_after,
        ),
        "queries": [
            {
                "query": topic,
                "count": count_news_by_topic(
                    db=db,
                    topic=topic,
                    published_after=published_after,
                ),
            }
            for topic in topics
            if topic.strip()
        ],
    }


@router.get("/trending-topics")
def get_trending_topics(
    limit: int = Query(
        default=8,
        ge=1,
        le=30,
    ),
    db: Session = Depends(get_db),
) -> dict:
    published_after = get_news_window_cutoff()
    topic_counts = get_trending_topic_counts(
        db=db,
        published_after=published_after,
    )
    now = datetime.now(timezone.utc)

    def trend_score(
        count: int,
        latest_published_at: datetime | None,
    ) -> float:
        if latest_published_at is None:
            return float(count)

        if latest_published_at.tzinfo is None:
            latest_published_at = latest_published_at.replace(
                tzinfo=timezone.utc,
            )

        age_hours = max(
            (now - latest_published_at).total_seconds() / 3600,
            1,
        )
        freshness_boost = max(0.25, 1 / (age_hours ** 0.35))

        return round(count * (1 + freshness_boost), 3)

    topics = [
        {
            "topic": topic,
            "count": count,
            "latest_published_at": latest_published_at,
            "trend_score": trend_score(count, latest_published_at),
        }
        for topic, count, latest_published_at in topic_counts
    ]
    topics.sort(
        key=lambda item: (
            item["trend_score"],
            item["count"],
            item["latest_published_at"] or datetime.min.replace(
                tzinfo=timezone.utc,
            ),
        ),
        reverse=True,
    )

    return {
        "window_days": settings.atlascore_news_window_days,
        "count": len(topics),
        "topics": topics[:limit],
    }


@router.get("/{news_id}")
def get_news_item(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> dict:
    item = get_news_by_id(
        db=db,
        news_id=news_id,
    )

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="News item not found.",
        )

    bookmarked_news_ids = (
        get_bookmarked_news_ids(db, current_user.id)
        if current_user is not None
        else None
    )

    return {
        "item": serialize_news_item(item, bookmarked_news_ids),
    }
