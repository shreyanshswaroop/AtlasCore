from datetime import datetime

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.sync_run import SyncRun


def create_sync_run(
    db: Session,
    *,
    started_at: datetime,
    status: str = "running",
) -> SyncRun:
    sync_run = SyncRun(
        started_at=started_at,
        status=status,
        fetched=0,
        processed=0,
        failed=0,
        total_items=0,
    )

    db.add(sync_run)
    db.commit()
    db.refresh(sync_run)

    return sync_run


def update_sync_run(
    db: Session,
    *,
    sync_run_id: int,
    finished_at: datetime | None,
    status: str,
    fetched: int,
    processed: int,
    failed: int,
    total_items: int,
    error: str | None,
) -> SyncRun | None:
    sync_run = db.get(SyncRun, sync_run_id)

    if sync_run is None:
        return None

    sync_run.finished_at = finished_at
    sync_run.status = status
    sync_run.fetched = fetched
    sync_run.processed = processed
    sync_run.failed = failed
    sync_run.total_items = total_items
    sync_run.error = error

    db.commit()
    db.refresh(sync_run)

    return sync_run


def get_latest_sync_run(db: Session) -> SyncRun | None:
    statement = (
        select(SyncRun)
        .order_by(desc(SyncRun.started_at), desc(SyncRun.id))
        .limit(1)
    )

    return db.scalar(statement)
