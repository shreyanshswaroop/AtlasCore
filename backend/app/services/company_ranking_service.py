from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
import re
from threading import Lock, Thread
from urllib.parse import urlencode, urlparse
import xml.etree.ElementTree as ET

import feedparser
import httpx

from app.core.company_catalog import COMPANY_ENTITIES, CompanyEntity
from app.core.config import get_settings
from app.core.news_source_catalog import NEWS_SOURCES
from app.core.database import SessionLocal
from app.repositories.company_leaderboard_repository import (
    get_latest_company_leaderboard_calculated_at,
    get_company_leaderboard_snapshot,
    replace_company_leaderboard_snapshot,
)


settings = get_settings()
gdelt_doc_api_url = "https://api.gdeltproject.org/api/v2/doc/doc"
gdelt_max_records = 100
gdelt_request_timeout = 20
signal_request_timeout = 8
signal_max_records = 50
ranking_context_query = (
    '("artificial intelligence" OR AI OR "machine learning" OR '
    '"large language model" OR LLM OR "generative AI")'
)


@dataclass(frozen=True)
class RankedCompany:
    company: CompanyEntity
    global_mentions: int
    importance_score: float
    rank_basis: str


@dataclass(frozen=True)
class RankingSignal:
    title: str
    url: str = ""
    domain: str = ""
    published_at: datetime | None = None
    source: str = "unknown"
    source_weight: float = 1.0


_company_ranking_lock = Lock()
_company_ranking_cache: tuple[datetime, list[RankedCompany]] | None = None
_startup_refresh_lock = Lock()


def get_ranked_companies() -> tuple[list[RankedCompany], str]:
    if not settings.atlascore_company_ranking_enabled:
        return build_catalog_rankings(), "company_catalog"

    cached_rankings = get_cached_rankings()

    if cached_rankings is not None:
        return cached_rankings, "multi_source_ai_signal_cached"

    if not _company_ranking_lock.acquire(blocking=False):
        return build_catalog_rankings(), "company_catalog_refreshing"

    try:
        ranked_companies = fetch_multi_source_company_rankings()
        cache_rankings(ranked_companies)

        return ranked_companies, "multi_source_ai_signal"
    except Exception:
        cached_rankings = get_cached_rankings(allow_stale=True)

        if cached_rankings is not None:
            return cached_rankings, "multi_source_ai_signal_stale"

        return build_catalog_rankings(), "company_catalog_fallback"
    finally:
        _company_ranking_lock.release()


def get_ranked_companies_from_snapshot(
    limit: int,
) -> tuple[list[RankedCompany], str]:
    with SessionLocal() as db:
        snapshot_rows = get_company_leaderboard_snapshot(
            db=db,
            limit=limit,
        )

    if not snapshot_rows:
        return [], "company_leaderboard_snapshot_empty"

    return [
        RankedCompany(
            company=company_from_snapshot_row(snapshot_row),
            global_mentions=snapshot_row.global_mentions,
            importance_score=snapshot_row.importance_score,
            rank_basis=snapshot_row.rank_basis,
        )
        for snapshot_row in snapshot_rows
    ], snapshot_rows[0].source


def refresh_company_leaderboard_snapshot() -> tuple[list[RankedCompany], str]:
    ranked_companies, source = get_ranked_companies()
    calculated_at = datetime.now(timezone.utc)

    with SessionLocal() as db:
        replace_company_leaderboard_snapshot(
            db=db,
            snapshot_rows=[
                {
                    "slug": company_slug(ranked_company.company.name),
                    "company_name": ranked_company.company.name,
                    "rank": rank,
                    "global_mentions": ranked_company.global_mentions,
                    "importance_score": ranked_company.importance_score,
                    "rank_basis": ranked_company.rank_basis,
                    "source": source,
                    "calculated_at": calculated_at,
                }
                for rank, ranked_company in enumerate(
                    ranked_companies,
                    start=1,
                )
            ],
        )

    return ranked_companies, source


