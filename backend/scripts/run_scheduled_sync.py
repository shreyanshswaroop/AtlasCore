from __future__ import annotations

import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.news_sync_service import (
    run_news_sync,
    serialize_news_sync_result,
)


def main() -> None:
    result = run_news_sync(max_items_per_source=30)
    serialized_result = serialize_news_sync_result(result)

    print(serialized_result)

    if serialized_result.get("status") != "completed":
        error_message = serialized_result.get("error") or "Scheduled sync failed."
        raise RuntimeError(error_message)


if __name__ == "__main__":
    main()