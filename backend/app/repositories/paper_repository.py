from collections.abc import Sequence

from sqlalchemy import desc, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.paper import Paper


def upsert_paper(
    db: Session,
    paper_data: dict,
) -> Paper:
    statement = insert(Paper).values(
        arxiv_id=paper_data["id"],
        title=paper_data["title"],
        abstract=paper_data["summary"],
        authors=paper_data["authors"],
        categories=paper_data["categories"],
        published_at=paper_data["published_at"],
        updated_at=paper_data["updated_at"],
        arxiv_url=paper_data["arxiv_url"],
        pdf_url=paper_data["pdf_url"],
    )

    statement = statement.on_conflict_do_update(
        index_elements=[Paper.arxiv_id],
        set_={
            "title": statement.excluded.title,
            "abstract": statement.excluded.abstract,
            "authors": statement.excluded.authors,
            "categories": statement.excluded.categories,
            "published_at": statement.excluded.published_at,
            "updated_at": statement.excluded.updated_at,
            "arxiv_url": statement.excluded.arxiv_url,
            "pdf_url": statement.excluded.pdf_url,
        },
    ).returning(Paper)

    result = db.execute(statement)

    return result.scalar_one()


def get_latest_papers(
    db: Session,
    limit: int = 20,
    offset: int = 0,
) -> Sequence[Paper]:
    statement = (
        select(Paper)
        .order_by(desc(Paper.published_at))
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(statement).all()


def get_paper_by_arxiv_id(
    db: Session,
    arxiv_id: str,
) -> Paper | None:
    statement = select(Paper).where(
        Paper.arxiv_id == arxiv_id
    )

    return db.scalar(statement)


def search_papers(
    db: Session,
    query: str,
    limit: int = 20,
) -> Sequence[Paper]:
    cleaned_query = query.strip()

    statement = (
        select(Paper)
        .where(
            Paper.title.ilike(f"%{cleaned_query}%")
            | Paper.abstract.ilike(f"%{cleaned_query}%")
        )
        .order_by(desc(Paper.published_at))
        .limit(limit)
    )

    return db.scalars(statement).all()