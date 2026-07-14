from dataclasses import dataclass
import re

from app.core.news_source_catalog import NewsSource
from app.core.topic_catalog import TOPIC_DEFINITIONS


TAGGING_MODEL = "atlascore-topic-rules-v1"


@dataclass(frozen=True)
class TopicClassification:
    primary_topic: str
    topics: list[str]
    confidence: float
    reason: str
    model_name: str = TAGGING_MODEL


def classify_news_item(
    title: str,
    summary: str,
    source: NewsSource | None = None,
) -> TopicClassification:
    text = normalize_text(f"{title} {summary}")
    source_topics = set(source.default_topics if source else ())
    scores: dict[str, float] = {}
    reasons: dict[str, list[str]] = {}

    for topic in TOPIC_DEFINITIONS:
        topic_score = 0.0
        matched_aliases: list[str] = []

        for alias in topic.aliases:
            normalized_alias = normalize_text(alias)

            if not normalized_alias:
                continue

            if re.search(rf"\b{re.escape(normalized_alias)}\b", text):
                matched_aliases.append(alias)
                topic_score += 3.0 if " " in normalized_alias else 1.5

        if topic.label in source_topics:
            topic_score += 1.0
            matched_aliases.append(f"source:{topic.label}")

        if topic_score > 0:
            scores[topic.label] = topic_score
            reasons[topic.label] = matched_aliases

    if not scores:
        fallback_topic = next(iter(source_topics), "LLMS")

        return TopicClassification(
            primary_topic=fallback_topic,
            topics=[fallback_topic],
            confidence=0.35,
            reason="Fallback topic from source defaults.",
        )

    ranked_topics = sorted(
        scores.items(),
        key=lambda item: item[1],
        reverse=True,
    )
    primary_topic = ranked_topics[0][0]
    selected_topics = [
        topic
        for topic, _score in ranked_topics[:3]
    ]
    max_score = ranked_topics[0][1]
    confidence = min(
        0.95,
        0.45 + (max_score / 12),
    )

    return TopicClassification(
        primary_topic=primary_topic,
        topics=selected_topics,
        confidence=round(confidence, 2),
        reason=(
            "Matched "
            + ", ".join(reasons.get(primary_topic, [])[:4])
            + "."
        ),
    )


def normalize_text(value: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        value.lower(),
    ).strip()