def refresh_company_leaderboard_snapshot_if_stale() -> bool:
    if not settings.atlascore_company_ranking_enabled:
        return False

    with SessionLocal() as db:
        calculated_at = get_latest_company_leaderboard_calculated_at(db)

    if calculated_at is not None and calculated_at.tzinfo is None:
        calculated_at = calculated_at.replace(tzinfo=timezone.utc)

    stale_after = datetime.now(timezone.utc) - timedelta(
        hours=settings.atlascore_company_ranking_stale_hours,
    )

    if calculated_at is not None and calculated_at > stale_after:
        return False

    if not _startup_refresh_lock.acquire(blocking=False):
        return False

    try:
        refresh_company_leaderboard_snapshot()
        return True
    finally:
        _startup_refresh_lock.release()


def schedule_company_leaderboard_startup_refresh() -> None:
    if (
        not settings.atlascore_company_ranking_enabled
        or not settings.atlascore_company_ranking_refresh_on_startup
    ):
        return

    thread = Thread(
        target=run_company_leaderboard_startup_refresh,
        daemon=True,
    )
    thread.start()


def run_company_leaderboard_startup_refresh() -> None:
    try:
        refresh_company_leaderboard_snapshot_if_stale()
    except Exception:
        return


def get_cached_rankings(
    allow_stale: bool = False,
) -> list[RankedCompany] | None:
    if _company_ranking_cache is None:
        return None

    cached_at, ranked_companies = _company_ranking_cache

    if allow_stale:
        return ranked_companies

    expires_at = cached_at + timedelta(
        seconds=settings.atlascore_company_ranking_cache_seconds,
    )

    if datetime.now(timezone.utc) >= expires_at:
        return None

    return ranked_companies


def cache_rankings(ranked_companies: list[RankedCompany]) -> None:
    global _company_ranking_cache

    _company_ranking_cache = datetime.now(timezone.utc), ranked_companies


def build_catalog_rankings() -> list[RankedCompany]:
    return [
        RankedCompany(
            company=company,
            global_mentions=0,
            importance_score=0,
            rank_basis="catalog order",
        )
        for company in COMPANY_ENTITIES
    ]


def company_slug(name: str) -> str:
    return re.sub(
        r"[^a-z0-9]+",
        "-",
        name.lower(),
    ).strip("-")


def company_from_snapshot_row(snapshot_row) -> CompanyEntity:
    for company in COMPANY_ENTITIES:
        if company_slug(company.name) == snapshot_row.slug:
            return company

    return CompanyEntity(
        name=snapshot_row.company_name,
        aliases=(),
        domain=None,
    )


def fetch_gdelt_company_rankings() -> list[RankedCompany]:
    return fetch_multi_source_company_rankings()


def fetch_multi_source_company_rankings() -> list[RankedCompany]:
    companies = COMPANY_ENTITIES[
        : settings.atlascore_company_ranking_max_companies
    ]
    signals = fetch_ranking_signals()
    ranked_companies = [
        RankedCompany(
            company=company,
            global_mentions=count_company_mentions(company, signals),
            importance_score=calculate_company_importance_score(
                company,
                signals,
            ),
            rank_basis=(
                "AtlasCore ranking from public news, research, open-source, "
                "developer, model, product, and community AI signals"
            ),
        )
        for company in companies
    ]

    ranked_companies = [
        ranked_company
        for ranked_company in ranked_companies
        if ranked_company.importance_score > 0
    ]

    if not ranked_companies:
        return build_catalog_rankings()

    ranked_companies.sort(
        key=lambda item: (
            item.importance_score,
            item.global_mentions,
            -companies.index(item.company),
        ),
        reverse=True,
    )
    ranked_companies.extend(
        RankedCompany(
            company=company,
            global_mentions=0,
            importance_score=0,
            rank_basis="No recent public AI signal found",
        )
        for company in companies
        if company not in {
            ranked_company.company
            for ranked_company in ranked_companies
        }
    )

    return ranked_companies


