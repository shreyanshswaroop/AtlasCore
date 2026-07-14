import argparse
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.news_sync_service import run_news_sync


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Sync AtlasCore AI news items from configured feeds."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=30,
        help="Maximum items to fetch per source.",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_arguments()

    print("Starting AtlasCore news sync")
    print(f"Limit per source: {args.limit}")
    print()

    try:
        result = run_news_sync(
            max_items_per_source=args.limit,
        )
    except Exception as error:
        print(f"News sync failed: {error}")
        raise SystemExit(1) from error

    print("News sync completed")
    print(f"Status: {result.status}")
    print(f"Fetched: {result.fetched}")
    print(f"Processed: {result.processed}")
    print(f"Failed: {result.failed}")
    print(f"Total news items: {result.total_items}")


if __name__ == "__main__":
    main()
