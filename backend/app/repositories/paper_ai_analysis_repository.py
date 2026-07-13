from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.paper import Paper
from app.models.paper_ai_analysis import PaperAIAnalysis
from app.schemas.paper_ai_analysis import PaperAnalysisOutput


def get_analysis_by_paper_id(
    db: Session,
    paper_id: int,
) -> PaperAIAnalysis | None:
    statement = select(PaperAIAnalysis).where(
        PaperAIAnalysis.paper_id == paper_id
    )

    return db.scalar(statement)


def get_next_paper_without_analysis(
    db: Session,
) -> Paper | None:
    statement = (
        select(Paper)
        .outerjoin(
            PaperAIAnalysis,
            PaperAIAnalysis.paper_id == Paper.id,
        )
        .where(PaperAIAnalysis.id.is_(None))
        .order_by(Paper.published_at.desc())
        .limit(1)
    )

    return db.scalar(statement)


def create_analysis(
    db: Session,
    paper: Paper,
    analysis_data: PaperAnalysisOutput,
    model_name: str,
) -> PaperAIAnalysis:
    analysis = PaperAIAnalysis(
        paper_id=paper.id,
        executive_summary=analysis_data.executive_summary,
        why_it_matters=analysis_data.why_it_matters,
        difficulty=analysis_data.difficulty,
        reading_time_minutes=analysis_data.reading_time_minutes,
        key_contributions=analysis_data.key_contributions,
        limitations=analysis_data.limitations,
        use_cases=analysis_data.use_cases,
        prerequisites=analysis_data.prerequisites,
        target_roles=analysis_data.target_roles,
        model_name=model_name,
    )

    db.add(analysis)
    db.flush()

    return analysis