def fetch_ranking_signals() -> list[RankingSignal]:
    fetchers = (
        fetch_gdelt_signals,
        fetch_rss_signals,
        fetch_arxiv_signals,
        fetch_hacker_news_signals,
        fetch_reddit_signals,
        fetch_hugging_face_signals,
        fetch_github_trending_signals,
        fetch_product_hunt_signals,
        fetch_papers_with_code_signals,
    )
    signals: list[RankingSignal] = []

    for fetcher in fetchers:
        try:
            signals.extend(fetcher())
        except Exception:
            continue

    return dedupe_signals(signals)


def fetch_gdelt_ai_articles() -> list[dict]:
    url = build_gdelt_url(ranking_context_query)
    response = httpx.get(url, timeout=gdelt_request_timeout)
    response.raise_for_status()
    articles = response.json().get("articles", [])

    if not isinstance(articles, list):
        return []

    return [
        article
        for article in articles
        if isinstance(article, dict)
    ]


def fetch_gdelt_signals() -> list[RankingSignal]:
    return [
        signal_from_gdelt_article(article)
        for article in fetch_gdelt_ai_articles()
    ]


def fetch_rss_signals() -> list[RankingSignal]:
    signals: list[RankingSignal] = []

    for source in NEWS_SOURCES:
        try:
            response = httpx.get(
                source.feed_url,
                follow_redirects=True,
                timeout=signal_request_timeout,
                headers={"User-Agent": "AtlasCoreBot/0.1"},
            )
            response.raise_for_status()
            feed = feedparser.parse(response.content)
        except Exception:
            continue

        for entry in list(feed.entries[:10]):
            link = getattr(entry, "link", source.feed_url)
            signals.append(
                RankingSignal(
                    title=getattr(entry, "title", ""),
                    url=link,
                    domain=get_domain(link),
                    published_at=parse_feed_datetime(entry),
                    source=f"rss:{source.name}",
                    source_weight=1.4,
                )
            )

    return signals


def fetch_arxiv_signals() -> list[RankingSignal]:
    url = "https://export.arxiv.org/api/query?" + urlencode(
        {
            "search_query": 'all:"large language model" OR all:"artificial intelligence"',
            "sortBy": "submittedDate",
            "sortOrder": "descending",
            "max_results": str(signal_max_records),
        }
    )
    response = httpx.get(
        url,
        timeout=signal_request_timeout,
        headers={"User-Agent": "AtlasCoreBot/0.1"},
    )
    response.raise_for_status()
    root = ET.fromstring(response.content)
    namespace = {"atom": "http://www.w3.org/2005/Atom"}
    signals: list[RankingSignal] = []

    for entry in root.findall("atom:entry", namespace):
        signals.append(
            RankingSignal(
                title=get_xml_text(entry, "atom:title", namespace),
                url=get_xml_link(entry, namespace),
                domain="arxiv.org",
                published_at=parse_iso_datetime(
                    get_xml_text(entry, "atom:published", namespace),
                ),
                source="arxiv",
                source_weight=2.1,
            )
        )

    return signals


def fetch_hacker_news_signals() -> list[RankingSignal]:
    url = "https://hn.algolia.com/api/v1/search_by_date?" + urlencode(
        {
            "query": "AI OR LLM OR artificial intelligence",
            "tags": "story",
            "hitsPerPage": str(signal_max_records),
        }
    )
    response = httpx.get(url, timeout=signal_request_timeout)
    response.raise_for_status()
    hits = response.json().get("hits", [])

    return [
        RankingSignal(
            title=str(hit.get("title") or hit.get("story_title") or ""),
            url=str(hit.get("url") or ""),
            domain=get_domain(str(hit.get("url") or ""))
            or "news.ycombinator.com",
            published_at=parse_iso_datetime(str(hit.get("created_at") or "")),
            source="hacker_news",
            source_weight=1.5,
        )
        for hit in hits
        if isinstance(hit, dict)
    ]


