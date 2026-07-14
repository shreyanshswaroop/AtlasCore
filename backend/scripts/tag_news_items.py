import argparse
import sys
from pathlib import Path

from sqlalchemy import select

BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.core.news_source_catalog import NEWS_SOURCES
from app.models.news_item import NewsItem
from app.services.news_topic_classifier import classify_news_item


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Classify existing AtlasCore news items into curated topics."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=500,
        help="Maximum number of news items to classify.",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_arguments()
    processed = 0

    sources_by_name = {
        source.name: source
        for source in NEWS_SOURCES
    }

    with SessionLocal() as db:
        items = db.scalars(
            select(NewsItem)
            .order_by(NewsItem.published_at.desc())
            .limit(args.limit)
        ).all()

        for item in items:
            classification = classify_news_item(
                title=item.title,
                summary=item.summary,
                source=sources_by_name.get(item.source_name),
            )

            item.primary_topic = classification.primary_topic
            item.topics = classification.topics
            item.topic_confidence = classification.confidence
            item.tagging_model = classification.model_name
            item.topic_reason = classification.reason
            processed += 1

        db.commit()

    print("News topic tagging completed")
    print(f"Processed: {processed}")


if __name__ == "__main__":
    main()
