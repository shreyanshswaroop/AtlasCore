from fastapi import APIRouter, BackgroundTasks, HTTPException, Query

from app.services.news_sync_service import (
    get_news_sync_status,
    run_news_sync,
    serialize_news_sync_result,
)


router = APIRouter(
    prefix="/api/sync",
    tags=["Sync"],
)


def run_sync_safely(
    max_items_per_source: int,
) -> None:
    try:
        run_news_sync(max_items_per_source=max_items_per_source)
    except RuntimeError:
        return


@router.get("")
def sync_status() -> dict:
    return get_news_sync_status()


@router.post("")
def start_sync(
    background_tasks: BackgroundTasks,
    max_items_per_source: int = Query(
        default=30,
        ge=1,
        le=300,
    ),
    wait: bool = Query(
        default=False,
        description="Run synchronously and return the full result.",
    ),
) -> dict:
    if wait:
        try:
            result = run_news_sync(
                max_items_per_source=max_items_per_source,
            )
        except RuntimeError as error:
            raise HTTPException(
                status_code=409,
                detail=str(error),
            ) from error

        return serialize_news_sync_result(result)

    status = get_news_sync_status()

    if status["is_running"]:
        raise HTTPException(
            status_code=409,
            detail="AtlasCore news sync is already running.",
        )

    background_tasks.add_task(
        run_sync_safely,
        max_items_per_source,
    )

    return {
        "status": "queued",
    }