def fetch_reddit_signals() -> list[RankingSignal]:
    response = httpx.get(
        "https://www.reddit.com/r/MachineLearning+LocalLLaMA+artificial+OpenAI/new.json?limit=50",
        timeout=signal_request_timeout,
        headers={"User-Agent": "AtlasCoreBot/0.1"},
    )
    response.raise_for_status()
    children = response.json().get("data", {}).get("children", [])
    signals: list[RankingSignal] = []

    for child in children:
        post = child.get("data", {}) if isinstance(child, dict) else {}
        created_utc = post.get("created_utc")
        published_at = (
            datetime.fromtimestamp(created_utc, timezone.utc)
            if isinstance(created_utc, (int, float))
            else None
        )
        signals.append(
            RankingSignal(
                title=str(post.get("title") or ""),
                url=str(post.get("url") or ""),
                domain=get_domain(str(post.get("url") or "")) or "reddit.com",
                published_at=published_at,
                source="reddit_ai",
                source_weight=1.1,
            )
        )

    return signals


def fetch_hugging_face_signals() -> list[RankingSignal]:
    response = httpx.get(
        "https://huggingface.co/api/models?"
        + urlencode(
            {
                "sort": "downloads",
                "direction": "-1",
                "limit": str(signal_max_records),
            }
        ),
        timeout=signal_request_timeout,
    )
    response.raise_for_status()
    models = response.json()

    return [
        RankingSignal(
            title=str(model.get("modelId") or ""),
            url=f"https://huggingface.co/{model.get('modelId')}",
            domain="huggingface.co",
            source="hugging_face_trending",
            source_weight=2.0,
        )
        for model in models
        if isinstance(model, dict) and model.get("modelId")
    ]


def fetch_github_trending_signals() -> list[RankingSignal]:
    response = httpx.get(
        "https://github.com/trending?since=daily",
        timeout=signal_request_timeout,
        headers={"User-Agent": "AtlasCoreBot/0.1"},
    )
    response.raise_for_status()
    repo_matches = re.findall(r'href="/([^"/]+/[^"/]+)"', response.text)
    signals: list[RankingSignal] = []
    seen_repos: set[str] = set()

    for repo in repo_matches:
        if repo in seen_repos or repo.count("/") != 1:
            continue

        seen_repos.add(repo)
        signals.append(
            RankingSignal(
                title=repo.replace("/", " "),
                url=f"https://github.com/{repo}",
                domain="github.com",
                source="github_trending",
                source_weight=2.0,
            )
        )

        if len(signals) >= signal_max_records:
            break

    return signals


def fetch_product_hunt_signals() -> list[RankingSignal]:
    response = httpx.get(
        "https://www.producthunt.com/feed",
        timeout=signal_request_timeout,
        headers={"User-Agent": "AtlasCoreBot/0.1"},
    )
    response.raise_for_status()
    feed = feedparser.parse(response.content)

    return [
        RankingSignal(
            title=getattr(entry, "title", ""),
            url=getattr(entry, "link", ""),
            domain="producthunt.com",
            published_at=parse_feed_datetime(entry),
            source="product_hunt",
            source_weight=1.5,
        )
        for entry in list(feed.entries[:signal_max_records])
    ]


def fetch_papers_with_code_signals() -> list[RankingSignal]:
    response = httpx.get(
        "https://paperswithcode.com/api/v1/papers/?"
        + urlencode({"q": "large language model"}),
        timeout=signal_request_timeout,
        headers={"User-Agent": "AtlasCoreBot/0.1"},
    )
    response.raise_for_status()
    results = response.json().get("results", [])

    return [
        RankingSignal(
            title=str(paper.get("title") or ""),
            url=str(paper.get("url_abs") or paper.get("url_pdf") or ""),
            domain="paperswithcode.com",
            published_at=parse_iso_datetime(str(paper.get("published") or "")),
            source="papers_with_code",
            source_weight=2.0,
        )
        for paper in results
        if isinstance(paper, dict)
    ]


def count_company_mentions(
    company: CompanyEntity,
    signals: list[RankingSignal | dict],
) -> int:
    aliases = dedupe_company_aliases(company)

    return sum(
        1
        for signal in normalize_signal_items(signals)
        if signal_mentions_company(signal, aliases)
    )


