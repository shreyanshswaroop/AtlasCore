from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PaperResponse(BaseModel):
    id: str
    title: str
    summary: str
    authors: list[str]
    categories: list[str]
    published_at: datetime
    updated_at: datetime
    arxiv_url: str
    pdf_url: str | None

    model_config = ConfigDict(
        from_attributes=True,
    )