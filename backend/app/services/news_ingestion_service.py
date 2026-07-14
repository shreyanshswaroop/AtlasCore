from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
import re
from urllib.parse import urljoin, urlparse

import feedparser
import httpx
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.news_source_catalog import NEWS_SOURCES, NewsSource
from app.core.topic_catalog import TOPIC_DEFINITIONS
from app.repositories.news_repository import upsert_news_item
from app.services.news_topic_classifier import classify_news_item


settings = get_settings()


@dataclass
class NewsIngestionResult:
    fetched: int
    processed: int
    failed: int


def ingest_news(
    db: Session,
    max_items_per_source: int = 30,
) -> NewsIngestionResult:
    fetched = 0
    processed = 0
    failed = 0
    published_after = datetime.now(timezone.utc) - timedelta(
        days=settings.atlascore_news_window_days,
    )

    try:
        for source in NEWS_SOURCES:
            try:
                feed = fetch_feed(source.feed_url)
            except Exception:
                failed += 1
                continue

            entries = list(feed.entries[:max_items_per_source])
            fetched += len(entries)

            for entry in entries:
                try:
                    published_at = parse_entry_date(entry)

                    if published_at < published_after:
                        continue

                    upsert_news_item(
                        db=db,
                        item_data=build_news_item_data(
                            source=source,
                            entry=entry,
                            published_at=published_at,
                        ),
                    )
                    processed += 1
                except Exception:
                    failed += 1

        db.commit()
    except Exception:
        db.rollback()
        raise

    return NewsIngestionResult(
        fetched=fetched,
        processed=processed,
        failed=failed,
    )


def fetch_feed(feed_url: str):
    response = httpx.get(
        feed_url,
        follow_redirects=True,
        timeout=12,
        headers={
            "User-Agent": "AtlasCoreBot/0.1",
        },
    )
    response.raise_for_status()

    return feedparser.parse(response.content)


def build_news_item_data(
    source: NewsSource,
    entry,
    published_at: datetime | None = None,
) -> dict:
    title = clean_html(getattr(entry, "title", "Untitled"))
    summary = clean_html(
        getattr(entry, "summary", "")
        or getattr(entry, "description", "")
    )
    source_url = getattr(entry, "link", source.feed_url)
    if published_at is None:
        published_at = parse_entry_date(entry)
    classification = classify_news_item(
        title=title,
        summary=summary,
        source=source,
    )
    image_url = extract_image_url(entry, source, source_url)

    if image_url is None and settings.atlascore_news_fetch_og_images:
        image_url = fetch_open_graph_image(source, source_url)

    return {
        "external_id": getattr(entry, "id", None) or source_url,
        "title": title,
        "summary": summary,
        "source_name": source.name,
        "source_url": source_url,
        "image_url": image_url,
        "topics": classification.topics,
        "primary_topic": classification.primary_topic,
        "topic_confidence": classification.confidence,
        "tagging_model": classification.model_name,
        "topic_reason": classification.reason,
        "published_at": published_at,
    }


def clean_html(value: str) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", value)

    return " ".join(without_tags.split())


def parse_entry_date(entry) -> datetime:
    for field_name in ("published", "updated", "created"):
        value = getattr(entry, field_name, None)

        if value:
            parsed = parsedate_to_datetime(value)

            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)

            return parsed

    return datetime.now(timezone.utc)


def extract_image_url(
    entry,
    source: NewsSource,
    source_url: str,
) -> str | None:
    media_content = getattr(entry, "media_content", None)

    if media_content:
        for media in media_content:
            image_url = get_feed_image_candidate(media, source_url)

            if is_valid_article_image_url(image_url, source):
                return image_url

    media_thumbnail = getattr(entry, "media_thumbnail", None)

    if media_thumbnail:
        for thumbnail in media_thumbnail:
            image_url = get_feed_image_candidate(thumbnail, source_url)

            if is_valid_article_image_url(image_url, source):
                return image_url

    links = getattr(entry, "links", [])

    for link in links:
        if getattr(link, "type", "").startswith("image/"):
            image_url = getattr(link, "href", None)
            image_url = urljoin(source_url, image_url) if image_url else None

            if is_valid_article_image_url(image_url, source):
                return image_url

    for field_name in ("summary", "content"):
        value = getattr(entry, field_name, None)

        if isinstance(value, list):
            value = " ".join(
                getattr(item, "value", "")
                if not isinstance(item, dict)
                else item.get("value", "")
                for item in value
            )

        if isinstance(value, str):
            image_match = re.search(
                r'<img[^>]+src=["\']([^"\']+)["\']',
                value,
                flags=re.IGNORECASE,
            )

            if image_match:
                image_url = urljoin(source_url, image_match.group(1))

                if is_valid_article_image_url(image_url, source):
                    return image_url

    return None


def get_feed_image_candidate(
    value,
    source_url: str,
) -> str | None:
    if not isinstance(value, dict):
        return None

    image_url = value.get("url")

    if not image_url:
        return None

    width = parse_dimension(value.get("width"))
    height = parse_dimension(value.get("height"))

    if width is not None and width < 280:
        return None

    if height is not None and height < 140:
        return None

    return urljoin(source_url, image_url)


def parse_dimension(value) -> int | None:
    if value is None:
        return None

    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def is_valid_article_image_url(
    image_url: str | None,
    source: NewsSource,
) -> bool:
    if not image_url:
        return False

    normalized_url = image_url.strip()

    if not normalized_url:
        return False

    if source.logo_url and normalized_url == source.logo_url:
        return False

    parsed = urlparse(normalized_url)
    path = parsed.path.lower()
    filename = path.rsplit("/", 1)[-1]

    blocked_fragments = (
        "favicon",
        "apple-touch-icon",
        "site-icon",
        "logo",
        "brand",
        "avatar",
        "cropped-cropped",
    )

    return not any(
        fragment in filename
        for fragment in blocked_fragments
    )


def fetch_open_graph_image(
    source: NewsSource,
    source_url: str,
) -> str | None:
    try:
        response = httpx.get(
            source_url,
            follow_redirects=True,
            timeout=6,
            headers={
                "User-Agent": "AtlasCoreBot/0.1",
            },
        )
        response.raise_for_status()
    except Exception:
        return None

    html = response.text[:200_000]

    for property_name in ("og:image", "twitter:image"):
        image_match = re.search(
            (
                r'<meta[^>]+(?:property|name)=["\']'
                + re.escape(property_name)
                + r'["\'][^>]+content=["\']([^"\']+)["\']'
            ),
            html,
            flags=re.IGNORECASE,
        )

        if image_match:
            image_url = urljoin(source_url, image_match.group(1))

            if is_valid_article_image_url(image_url, source):
                return image_url

    return None
