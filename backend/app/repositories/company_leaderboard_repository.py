from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.company_leaderboard_snapshot import CompanyLeaderboardSnapshot


def get_company_leaderboard_snapshot(
    db: Session,
    limit: int,
) -> list[CompanyLeaderboardSnapshot]:
    statement = (
        select(CompanyLeaderboardSnapshot)
        .order_by(CompanyLeaderboardSnapshot.rank)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def replace_company_leaderboard_snapshot(
    db: Session,
    *,
    snapshot_rows: list[dict],
) -> None:
    db.execute(delete(CompanyLeaderboardSnapshot))

    db.add_all(
        CompanyLeaderboardSnapshot(**snapshot_row)
        for snapshot_row in snapshot_rows
    )
    db.commit()


def get_latest_company_leaderboard_calculated_at(
    db: Session,
) -> datetime | None:
    statement = (
        select(CompanyLeaderboardSnapshot.calculated_at)
        .order_by(CompanyLeaderboardSnapshot.calculated_at.desc())
        .limit(1)
    )

    return db.scalar(statement)
