from functools import lru_cache
import re

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    atlascore_auto_sync_enabled: bool = True
    atlascore_auto_sync_on_startup: bool = True
    atlascore_auto_sync_interval_minutes: int = 360
    atlascore_sync_topics: str = ""
    atlascore_sync_max_results_per_topic: int = 50
    atlascore_news_fetch_og_images: bool = True
    atlascore_news_window_days: int = 30
    atlascore_sync_email_enabled: bool = False
    atlascore_sync_email_to: str | None = None
    atlascore_sync_email_from: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_use_tls: bool = True

    @field_validator(
        "atlascore_auto_sync_enabled",
        "atlascore_auto_sync_on_startup",
        "atlascore_news_fetch_og_images",
        "atlascore_sync_email_enabled",
        "smtp_use_tls",
        mode="before",
    )
    @classmethod
    def clean_boolean_env_value(cls, value):
        if isinstance(value, str):
            cleaned_value = re.sub(
                r"[^a-zA-Z0-9_-]",
                "",
                value.strip().lower(),
            )

            if cleaned_value in {"true", "1", "yes", "on"}:
                return True

            if cleaned_value in {"false", "0", "no", "off"}:
                return False

            return cleaned_value

        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
