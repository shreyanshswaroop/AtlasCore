import os
import unittest
from unittest.mock import patch

os.environ.setdefault("DATABASE_URL", "sqlite:///test.db")

from app.core.config import Settings
from app.core.news_source_catalog import NewsSource
from app.services.news_ingestion_service import fetch_open_graph_image


class FakeResponse:
    def __init__(self, text: str) -> None:
        self.text = text

    def raise_for_status(self) -> None:
        return None


class NewsImageTests(unittest.TestCase):
    def setUp(self) -> None:
        self.source = NewsSource(
            name="TechCrunch AI",
            feed_url="https://techcrunch.com/category/artificial-intelligence/feed/",
            logo_url="https://www.google.com/s2/favicons?domain=techcrunch.com&sz=64",
        )

    def test_fetches_open_graph_image_when_content_comes_first(self) -> None:
        html = """
        <html><head>
            <meta content="https://techcrunch.com/wp-content/uploads/spotify-ai.jpg"
                  property="og:image">
        </head></html>
        """

        with patch(
            "app.services.news_ingestion_service.httpx.get",
            return_value=FakeResponse(html),
        ):
            image_url = fetch_open_graph_image(
                self.source,
                "https://techcrunch.com/2026/07/14/spotify-ai-assistant/",
            )

        self.assertEqual(
            image_url,
            "https://techcrunch.com/wp-content/uploads/spotify-ai.jpg",
        )

    def test_fetches_twitter_image_and_resolves_relative_url(self) -> None:
        html = """
        <html><head>
            <meta name="twitter:image" content="/wp-content/uploads/music-ai.jpg">
        </head></html>
        """

        with patch(
            "app.services.news_ingestion_service.httpx.get",
            return_value=FakeResponse(html),
        ):
            image_url = fetch_open_graph_image(
                self.source,
                "https://techcrunch.com/2026/07/14/spotify-ai-assistant/",
            )

        self.assertEqual(
            image_url,
            "https://techcrunch.com/wp-content/uploads/music-ai.jpg",
        )

    def test_open_graph_fetching_is_enabled_by_default(self) -> None:
        settings = Settings(database_url="sqlite:///test.db")

        self.assertTrue(settings.atlascore_news_fetch_og_images)

    def test_open_graph_boolean_env_values_are_cleaned(self) -> None:
        settings = Settings(
            database_url="sqlite:///test.db",
            atlascore_news_fetch_og_images="false₹",
        )

        self.assertFalse(settings.atlascore_news_fetch_og_images)


if __name__ == "__main__":
    unittest.main()
