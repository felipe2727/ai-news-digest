"""Export Digest objects to Supabase for the web dashboard."""
from __future__ import annotations

import logging
import os
import re

from slugify import slugify
from supabase import create_client, Client

from models import Digest, DigestSection

logger = logging.getLogger(__name__)


def _get_client() -> Client:
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(url, key)


def _make_slug(title: str, item_hash: str, digest_id: str) -> str:
    """Generate a URL-safe slug from a title, with hash suffix for uniqueness."""
    base = slugify(title, max_length=60)
    suffix = f"{item_hash[:4]}{digest_id[:4]}"
    return f"{base}-{suffix}" if base else f"{item_hash}-{digest_id[:6]}"


def save_digest_to_supabase(digest: Digest) -> str | None:
    """Write digest and articles to Supabase. Returns the digest UUID."""
    client = _get_client()

    # Insert digest
    digest_data = {
        "generated_at": digest.generated_at.isoformat(),
        "intro_summary": digest.intro_summary,
        "project_recommendations": digest.project_recommendations,
        "total_items": digest.total_items,
        "sources_checked": digest.sources_checked,
    }
    result = client.table("digests").insert(digest_data).execute()
    digest_id = result.data[0]["id"]
    logger.info("Inserted digest %s", digest_id)

    # Insert articles
    articles = []
    for section in digest.sections:
        for item in section.items:
            articles.append({
                "digest_id": digest_id,
                "item_hash": item.id,
                "title": item.title,
                "slug": _make_slug(item.title, item.id, digest_id),
                "url": item.url,
                "source_name": item.source_name,
                "source_type": item.source_type.value,
                "published_at": item.published.isoformat() if item.published else None,
                "score": round(item.score, 1),
                "matched_topics": item.matched_topics,
                "summary": item.summary,
                "content_snippet": item.content_snippet[:500] if item.content_snippet else "",
                "extra": item.extra,
                "section_title": section.title,
            })

    if articles:
        try:
            client.table("articles").upsert(articles, on_conflict="slug").execute()
            logger.info("Inserted %d articles for digest %s", len(articles), digest_id)
        except Exception as e:
            logger.error("Failed to insert articles for digest %s: %s", digest_id, e)
            # Roll back the digest so we don't leave an empty shell
            try:
                client.table("digests").delete().eq("id", digest_id).execute()
                logger.info("Rolled back digest %s after article insert failure", digest_id)
            except Exception:
                pass
            raise

    return digest_id
