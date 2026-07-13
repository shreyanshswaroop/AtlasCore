from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.repositories.paper_ai_analysis_repository import (
    create_analysis,
    get_next_paper_without_analysis,
)
from app.services.ai_analysis_service import generate_paper_analysis


settings = get_settings()


@dataclass
class AnalysisWorkerResult:
    processed: bool
    paper_id: int | None
    arxiv_id: str | None
    title: str | None


def process_next_paper(
    db: Session,
) -> AnalysisWorkerResult:
    paper = get_next_paper_without_analysis(db)

    if paper is None:
        return AnalysisWorkerResult(
            processed=False,
            paper_id=None,
            arxiv_id=None,
            title=None,
        )

    try:
        analysis_data = generate_paper_analysis(paper)

        create_analysis(
            db=db,
            paper=paper,
            analysis_data=analysis_data,
            model_name=settings.openrouter_model,
        )

        db.commit()

        return AnalysisWorkerResult(
            processed=True,
            paper_id=paper.id,
            arxiv_id=paper.arxiv_id,
            title=paper.title,
        )

    except Exception:
        db.rollback()
        raise
