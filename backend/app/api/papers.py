from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.paper import Paper
from app.repositories.paper_repository import (
    get_latest_papers,
    get_paper_by_arxiv_id,
    search_papers,
)

from app.repositories.paper_ai_analysis_repository import (
    get_analysis_by_paper_id,
)

router = APIRouter(
    prefix="/api/papers",
    tags=["Papers"],
)


def serialize_paper(paper: Paper) -> dict:
    return {
        "id": paper.arxiv_id,
        "title": paper.title,
        "summary": paper.abstract,
        "authors": paper.authors,
        "categories": paper.categories,
        "published_at": paper.published_at,
        "updated_at": paper.updated_at,
        "arxiv_url": paper.arxiv_url,
        "pdf_url": paper.pdf_url,
    }

def serialize_analysis(analysis) -> dict:
    return {
        "id": analysis.id,
        "executive_summary": analysis.executive_summary,
        "why_it_matters": analysis.why_it_matters,
        "difficulty": analysis.difficulty,
        "reading_time_minutes": analysis.reading_time_minutes,
        "key_contributions": analysis.key_contributions,
        "limitations": analysis.limitations,
        "use_cases": analysis.use_cases,
        "prerequisites": analysis.prerequisites,
        "target_roles": analysis.target_roles,
        "model_name": analysis.model_name,
        "created_at": analysis.created_at,
        "updated_at": analysis.updated_at,
    }

@router.get("")
def get_papers(
    query: str | None = Query(
        default=None,
        min_length=2,
        max_length=100,
    ),
    limit: int = Query(
        default=12,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: Session = Depends(get_db),
) -> dict:
    if query:
        papers = search_papers(
            db=db,
            query=query,
            limit=limit,
        )
    else:
        papers = get_latest_papers(
            db=db,
            limit=limit,
            offset=offset,
        )

    return {
        "query": query or "latest",
        "count": len(papers),
        "papers": [
            serialize_paper(paper)
            for paper in papers
        ],
    }


@router.get("/{paper_id}")
def get_paper(
    paper_id: str,
    db: Session = Depends(get_db),
) -> dict:
    paper = get_paper_by_arxiv_id(
        db=db,
        arxiv_id=paper_id,
    )

    if paper is None:
        raise HTTPException(
            status_code=404,
            detail="Paper not found.",
        )

    analysis = get_analysis_by_paper_id(
        db=db,
        paper_id=paper.id,
    )

    return {
        "paper": serialize_paper(paper),
        "analysis": (
            serialize_analysis(analysis)
            if analysis is not None
            else None
        ),
    }