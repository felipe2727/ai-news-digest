"""
AI News Digest - Main Orchestrator

Usage:
    python main.py                 # Full run (fetch, score, summarize, email)
    python main.py --dry-run       # Fetch + score only, print results
    python main.py --force         # Ignore last_run timestamp
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

import yaml
from dotenv import load_dotenv

from models import Digest
from fetchers import fetch_all
from google import genai
from scorer import score_items, sort_and_limit, group_into_sections, semantic_rerank
from dedup import load_seen, filter_new, save_seen
from summarizer import Summarizer
from emailer import send_digest

BASE_DIR = Path(__file__).parent
STATE_DIR = BASE_DIR / "state"
LAST_RUN_FILE = STATE_DIR / "last_run.json"


def setup_logging() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    # Fix Windows console encoding for Unicode characters
    if sys.stdout.encoding != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(STATE_DIR / "digest.log", mode="a"),
        ],
    )


def load_config() -> dict:
    """Load config.yaml and resolve environment variable placeholders."""
    with open(BASE_DIR / "config.yaml") as f:
        text = f.read()

    # Replace ${VAR} with environment variable values
    def replace_env(match: re.Match) -> str:
        var = match.group(1)
        return os.getenv(var, match.group(0))

    text = re.sub(r"\$\{(\w+)\}", replace_env, text)
    return yaml.safe_load(text)


def should_run(config: dict, force: bool) -> bool:
    """Check if enough time has passed since the last run."""
    if force:
        return True
    if not LAST_RUN_FILE.exists():
        return True
    try:
        data = json.loads(LAST_RUN_FILE.read_text())
        last = datetime.fromisoformat(data["last_run"])
        interval = timedelta(days=config["schedule"]["interval_days"])
        return datetime.now(timezone.utc) - last >= interval
    except Exception:
        return True


def save_last_run() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    LAST_RUN_FILE.write_text(json.dumps({
        "last_run": datetime.now(timezone.utc).isoformat()
    }))


def main() -> None:
    parser = argparse.ArgumentParser(description="AI News Digest")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and score only, no AI or email")
    parser.add_argument("--force", action="store_true", help="Run even if last run was recent")
    args = parser.parse_args()

    setup_logging()
    logger = logging.getLogger("main")

    load_dotenv(BASE_DIR / ".env")
    config = load_config()

    # Check timing
    if not should_run(config, args.force):
        logger.info("Too soon since last run. Use --force to override.")
        return

    # Fetch
    logger.info("Fetching from all sources...")
    all_items = fetch_all(config)
    logger.info("Fetched %d total items", len(all_items))

    # Dedup
    seen = load_seen()
    new_items = filter_new(all_items, seen)
    logger.info("After dedup: %d new items (filtered %d seen)", len(new_items), len(all_items) - len(new_items))

    # Score & filter
    topics = config.get("topics", {})
    scored = score_items(new_items, topics)
    logger.info("After keyword scoring: %d items (including zero-score)", len(scored))

    # Create Gemini client (used for embeddings + summarization)
    api_key = os.getenv("GEMINI_API_KEY")
    gemini_client = genai.Client(api_key=api_key) if api_key else None

    # Semantic re-ranking
    if gemini_client:
        scored = semantic_rerank(scored, topics, gemini_client)
        logger.info("After semantic rerank: %d items above threshold", len(scored))
    else:
        scored = [item for item in scored if item.score > 0]
        logger.info("No GEMINI_API_KEY, using keyword-only scoring: %d items", len(scored))

    scored = sort_and_limit(scored, config["schedule"]["max_items_in_digest"])
    logger.info("After sort_and_limit: %d items in digest", len(scored))

    if not scored:
        logger.info("No relevant items found. Skipping digest.")
        return

    # Group into sections
    sections = group_into_sections(scored, topics)

    # Dry run: print results and exit
    if args.dry_run:
        print(f"\n{'='*60}")
        print(f"DRY RUN - {len(scored)} items would be in the digest")
        print(f"{'='*60}\n")
        for section in sections:
            print(f"--- {section.title} ({len(section.items)} items) ---")
            for item in section.items:
                print(f"  [{item.score:.0f}] [{item.source_name}] {item.title}")
                print(f"         {item.url}")
            print()
        return

    # Enrich articles with full content via Firecrawl (optional)
    firecrawl_key = os.getenv("FIRECRAWL_API_KEY")
    if firecrawl_key:
        from enricher import enrich_items
        enrich_items(scored, firecrawl_key)
    else:
        logger.info("No FIRECRAWL_API_KEY set, skipping content enrichment")

    # Summarize with Gemini
    if not gemini_client:
        logger.error("GEMINI_API_KEY not set — cannot summarize")
        return

    summarizer = Summarizer(gemini_client)

    logger.info("Summarizing %d items via Gemini...", sum(len(s.items) for s in sections))
    for section in sections:
        for item in section.items:
            item.summary = summarizer.summarize_item(item)

    intro = summarizer.summarize_digest(sections)

    logger.info("Generating project recommendations...")
    project_recs = summarizer.recommend_projects(sections)

    # Build digest
    digest = Digest(
        generated_at=datetime.now(timezone.utc),
        intro_summary=intro,
        sections=sections,
        total_items=sum(len(s.items) for s in sections),
        project_recommendations=project_recs,
        sources_checked=sum(
            len(src.get("feeds", []))
            for src in config.get("sources", {}).values()
        ) + 1,  # +1 for GitHub trending
    )

    # Send email
    logger.info("Sending digest email...")
    send_digest(digest, config)

    # Export to Supabase
    try:
        from supabase_export import save_digest_to_supabase
        digest_id = save_digest_to_supabase(digest)
        logger.info("Digest persisted to Supabase (id=%s)", digest_id)
    except Exception as e:
        logger.warning("Supabase export failed: %s — falling back to JSON", e)
        try:
            from data_export import save_digest_json
            save_digest_json(digest)
            logger.info("Digest data exported as JSON (fallback)")
        except Exception as e2:
            logger.warning("JSON export also failed: %s", e2)

    # Update state
    save_seen(seen, scored)
    save_last_run()
    logger.info("Done! Digest sent with %d items.", digest.total_items)


if __name__ == "__main__":
    main()
