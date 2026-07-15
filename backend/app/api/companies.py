import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.company_catalog import COMPANY_ENTITIES, favicon_url
from app.core.database import get_db
from app.repositories.news_repository import search_news
from app.api.news import serialize_news_item
from app.services.company_ranking_service import (
    get_ranked_companies_from_snapshot,
    refresh_company_leaderboard_snapshot,
)


router = APIRouter(
    prefix="/api/companies",
    tags=["Companies"],
)


def company_slug(name: str) -> str:
    return re.sub(
        r"[^a-z0-9]+",
        "-",
        name.lower(),
    ).strip("-")


def get_company_by_slug(slug: str):
    for company in COMPANY_ENTITIES:
        if company_slug(company.name) == slug:
            return company

    return None


def serialize_company(
    company,
    rank: int | None = None,
    global_mentions: int | None = None,
    importance_score: float | None = None,
    rank_basis: str | None = None,
) -> dict:
    product_aliases = [
        alias
        for alias in company.aliases
        if alias.lower() != company.name.lower()
    ]

    data = {
        "slug": company_slug(company.name),
        "company": company.name,
        "aliases": product_aliases,
        "domain": company.domain,
        "logo_url": favicon_url(company.domain),
    }

    if rank is not None:
        data["rank"] = rank

    if global_mentions is not None:
        data["global_mentions"] = global_mentions

    if importance_score is not None:
        data["importance_score"] = importance_score

    if rank_basis is not None:
        data["rank_basis"] = rank_basis

    return data


@router.get("/leaderboard")
def get_company_leaderboard(
    limit: int = Query(
        default=150,
        ge=1,
        le=300,
    ),
    global_rank: bool = Query(
        default=True,
        description="Rank companies by stored public AI ecosystem signal snapshot.",
    ),
    refresh: bool = Query(
        default=False,
        description="Recalculate and persist the company ranking snapshot.",
    ),
) -> dict:
    if global_rank:
        if refresh:
            ranked_companies, source = refresh_company_leaderboard_snapshot()
        else:
            ranked_companies, source = get_ranked_companies_from_snapshot(
                limit=limit,
            )

            if not ranked_companies:
                ranked_companies, source = refresh_company_leaderboard_snapshot()
    else:
        ranked_companies = []
        source = "company_catalog"

    items = [
        serialize_company(
            ranked_company.company,
            rank=rank,
            global_mentions=ranked_company.global_mentions,
            importance_score=ranked_company.importance_score,
            rank_basis=ranked_company.rank_basis,
        )
        for rank, ranked_company in enumerate(ranked_companies, start=1)
    ] if global_rank else [
        serialize_company(company, rank=rank)
        for rank, company in enumerate(COMPANY_ENTITIES, start=1)
    ]

    return {
        "source": source,
        "count": len(items),
        "items": items[:limit],
    }


@router.get("/{company_slug_value}/news")
def get_company_news(
    company_slug_value: str,
    limit: int = Query(
        default=24,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: Session = Depends(get_db),
) -> dict:
    company = get_company_by_slug(company_slug_value)

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found.",
        )

    query = "|".join((company.name, *company.aliases))
    items = search_news(
        db=db,
        query=query,
        limit=limit,
        offset=offset,
    )

    return {
        "company": serialize_company(company),
        "query": query,
        "count": len(items),
        "items": [
            serialize_news_item(item)
            for item in items
        ],
    }
