from datetime import datetime
from urllib.parse import urlencode

import feedparser


ARXIV_API_URL = "https://export.arxiv.org/api/query"


def clean_text(value: str) -> str:
    """Remove unnecessary spaces and line breaks."""
    return " ".join(value.split())


def fetch_ai_papers(
    search_query: str = "artificial intelligence",
    max_results: int = 10,
) -> list[dict]:
    parameters = {
        "search_query": f'all:"{search_query}"',
        "start": 0,
        "max_results": max_results,
        "sortBy": "submittedDate",
        "sortOrder": "descending",
    }

    request_url = f"{ARXIV_API_URL}?{urlencode(parameters)}"
    feed = feedparser.parse(request_url)

    if feed.bozo:
        raise RuntimeError("Unable to fetch papers from arXiv.")

    papers = []

    for entry in feed.entries:
        authors = [
            author.name
            for author in getattr(entry, "authors", [])
        ]

        categories = [
            tag.term
            for tag in getattr(entry, "tags", [])
        ]

        pdf_url = next(
            (
                link.href
                for link in getattr(entry, "links", [])
                if getattr(link, "type", "") == "application/pdf"
            ),
            None,
        )

        papers.append(
            {
                "id": entry.id.split("/abs/")[-1],
                "title": clean_text(entry.title),
                "summary": clean_text(entry.summary),
                "authors": authors,
                "categories": categories,
                "published_at": datetime.fromisoformat(
                    entry.published.replace("Z", "+00:00")
                ),
                "updated_at": datetime.fromisoformat(
                    entry.updated.replace("Z", "+00:00")
                ),
                "arxiv_url": entry.link,
                "pdf_url": pdf_url,
            }
        )

    return papers

def fetch_paper_by_id(paper_id: str) -> dict | None:
    parameters = {
        "id_list": paper_id,
    }

    request_url = f"{ARXIV_API_URL}?{urlencode(parameters)}"
    feed = feedparser.parse(request_url)

    if feed.bozo:
        raise RuntimeError("Unable to fetch the paper from arXiv.")

    if not feed.entries:
        return None

    entry = feed.entries[0]

    authors = [
        author.name
        for author in getattr(entry, "authors", [])
    ]

    categories = [
        tag.term
        for tag in getattr(entry, "tags", [])
    ]

    pdf_url = next(
        (
            link.href
            for link in getattr(entry, "links", [])
            if getattr(link, "type", "") == "application/pdf"
        ),
        None,
    )

    return {
        "id": entry.id.split("/abs/")[-1],
        "title": clean_text(entry.title),
        "summary": clean_text(entry.summary),
        "authors": authors,
        "categories": categories,
        "published_at": datetime.fromisoformat(
            entry.published.replace("Z", "+00:00")
        ),
        "updated_at": datetime.fromisoformat(
            entry.updated.replace("Z", "+00:00")
        ),
        "arxiv_url": entry.link,
        "pdf_url": pdf_url,
    }