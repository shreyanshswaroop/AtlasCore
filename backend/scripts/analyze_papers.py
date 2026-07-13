import argparse
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from workers.analysis_worker import process_next_paper


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate AI analysis for AtlasCore papers."
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=1,
        help="Maximum number of papers to analyze.",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_arguments()

    if args.limit < 1:
        raise SystemExit("--limit must be at least 1.")

    db = SessionLocal()
    processed_count = 0

    try:
        print("Starting AtlasCore AI analysis worker")
        print(f"Processing limit: {args.limit}")
        print()

        for _ in range(args.limit):
            result = process_next_paper(db)

            if not result.processed:
                print("No papers without analysis were found.")
                break

            processed_count += 1

            print(f"Analyzed: {result.arxiv_id}")
            print(f"Title: {result.title}")
            print()

        print("AI analysis worker completed")
        print(f"Processed: {processed_count}")

    except Exception as error:
        print(f"AI analysis worker failed: {error}")
        raise SystemExit(1) from error

    finally:
        db.close()


if __name__ == "__main__":
    main()
