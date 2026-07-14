from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.news_source_catalog import NEWS_SOURCES
from app.models.news_item import NewsItem
from app.repositories.news_repository import (
    count_news,
    count_news_by_topic,
    count_search_news,
    get_latest_news,
    get_news_by_id,
    get_news_by_topic,
    search_news,
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


def serialize_news_item(item: NewsItem) -> dict:
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
        "published_at": item.published_at,
        "updated_at": item.updated_at,
        "source_name": item.source_name,
        "source_url": item.source_url,
        "image_url": image_url,
        "item_type": "news",
    }


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
        )

    serialized_items = [
        serialize_news_item(item)
        for item in items
    ]

    return {
        "query": topic or query or "latest",
        "count": total_count,
        "items": serialized_items,
    }


@router.get("/counts")
def get_news_counts(
    topics: list[str] = Query(
        default=[],
        description="Topic labels to count. Repeat this parameter.",
    ),
    db: Session = Depends(get_db),
) -> dict:
    published_after = get_news_window_cutoff()

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


@router.get("/{news_id}")
def get_news_item(
    news_id: int,
    db: Session = Depends(get_db),
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

    return {
        "item": serialize_news_item(item),
    }
