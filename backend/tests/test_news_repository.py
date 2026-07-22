import os
import unittest

from sqlalchemy.dialects import postgresql

os.environ.setdefault("DATABASE_URL", "sqlite:///test.db")

from app.repositories.news_repository import build_topic_condition


class NewsRepositoryTests(unittest.TestCase):
    def test_topic_condition_prefers_primary_topic_over_secondary_tags(self) -> None:
        condition_sql = str(
            build_topic_condition("api").compile(
                dialect=postgresql.dialect(),
                compile_kwargs={"literal_binds": True},
            )
        )

        self.assertIn("news_items.primary_topic = 'API'", condition_sql)
        self.assertIn("news_items.primary_topic IS NULL", condition_sql)
        self.assertIn("'API' = ANY (news_items.topics)", condition_sql)
        self.assertNotIn(
            "OR 'API' = ANY (news_items.topics)",
            condition_sql,
        )


if __name__ == "__main__":
    unittest.main()
