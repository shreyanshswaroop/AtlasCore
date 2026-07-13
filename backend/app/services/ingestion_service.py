from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.repositories.paper_repository import upsert_paper
from app.services.arxiv_service import fetch_ai_papers


@dataclass
class IngestionResult:
    fetched: int
    processed: int


def ingest_papers(
    db: Session,
    search_query: str = "artificial intelligence",
    max_results: int = 100,
) -> IngestionResult:
    papers = fetch_ai_papers(
        search_query=search_query,
        max_results=max_results,
    )

    processed = 0

    try:
        for paper_data in papers:
            upsert_paper(
                db=db,
                paper_data=paper_data,
            )

            processed += 1

        db.commit()

    except Exception:
        db.rollback()
        raise

    return IngestionResult(
        fetched=len(papers),
        processed=processed,
    )