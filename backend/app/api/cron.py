import secrets

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Query, status

from app.core.config import get_settings
from app.services.company_ranking_service import (
    refresh_company_leaderboard_snapshot,
    refresh_company_leaderboard_snapshot_if_stale,
)
from app.services.news_sync_service import (
    get_news_sync_status,
    run_news_sync,
    serialize_news_sync_result,
)


router = APIRouter(
    prefix="/api/cron",
    tags=["Cron"],
)


def verify_cron_secret(
    secret: str | None,
    x_cron_secret: str | None,
) -> None:
    expected_secret = get_settings().cron_secret

    if not expected_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cron endpoints are not configured.",
        )

    provided_secret = x_cron_secret or secret

    if provided_secret is None or not secrets.compare_digest(
        provided_secret,
        expected_secret,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid cron secret.",
        )


def run_news_sync_safely(max_items_per_source: int) -> None:
    try:
        run_news_sync(max_items_per_source=max_items_per_source)
    except RuntimeError:
        return


@router.api_route("/news-sync", methods=["GET", "POST"])
def cron_news_sync(
    background_tasks: BackgroundTasks,
    secret: str | None = Query(default=None),
    x_cron_secret: str | None = Header(default=None),
    max_items_per_source: int = Query(default=30, ge=1, le=300),
    wait: bool = Query(
        default=False,
        description="Run synchronously and return the full sync result.",
    ),
) -> dict:
    verify_cron_secret(secret, x_cron_secret)

    if wait:
        try:
            result = run_news_sync(
                max_items_per_source=max_items_per_source,
            )
        except RuntimeError as error:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(error),
            ) from error

        return {
            "status": "completed",
            "result": serialize_news_sync_result(result),
        }

    sync_status = get_news_sync_status()

    if sync_status["is_running"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="AtlasCore news sync is already running.",
        )

    background_tasks.add_task(
        run_news_sync_safely,
        max_items_per_source,
    )

    return {
        "status": "queued",
        "job": "news_sync",
    }


@router.api_route("/leaderboard", methods=["GET", "POST"])
def cron_leaderboard_snapshot(
    secret: str | None = Query(default=None),
    x_cron_secret: str | None = Header(default=None),
    stale_only: bool = Query(
        default=True,
        description="Only refresh when the stored snapshot is missing or stale.",
    ),
) -> dict:
    verify_cron_secret(secret, x_cron_secret)

    if stale_only:
        refreshed = refresh_company_leaderboard_snapshot_if_stale()

        return {
            "status": "refreshed" if refreshed else "skipped",
            "job": "leaderboard_snapshot",
            "stale_only": True,
        }

    ranked_companies, source = refresh_company_leaderboard_snapshot()

    return {
        "status": "refreshed",
        "job": "leaderboard_snapshot",
        "stale_only": False,
        "source": source,
        "count": len(ranked_companies),
    }
