from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta

import feedparser
import requests
from bs4 import BeautifulSoup

from models import NewsItem, SourceType

logger = logging.getLogger(__name__)

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "AI-News-Digest/1.0 (personal project; Python/requests)"
})
SESSION.timeout = 15


def _parse_date(entry: dict) -> datetime | None:
    """Extract a timezone-aware datetime from a feed entry."""
    for key in ("published_parsed", "updated_parsed"):
        tp = entry.get(key)
        if tp:
            try:
                return datetime(*tp[:6], tzinfo=timezone.utc)
            except Exception:
                pass
    return None


def _strip_html(html: str, max_chars: int = 500) -> str:
    """Strip HTML tags and return plain text truncated to max_chars."""
    text = BeautifulSoup(html, "html.parser").get_text(separator=" ", strip=True)
    return text[:max_chars]


# ---------------------------------------------------------------------------
# RSS fetcher (Reddit, YouTube, News)
# ---------------------------------------------------------------------------

def fetch_rss(
    url: str,
    source_name: str,
    source_type: SourceType,
    lookback_hours: int,
    max_items: int = 20,
) -> list[NewsItem]:
    """Fetch and parse an RSS/Atom feed, returning NewsItems within the lookback window."""
    try:
        resp = SESSION.get(url, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        logger.warning("Failed to fetch %s (%s): %s", source_name, url, e)
        return []

    feed = feedparser.parse(resp.text)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)
    items: list[NewsItem] = []

    for entry in feed.entries[:max_items]:
        published = _parse_date(entry)
        if published and published < cutoff:
            continue

        # Build content snippet from available fields
        content_html = ""
        if entry.get("content"):
            content_html = entry.content[0].get("value", "")
        elif entry.get("summary"):
            content_html = entry.summary
        elif entry.get("media_group"):
            # YouTube Atom feeds
            desc = entry.get("media_description", "")
            content_html = desc

        snippet = _strip_html(content_html)

        link = entry.get("link", "")
        title = entry.get("title", "No title")

        items.append(NewsItem(
            title=title,
            url=link,
            source_name=source_name,
            source_type=source_type,
            published=published,
            content_snippet=snippet,
        ))

    logger.info("Fetched %d items from %s", len(items), source_name)
    return items


# ---------------------------------------------------------------------------
# GitHub trending page scraper
# ---------------------------------------------------------------------------

def fetch_github_trending() -> list[NewsItem]:
    """Scrape github.com/trending for weekly trending repos."""
    url = "https://github.com/trending?since=weekly&spoken_language_code=en"
    try:
        resp = SESSION.get(url, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        logger.warning("Failed to fetch GitHub trending: %s", e)
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    items: list[NewsItem] = []

    for row in soup.select("article.Box-row")[:20]:
        # Repo name
        h2 = row.select_one("h2 a")
        if not h2:
            continue
        repo_path = h2.get("href", "").strip("/")
        repo_url = f"https://github.com/{repo_path}"
        repo_name = repo_path.replace("/", " / ")

        # Description
        p = row.select_one("p")
        desc = p.get_text(strip=True) if p else ""

        # Stars
        stars_el = row.select_one("[href$='/stargazers']")
        stars = stars_el.get_text(strip=True).replace(",", "") if stars_el else "0"

        # Language
        lang_el = row.select_one("[itemprop='programmingLanguage']")
        lang = lang_el.get_text(strip=True) if lang_el else ""

        items.append(NewsItem(
            title=repo_name,
            url=repo_url,
            source_name="GitHub Trending",
            source_type=SourceType.GITHUB,
            content_snippet=desc,
            extra={"stars": stars, "language": lang},
        ))

    logger.info("Fetched %d trending repos from GitHub", len(items))
    return items


# ---------------------------------------------------------------------------
# GitHub API search
# ---------------------------------------------------------------------------

def fetch_github_search(queries: list[dict]) -> list[NewsItem]:
    """Search GitHub API for recently created repos matching topic queries."""
    items: list[NewsItem] = []

    for q in queries:
        topic = q["topic"]
        min_stars = q.get("min_stars", 50)
        days = q.get("created_within_days", 7)
        since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

        api_url = (
            f"https://api.github.com/search/repositories"
            f"?q=topic:{topic}+created:>{since}+stars:>={min_stars}"
            f"&sort=stars&order=desc&per_page=10"
        )
        try:
            resp = SESSION.get(api_url, timeout=15)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            logger.warning("GitHub API search failed for topic '%s': %s", topic, e)
            continue

        for repo in data.get("items", []):
            items.append(NewsItem(
                title=repo["full_name"],
                url=repo["html_url"],
                source_name=f"GitHub Search ({topic})",
                source_type=SourceType.GITHUB,
                content_snippet=repo.get("description", "") or "",
                extra={
                    "stars": str(repo.get("stargazers_count", 0)),
                    "language": repo.get("language", ""),
                    "topics": repo.get("topics", []),
                },
            ))

    # Deduplicate by URL (same repo may match multiple topic queries)
    seen_urls: set[str] = set()
    unique: list[NewsItem] = []
    for item in items:
        if item.url not in seen_urls:
            seen_urls.add(item.url)
            unique.append(item)

    logger.info("Fetched %d repos from GitHub API search", len(unique))
    return unique


# ---------------------------------------------------------------------------
# Fetch all sources from config
# ---------------------------------------------------------------------------

def fetch_all(config: dict) -> list[NewsItem]:
    """Fetch items from all configured sources."""
    from concurrent.futures import ThreadPoolExecutor, as_completed

    lookback = config["schedule"]["lookback_hours"]
    max_per = config["schedule"]["max_items_per_source"]
    sources = config["sources"]
    all_items: list[NewsItem] = []
    futures = []

    with ThreadPoolExecutor(max_workers=8) as pool:
        # RSS-based sources
        source_type_map = {
            "reddit": SourceType.REDDIT,
            "youtube": SourceType.YOUTUBE,
            "news": SourceType.NEWS,
        }
        for source_key, st in source_type_map.items():
            if source_key not in sources:
                continue
            for feed in sources[source_key].get("feeds", []):
                futures.append(pool.submit(
                    fetch_rss, feed["url"], feed["name"], st, lookback, max_per
                ))

        # GitHub trending
        if sources.get("github", {}).get("scrape_trending"):
            futures.append(pool.submit(fetch_github_trending))

        # GitHub API search
        gh_queries = sources.get("github", {}).get("search_queries", [])
        if gh_queries:
            futures.append(pool.submit(fetch_github_search, gh_queries))

        for future in as_completed(futures):
            try:
                all_items.extend(future.result())
            except Exception as e:
                logger.error("Fetcher raised an exception: %s", e)

    logger.info("Total fetched: %d items from all sources", len(all_items))
    return all_items
