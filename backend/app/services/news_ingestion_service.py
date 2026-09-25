from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
import re
from difflib import SequenceMatcher
from urllib.parse import urljoin, urlparse

import feedparser
import httpx
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.news_source_catalog import NEWS_SOURCES, NewsSource
from app.core.topic_catalog import TOPIC_DEFINITIONS
from app.repositories.news_repository import (
    get_news_by_external_id,
    get_recent_news_duplicate_candidates,
    upsert_news_item,
)
from app.services.news_topic_classifier import classify_news_item


settings = get_settings()
near_duplicate_title_similarity_threshold = 0.92
near_duplicate_token_overlap_threshold = 0.84
minimum_duplicate_title_tokens = 5
title_suffix_pattern = re.compile(
    r"\s+[-|:]\s+("
    r"openai|google ai|google deepmind|deepmind|hugging face|github|"
    r"nvidia|mistral ai|the decoder|techcrunch|venturebeat|"
    r"mit technology review|berkeley bair|aws machine learning|"
    r"microsoft research|together ai"
    r")\s*$",
    flags=re.IGNORECASE,
)
title_noise_tokens = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "how",
    "in",
    "into",
    "is",
    "it",
    "its",
    "new",
    "of",
    "on",
    "or",
    "the",
    "to",
    "with",
}


@dataclass
class NewsIngestionResult:
    fetched: int
    processed: int
    failed: int


class OpenGraphImageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.image_url: str | None = None

    def handle_starttag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        if self.image_url is not None or tag.lower() != "meta":
            return

        attributes = {
            key.lower(): value
            for key, value in attrs
            if value is not None
        }
        meta_key = (
            attributes.get("property")
            or attributes.get("name")
            or attributes.get("itemprop")
        )

        if (
            meta_key is not None
            and meta_key.lower()
            in {"og:image", "og:image:url", "twitter:image", "image"}
        ):
            self.image_url = attributes.get("content")


class ArticleTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.article_depth = 0
        self.capture_depth = 0
        self.skip_depth = 0
        self.current_text: list[str] = []
        self.article_paragraphs: list[str] = []
        self.fallback_paragraphs: list[str] = []

    def handle_starttag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        normalized_tag = tag.lower()

        if normalized_tag in {"script", "style", "noscript", "svg"}:
            self.skip_depth += 1
            return

        if normalized_tag == "article":
            self.article_depth += 1

        if normalized_tag in {"p", "li", "blockquote"}:
            self.capture_depth += 1
            self.current_text = []

    def handle_endtag(self, tag: str) -> None:
        normalized_tag = tag.lower()

        if normalized_tag in {"script", "style", "noscript", "svg"}:
            self.skip_depth = max(0, self.skip_depth - 1)
            return

        if normalized_tag in {"p", "li", "blockquote"} and self.capture_depth:
            paragraph = " ".join(" ".join(self.current_text).split())

            if len(paragraph) >= 60:
                if self.article_depth:
                    self.article_paragraphs.append(paragraph)
                else:
                    self.fallback_paragraphs.append(paragraph)

            self.capture_depth -= 1
            self.current_text = []

        if normalized_tag == "article":
            self.article_depth = max(0, self.article_depth - 1)

    def handle_data(self, data: str) -> None:
        if self.skip_depth or not self.capture_depth:
            return

        cleaned_data = data.strip()

        if cleaned_data:
            self.current_text.append(cleaned_data)

    def get_text(self) -> str:
        paragraphs = self.article_paragraphs or self.fallback_paragraphs
        unique_paragraphs = list(dict.fromkeys(paragraphs))

        return "\n\n".join(unique_paragraphs)


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
    duplicate_title_index = build_duplicate_title_index(
        get_recent_news_duplicate_candidates(
            db=db,
            published_after=published_after,
        )
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

                    item_data = build_news_item_data(
                        source=source,
                        entry=entry,
                        published_at=published_at,
                    )

                    if is_duplicate_news_item(
                        db=db,
                        item_data=item_data,
                        duplicate_title_index=duplicate_title_index,
                    ):
                        continue

                    upsert_news_item(
                        db=db,
                        item_data=item_data,
                    )
                    add_title_to_duplicate_index(
                        duplicate_title_index,
                        item_data["title"],
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


def build_duplicate_title_index(news_items) -> list[tuple[str, frozenset[str]]]:
    return [
        title_signature(item.title)
        for item in news_items
        if item.title
    ]


def add_title_to_duplicate_index(
    duplicate_title_index: list[tuple[str, frozenset[str]]],
    title: str,
) -> None:
    duplicate_title_index.append(title_signature(title))


def is_duplicate_news_item(
    db: Session,
    item_data: dict,
    duplicate_title_index: list[tuple[str, frozenset[str]]],
) -> bool:
    if get_news_by_external_id(db, item_data["external_id"]) is not None:
        return False

    incoming_signature = title_signature(item_data["title"])

    return any(
        is_duplicate_title_signature(incoming_signature, existing_signature)
        for existing_signature in duplicate_title_index
    )


def title_signature(title: str) -> tuple[str, frozenset[str]]:
    normalized_title = normalize_news_title(title)

    return normalized_title, frozenset(
        token
        for token in normalized_title.split()
        if token not in title_noise_tokens
    )


def normalize_news_title(title: str) -> str:
    normalized_title = clean_html(title).lower()
    normalized_title = title_suffix_pattern.sub("", normalized_title)
    normalized_title = re.sub(r"https?://\S+", " ", normalized_title)
    normalized_title = re.sub(r"[^\w\s]", " ", normalized_title)
    normalized_title = re.sub(r"\s+", " ", normalized_title)

    return normalized_title.strip()


def is_duplicate_title_signature(
    incoming_signature: tuple[str, frozenset[str]],
    existing_signature: tuple[str, frozenset[str]],
) -> bool:
    incoming_title, incoming_tokens = incoming_signature
    existing_title, existing_tokens = existing_signature

    if not incoming_title or not existing_title:
        return False

    if incoming_title == existing_title:
        return True

    if (
        len(incoming_tokens) < minimum_duplicate_title_tokens
        or len(existing_tokens) < minimum_duplicate_title_tokens
    ):
        return False

    token_overlap = len(incoming_tokens & existing_tokens) / max(
        len(incoming_tokens),
        len(existing_tokens),
    )

    if token_overlap < near_duplicate_token_overlap_threshold:
        return False

    title_similarity = SequenceMatcher(
        None,
        incoming_title,
        existing_title,
    ).ratio()

    return title_similarity >= near_duplicate_title_similarity_threshold


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
    content = extract_article_content(entry)

    if not is_substantial_article_content(content, summary):
        content = fetch_article_content(source_url) or content

    content = content or summary
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
        "content": content,
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


def extract_article_content(entry) -> str:
    content_values = getattr(entry, "content", None)

    if isinstance(content_values, list):
        article_parts = [
            clean_article_text(
                getattr(item, "value", "")
                if not isinstance(item, dict)
                else item.get("value", "")
            )
            for item in content_values
        ]
        article_content = "\n\n".join(
            part
            for part in article_parts
            if part
        )

        if article_content:
            return article_content

    for field_name in ("full_content", "content", "summary_detail"):
        value = getattr(entry, field_name, None)

        if isinstance(value, dict):
            value = value.get("value", "")

        if isinstance(value, str):
            article_content = clean_article_text(value)

            if article_content:
                return article_content

    return ""


def clean_article_text(value: str) -> str:
    if not value:
        return ""

    with_breaks = re.sub(
        r"</(p|div|section|article|h[1-6]|li|blockquote)>",
        "\n\n",
        value,
        flags=re.IGNORECASE,
    )
    with_breaks = re.sub(
        r"<br\s*/?>",
        "\n",
        with_breaks,
        flags=re.IGNORECASE,
    )
    without_tags = re.sub(r"<[^>]+>", " ", with_breaks)
    paragraphs = [
        " ".join(paragraph.split())
        for paragraph in re.split(r"\n\s*\n", without_tags)
    ]

    return "\n\n".join(
        paragraph
        for paragraph in paragraphs
        if paragraph
    )


def is_substantial_article_content(
    content: str,
    summary: str,
) -> bool:
    cleaned_content = content.strip()

    if not cleaned_content:
        return False

    return len(cleaned_content) >= max(len(summary.strip()) + 240, 600)


def fetch_article_content(source_url: str) -> str | None:
    try:
        response = httpx.get(
            source_url,
            follow_redirects=True,
            timeout=8,
            headers={
                "User-Agent": "AtlasCoreBot/0.1",
            },
        )
        response.raise_for_status()
    except Exception:
        return None

    parser = ArticleTextParser()
    parser.feed(response.text[:600_000])
    article_content = parser.get_text()

    return article_content or None


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
    parser = OpenGraphImageParser()
    parser.feed(html)

    if parser.image_url:
        image_url = urljoin(source_url, parser.image_url)

        if is_valid_article_image_url(image_url, source):
            return image_url

    return None
