"""Enrich news items with full article content via Firecrawl."""
from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

from models import NewsItem, SourceType

logger = logging.getLogger(__name__)

FIRECRAWL_URL = "https://api.firecrawl.dev/v1/scrape"
MAX_CONTENT_CHARS = 3000


def _scrape_url(url: str, api_key: str) -> str | None:
    """Scrape a single URL via Firecrawl, return markdown text or None."""
    try:
        resp = requests.post(
            FIRECRAWL_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={"url": url, "formats": ["markdown"]},
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            markdown = data.get("data", {}).get("markdown", "")
            return markdown[:MAX_CONTENT_CHARS] if markdown else None
        logger.warning("Firecrawl returned %d for %s", resp.status_code, url)
    except Exception as e:
        logger.warning("Firecrawl failed for %s: %s", url, e)
    return None


def enrich_items(items: list[NewsItem], api_key: str) -> None:
    """Enrich items with full article text from Firecrawl. Modifies items in place."""
    enrichable = [
        item for item in items
        if item.source_type in (SourceType.NEWS, SourceType.REDDIT)
        and len(item.content_snippet) < 500
    ]
    if not enrichable:
        logger.info("No items need Firecrawl enrichment")
        return

    logger.info("Enriching %d items with Firecrawl...", len(enrichable))

    with ThreadPoolExecutor(max_workers=4) as pool:
        future_to_item = {
            pool.submit(_scrape_url, item.url, api_key): item
            for item in enrichable
        }
        enriched = 0
        for future in as_completed(future_to_item):
            item = future_to_item[future]
            try:
                text = future.result()
                if text and len(text) > len(item.content_snippet):
                    item.content_snippet = text
                    enriched += 1
            except Exception as e:
                logger.warning("Enrichment failed for %s: %s", item.title[:50], e)

    logger.info("Enriched %d/%d items with full content", enriched, len(enrichable))
