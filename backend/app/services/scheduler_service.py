import asyncio
from contextlib import suppress

from app.core.config import get_settings
from app.services.email_notification_service import send_sync_email
from app.services.news_sync_service import (
    get_last_news_sync_result,
    run_news_sync,
)


settings = get_settings()


async def auto_sync_loop() -> None:
    if settings.atlascore_auto_sync_on_startup:
        await run_sync_in_thread()

    interval_seconds = max(
        settings.atlascore_auto_sync_interval_minutes,
        1,
    ) * 60

    while True:
        await asyncio.sleep(interval_seconds)
        await run_sync_in_thread()


async def run_sync_in_thread() -> None:
    result = await asyncio.to_thread(run_sync_safely)

    if result is not None:
        with suppress(Exception):
            await asyncio.to_thread(send_sync_email, result)


def run_sync_safely():
    try:
        return run_news_sync()
    except RuntimeError as error:
        if str(error) == "AtlasCore news sync is already running.":
            return None

        return get_last_news_sync_result()
    except Exception:
        return get_last_news_sync_result()
