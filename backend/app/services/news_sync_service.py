from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.repositories.news_repository import count_news
from app.repositories.sync_run_repository import (
    create_sync_run,
    get_latest_sync_run,
    update_sync_run,
)
from app.services.news_ingestion_service import ingest_news


settings = get_settings()


@dataclass
class NewsSyncResult:
    started_at: datetime
    finished_at: datetime | None = None
    status: str = "running"
    sync_run_id: int | None = None
    fetched: int = 0
    processed: int = 0
    failed: int = 0
    total_items: int = 0
    error: str | None = None


_news_sync_lock = Lock()
_last_news_sync_result: NewsSyncResult | None = None


def get_news_sync_status() -> dict:
    if _last_news_sync_result is None:
        persisted_sync_result = get_latest_persisted_news_sync_result()

        if persisted_sync_result is not None:
            return {
                "status": persisted_sync_result.status,
                "last_sync": serialize_news_sync_result(
                    persisted_sync_result,
                ),
                "is_running": _news_sync_lock.locked(),
            }

        return {
            "status": "idle",
            "last_sync": None,
            "is_running": _news_sync_lock.locked(),
        }

    return {
        "status": _last_news_sync_result.status,
        "last_sync": serialize_news_sync_result(_last_news_sync_result),
        "is_running": _news_sync_lock.locked(),
    }


def get_last_news_sync_result() -> NewsSyncResult | None:
    return _last_news_sync_result


def serialize_news_sync_result(result: NewsSyncResult) -> dict:
    return {
        "started_at": result.started_at,
        "finished_at": result.finished_at,
        "status": result.status,
        "fetched": result.fetched,
        "processed": result.processed,
        "failed": result.failed,
        "total_items": result.total_items,
        "error": result.error,
    }


def get_latest_persisted_news_sync_result() -> NewsSyncResult | None:
    with SessionLocal() as db:
        sync_run = get_latest_sync_run(db)

        if sync_run is None:
            return None

        return NewsSyncResult(
            started_at=sync_run.started_at,
            finished_at=sync_run.finished_at,
            status=sync_run.status,
            sync_run_id=sync_run.id,
            fetched=sync_run.fetched,
            processed=sync_run.processed,
            failed=sync_run.failed,
            total_items=sync_run.total_items,
            error=sync_run.error,
        )


def persist_news_sync_start(result: NewsSyncResult) -> None:
    with SessionLocal() as db:
        sync_run = create_sync_run(
            db=db,
            started_at=result.started_at,
            status=result.status,
        )
        result.sync_run_id = sync_run.id


def persist_news_sync_result(result: NewsSyncResult) -> None:
    if result.sync_run_id is None:
        return

    with SessionLocal() as db:
        update_sync_run(
            db=db,
            sync_run_id=result.sync_run_id,
            finished_at=result.finished_at,
            status=result.status,
            fetched=result.fetched,
            processed=result.processed,
            failed=result.failed,
            total_items=result.total_items,
            error=result.error,
        )


def run_news_sync(max_items_per_source: int = 30) -> NewsSyncResult:
    global _last_news_sync_result

    if not _news_sync_lock.acquire(blocking=False):
        raise RuntimeError("AtlasCore news sync is already running.")

    result = NewsSyncResult(
        started_at=datetime.now(timezone.utc),
    )
    _last_news_sync_result = result

    try:
        persist_news_sync_start(result)

        with SessionLocal() as db:
            ingestion_result = ingest_news(
                db=db,
                max_items_per_source=max_items_per_source,
            )
            result.fetched = ingestion_result.fetched
            result.processed = ingestion_result.processed
            result.failed = ingestion_result.failed
            result.total_items = count_news(
                db=db,
                published_after=datetime.now(timezone.utc)
                - timedelta(days=settings.atlascore_news_window_days),
            )

        result.status = "completed"
    except Exception as error:
        result.status = "failed"
        result.error = str(error)
        raise
    finally:
        result.finished_at = datetime.now(timezone.utc)
        try:
            persist_news_sync_result(result)
        except Exception as persist_error:
            if result.error is None:
                result.status = "failed"
                result.error = str(persist_error)
                raise
        finally:
            _last_news_sync_result = result
            _news_sync_lock.release()

    return result