def calculate_company_importance_score(
    company: CompanyEntity,
    signals: list[RankingSignal | dict],
) -> float:
    aliases = dedupe_company_aliases(company)
    score = 0.0

    for signal in normalize_signal_items(signals):
        if not signal_mentions_company(signal, aliases):
            continue

        score += score_ranking_signal(signal)

    return round(score, 2)


def score_article_signal(article: dict) -> float:
    return score_ranking_signal(signal_from_gdelt_article(article))


def score_ranking_signal(signal: RankingSignal) -> float:
    return (
        signal.source_weight
        + source_authority_boost(signal.domain)
        + title_signal_boost(signal.title)
        + recency_boost(signal.published_at)
    )


def source_authority_boost(domain: str) -> float:
    normalized_domain = domain.lower().removeprefix("www.")
    high_authority_domains = {
        "openai.com",
        "deepmind.google",
        "blog.google",
        "anthropic.com",
        "mistral.ai",
        "huggingface.co",
        "github.blog",
        "github.com",
        "blogs.nvidia.com",
        "aws.amazon.com",
        "microsoft.com",
        "technologyreview.com",
        "techcrunch.com",
        "venturebeat.com",
        "the-decoder.com",
        "arxiv.org",
        "paperswithcode.com",
        "producthunt.com",
        "nature.com",
        "science.org",
    }
    strong_media_domains = {
        "reuters.com",
        "bloomberg.com",
        "ft.com",
        "wsj.com",
        "theverge.com",
        "wired.com",
        "semianalysis.com",
        "news.ycombinator.com",
        "reddit.com",
    }

    if normalized_domain in high_authority_domains:
        return 1.5

    if normalized_domain in strong_media_domains:
        return 1.0

    return 0.0


def title_signal_boost(title: str) -> float:
    normalized_title = title.lower()
    weighted_terms = {
        "launch": 1.2,
        "launches": 1.2,
        "release": 1.2,
        "releases": 1.2,
        "announces": 1.0,
        "unveils": 1.0,
        "open source": 1.0,
        "benchmark": 0.9,
        "leaderboard": 0.9,
        "eval": 0.8,
        "funding": 0.8,
        "raises": 0.8,
        "partnership": 0.7,
        "acquires": 0.9,
        "chip": 0.7,
        "gpu": 0.8,
        "agent": 0.7,
        "model": 0.7,
        "reasoning": 0.7,
        "research": 0.7,
    }
    boost = sum(
        weight
        for term, weight in weighted_terms.items()
        if term in normalized_title
    )

    return min(boost, 3.0)


def recency_boost(published_at: datetime | None) -> float:
    if published_at is None:
        return 0.0

    age = datetime.now(timezone.utc) - published_at

    if age <= timedelta(days=1):
        return 1.2

    if age <= timedelta(days=3):
        return 0.8

    if age <= timedelta(days=7):
        return 0.4

    return 0.0


def signal_from_gdelt_article(article: dict) -> RankingSignal:
    url = str(article.get("url", ""))

    return RankingSignal(
        title=str(article.get("title", "")),
        url=url,
        domain=str(article.get("domain") or get_domain(url)),
        published_at=parse_gdelt_article_datetime(article),
        source="gdelt_global_news",
        source_weight=1.0,
    )


def normalize_signal_items(
    signals: list[RankingSignal | dict],
) -> list[RankingSignal]:
    return [
        signal if isinstance(signal, RankingSignal) else signal_from_gdelt_article(signal)
        for signal in signals
    ]


def signal_mentions_company(
    signal: RankingSignal,
    aliases: list[str],
) -> bool:
    text = " ".join((signal.title, signal.url, signal.domain))

    return any(
        alias_matches_text(alias, text)
        for alias in aliases
    )


def article_mentions_company(
    article: dict,
    aliases: list[str],
) -> bool:
    return signal_mentions_company(
        signal_from_gdelt_article(article),
        aliases,
    )


def alias_matches_text(alias: str, text: str) -> bool:
    if len(alias) <= 2:
        return False

    pattern = rf"(?<![a-zA-Z0-9]){re.escape(alias)}(?![a-zA-Z0-9])"

    return re.search(pattern, text, flags=re.IGNORECASE) is not None


