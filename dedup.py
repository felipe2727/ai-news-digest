from __future__ import annotations

import json
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

from models import NewsItem

logger = logging.getLogger(__name__)

STATE_FILE = Path(__file__).parent / "state" / "seen_items.json"


def load_seen() -> dict[str, str]:
    """Load seen item IDs with their timestamps. Returns {id: iso_timestamp}."""
    if not STATE_FILE.exists():
        return {}
    try:
        return json.loads(STATE_FILE.read_text())
    except Exception as e:
        logger.warning("Failed to load seen items: %s", e)
        return {}


def filter_new(items: list[NewsItem], seen: dict[str, str]) -> list[NewsItem]:
    """Return only items not previously seen."""
    return [item for item in items if item.id not in seen]


def save_seen(seen: dict[str, str], new_items: list[NewsItem]) -> None:
    """Add new items to seen state, prune entries older than 30 days, and save."""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=30)

    # Add new items
    for item in new_items:
        seen[item.id] = now.isoformat()

    # Prune old entries
    pruned = {
        k: v for k, v in seen.items()
        if datetime.fromisoformat(v) > cutoff
    }

    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(pruned, indent=2))
    logger.info("Saved %d seen items (%d pruned)", len(pruned), len(seen) - len(pruned))
