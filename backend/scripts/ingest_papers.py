import argparse
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.services.ingestion_service import ingest_papers


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Ingest arXiv papers into PostgreSQL."
    )

    parser.add_argument(
        "--query",
        default="artificial intelligence",
        help="arXiv search query",
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Maximum number of papers to fetch",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_arguments()

    print("Starting AtlasCore paper ingestion")
    print(f"Query: {args.query}")
    print(f"Limit: {args.limit}")
    print()

    db = SessionLocal()

    try:
        result = ingest_papers(
            db=db,
            search_query=args.query,
            max_results=args.limit,
        )

        print("Ingestion completed successfully")
        print(f"Fetched: {result.fetched}")
        print(f"Processed: {result.processed}")

    except Exception as error:
        print(f"Ingestion failed: {error}")
        raise SystemExit(1) from error

    finally:
        db.close()


if __name__ == "__main__":
    main()
