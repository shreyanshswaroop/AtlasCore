import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.company_catalog import COMPANY_ENTITIES, favicon_url
from app.core.database import get_db
from app.repositories.news_repository import search_news
from app.api.news import serialize_news_item


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


def serialize_company(company, rank: int | None = None) -> dict:
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

    return data


@router.get("/leaderboard")
def get_company_leaderboard(
    limit: int = Query(
        default=150,
        ge=1,
        le=300,
    ),
) -> dict:
    items = [
        serialize_company(company, rank=rank)
        for rank, company in enumerate(COMPANY_ENTITIES, start=1)
    ]

    return {
        "source": "company_catalog",
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
