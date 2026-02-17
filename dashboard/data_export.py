"""Export Digest objects to JSON files for the web dashboard."""
from __future__ import annotations

import json
import logging
from pathlib import Path

from models import Digest

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
DIGESTS_DIR = DATA_DIR / "digests"
INDEX_FILE = DATA_DIR / "index.json"


def _digest_id(digest: Digest) -> str:
    return digest.generated_at.strftime("%Y%m%d_%H%M%S")


def _serialize_digest(digest: Digest) -> dict:
    digest_id = _digest_id(digest)
    sections = []
    for section in digest.sections:
        items = []
        for item in section.items:
            items.append({
                "item_id": item.id,
                "title": item.title,
                "url": item.url,
                "source_name": item.source_name,
                "source_type": item.source_type.value,
                "published": item.published.isoformat() if item.published else None,
                "score": round(item.score, 1),
                "matched_topics": item.matched_topics,
                "summary": item.summary,
                "extra": item.extra,
            })
        sections.append({
            "title": section.title,
            "items": items,
        })

    return {
        "id": digest_id,
        "generated_at": digest.generated_at.isoformat(),
        "intro_summary": digest.intro_summary,
        "project_recommendations": digest.project_recommendations,
        "total_items": digest.total_items,
        "sources_checked": digest.sources_checked,
        "sections": sections,
    }


def _update_index(digest: Digest) -> None:
    digest_id = _digest_id(digest)
    intro = digest.intro_summary
    # Take first sentence for the snippet
    dot_pos = intro.find(". ")
    intro_snippet = intro[: dot_pos + 1] if dot_pos > 0 else intro[:200]

    entry = {
        "id": digest_id,
        "generated_at": digest.generated_at.isoformat(),
        "total_items": digest.total_items,
        "sources_checked": digest.sources_checked,
        "intro_snippet": intro_snippet,
    }

    index = []
    if INDEX_FILE.exists():
        try:
            index = json.loads(INDEX_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            index = []

    # Remove existing entry with same id (re-run protection)
    index = [e for e in index if e.get("id") != digest_id]
    # Prepend new entry (newest first)
    index.insert(0, entry)

    INDEX_FILE.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")


def save_digest_json(digest: Digest) -> None:
    """Write digest data as JSON files for the web dashboard."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DIGESTS_DIR.mkdir(parents=True, exist_ok=True)

    digest_id = _digest_id(digest)
    data = _serialize_digest(digest)

    # Write full digest file
    digest_file = DIGESTS_DIR / f"{digest_id}.json"
    digest_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    logger.info("Wrote digest JSON: %s", digest_file)

    # Update index
    _update_index(digest)
    logger.info("Updated digest index: %s", INDEX_FILE)