def build_gdelt_url(query: str) -> str:
    params = {
        "query": query,
        "mode": "ArtList",
        "format": "json",
        "maxrecords": str(gdelt_max_records),
        "timespan": settings.atlascore_company_ranking_timespan,
        "sort": "datedesc",
    }

    return f"{gdelt_doc_api_url}?{urlencode(params)}"


def build_gdelt_company_query(company: CompanyEntity) -> str:
    aliases = dedupe_company_aliases(company)
    alias_query = " OR ".join(
        quote_gdelt_phrase(alias)
        for alias in aliases
    )

    return f"({alias_query}) {ranking_context_query}"


def dedupe_company_aliases(company: CompanyEntity) -> list[str]:
    aliases = [company.name, *company.aliases]
    cleaned_aliases: list[str] = []
    seen_aliases: set[str] = set()

    for alias in aliases:
        cleaned_alias = alias.strip()
        normalized_alias = cleaned_alias.lower()

        if not cleaned_alias or normalized_alias in seen_aliases:
            continue

        seen_aliases.add(normalized_alias)
        cleaned_aliases.append(cleaned_alias)

        if len(cleaned_aliases) >= 6:
            break

    return cleaned_aliases


def quote_gdelt_phrase(value: str) -> str:
    escaped_value = value.replace('"', "")

    return f'"{escaped_value}"'


def parse_gdelt_article_datetime(article: dict) -> datetime | None:
    for field_name in ("seendate", "date", "datetime"):
        value = article.get(field_name)

        if not value:
            continue

        parsed_datetime = parse_compact_datetime(str(value))

        if parsed_datetime is not None:
            return parsed_datetime

    return None


def parse_compact_datetime(value: str) -> datetime | None:
    cleaned_value = value.strip()

    if not cleaned_value:
        return None

    for date_format in ("%Y%m%dT%H%M%SZ", "%Y%m%d%H%M%S"):
        try:
            return datetime.strptime(
                cleaned_value,
                date_format,
            ).replace(tzinfo=timezone.utc)
        except ValueError:
            continue

    return parse_iso_datetime(cleaned_value)


def parse_iso_datetime(value: str) -> datetime | None:
    cleaned_value = value.strip()

    if not cleaned_value:
        return None

    try:
        parsed_datetime = datetime.fromisoformat(
            cleaned_value.replace("Z", "+00:00"),
        )
    except ValueError:
        return None

    if parsed_datetime.tzinfo is None:
        return parsed_datetime.replace(tzinfo=timezone.utc)

    return parsed_datetime


def parse_feed_datetime(entry) -> datetime | None:
    for field_name in ("published", "updated", "created"):
        value = getattr(entry, field_name, None)

        if not value:
            continue

        try:
            parsed_datetime = parsedate_to_datetime(value)
        except (TypeError, ValueError):
            continue

        if parsed_datetime.tzinfo is None:
            return parsed_datetime.replace(tzinfo=timezone.utc)

        return parsed_datetime

    return None


def get_domain(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix("www.")


def get_xml_text(
    entry: ET.Element,
    path: str,
    namespace: dict[str, str],
) -> str:
    child = entry.find(path, namespace)

    if child is None or child.text is None:
        return ""

    return " ".join(child.text.split())


def get_xml_link(
    entry: ET.Element,
    namespace: dict[str, str],
) -> str:
    for link in entry.findall("atom:link", namespace):
        if link.attrib.get("rel") == "alternate":
            return link.attrib.get("href", "")

    link = entry.find("atom:link", namespace)

    if link is None:
        return ""

    return link.attrib.get("href", "")


def dedupe_signals(signals: list[RankingSignal]) -> list[RankingSignal]:
    deduped_signals: list[RankingSignal] = []
    seen_keys: set[str] = set()

    for signal in signals:
        title = " ".join(signal.title.lower().split())

        if not title:
            continue

        key = signal.url or f"{signal.source}:{title}"

        if key in seen_keys:
            continue

        seen_keys.add(key)
        deduped_signals.append(signal)

    return deduped_signals
