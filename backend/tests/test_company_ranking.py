import os
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

os.environ.setdefault("DATABASE_URL", "sqlite:///test.db")

from app.core.company_catalog import CompanyEntity
from app.services.company_ranking_service import (
    build_gdelt_company_query,
    calculate_company_importance_score,
    count_company_mentions,
    dedupe_company_aliases,
    rank_companies_from_topic_news,
    refresh_company_leaderboard_snapshot_if_stale,
    score_article_signal,
)


class CompanyRankingTests(unittest.TestCase):
    def test_dedupes_company_aliases(self) -> None:
        company = CompanyEntity(
            name="OpenAI",
            aliases=("OpenAI", "ChatGPT", "Sora"),
            domain="openai.com",
        )

        self.assertEqual(
            dedupe_company_aliases(company),
            ["OpenAI", "ChatGPT", "Sora"],
        )

    def test_gdelt_query_includes_company_aliases_and_ai_context(self) -> None:
        company = CompanyEntity(
            name="Google",
            aliases=("Google", "Gemini", "NotebookLM"),
            domain="google.com",
        )

        query = build_gdelt_company_query(company)

        self.assertIn('"Google"', query)
        self.assertIn('"Gemini"', query)
        self.assertIn('"NotebookLM"', query)
        self.assertIn('"artificial intelligence"', query)
        self.assertIn('"generative AI"', query)

    def test_counts_mentions_from_global_article_sample(self) -> None:
        company = CompanyEntity(
            name="NVIDIA",
            aliases=("NVIDIA", "CUDA"),
            domain="nvidia.com",
        )
        articles = [
            {
                "title": "NVIDIA announces new AI chips",
                "domain": "example.com",
                "url": "https://example.com/nvidia-ai",
            },
            {
                "title": "CUDA tools expand for developers",
                "domain": "example.com",
                "url": "https://example.com/cuda-tools",
            },
            {
                "title": "OpenAI releases a new model",
                "domain": "example.com",
                "url": "https://example.com/openai",
            },
        ]

        self.assertEqual(count_company_mentions(company, articles), 2)

    def test_importance_score_weights_source_recency_and_title_signal(self) -> None:
        company = CompanyEntity(
            name="OpenAI",
            aliases=("OpenAI", "ChatGPT"),
            domain="openai.com",
        )
        articles = [
            {
                "title": "OpenAI launches new reasoning model benchmark",
                "domain": "openai.com",
                "url": "https://openai.com/news/reasoning-model",
                "seendate": "20260715T090000Z",
            },
            {
                "title": "OpenAI mentioned in generic market update",
                "domain": "example.com",
                "url": "https://example.com/openai",
                "seendate": "20260708T090000Z",
            },
        ]

        score = calculate_company_importance_score(company, articles)

        self.assertGreater(score, count_company_mentions(company, articles))

    def test_article_signal_boosts_high_authority_launch_article(self) -> None:
        plain_article = {
            "title": "OpenAI mentioned in roundup",
            "domain": "example.com",
            "seendate": "20260708T090000Z",
        }
        launch_article = {
            "title": "OpenAI releases new model benchmark",
            "domain": "openai.com",
            "seendate": "20260715T090000Z",
        }

        self.assertGreater(
            score_article_signal(launch_article),
            score_article_signal(plain_article),
        )

    def test_topic_news_ranking_only_returns_companies_with_mentions(self) -> None:
        nvidia_story = MagicMock(
            title="NVIDIA releases new CUDA inference tools",
            summary="Developer workflow update for AI systems",
            source_name="NVIDIA Blog",
            source_url="https://blogs.nvidia.com/cuda",
            published_at=datetime.now(timezone.utc),
        )
        openai_story = MagicMock(
            title="OpenAI expands ChatGPT agent features",
            summary="New software agent capabilities for teams",
            source_name="OpenAI",
            source_url="https://openai.com/news/agents",
            published_at=datetime.now(timezone.utc),
        )

        ranked_companies = rank_companies_from_topic_news(
            news_items=[nvidia_story, openai_story],
            topics=["DEVELOPMENT", "AGENTS"],
            limit=10,
        )
        company_names = {
            ranked_company.company.name
            for ranked_company in ranked_companies
        }

        self.assertIn("NVIDIA", company_names)
        self.assertIn("OpenAI", company_names)
        self.assertNotIn("Anthropic", company_names)

    def test_startup_refresh_skips_fresh_snapshot(self) -> None:
        fresh_snapshot_time = datetime.now(timezone.utc)

        with patch(
            "app.services.company_ranking_service.SessionLocal",
        ) as session_local:
            database = MagicMock()
            database.scalar.return_value = fresh_snapshot_time
            session_local.return_value.__enter__.return_value = database

            refreshed = refresh_company_leaderboard_snapshot_if_stale()

        self.assertFalse(refreshed)

    def test_startup_refresh_runs_for_stale_snapshot(self) -> None:
        stale_snapshot_time = datetime.now(timezone.utc) - timedelta(days=1)

        with patch(
            "app.services.company_ranking_service.SessionLocal",
        ) as session_local, patch(
            "app.services.company_ranking_service.refresh_company_leaderboard_snapshot",
            return_value=([], "test"),
        ) as refresh_snapshot:
            database = MagicMock()
            database.scalar.return_value = stale_snapshot_time
            session_local.return_value.__enter__.return_value = database

            refreshed = refresh_company_leaderboard_snapshot_if_stale()

        self.assertTrue(refreshed)
        refresh_snapshot.assert_called_once()


if __name__ == "__main__":
    unittest.main()
