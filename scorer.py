from __future__ import annotations

import re
from models import NewsItem, DigestSection


def score_items(items: list[NewsItem], topics: dict) -> list[NewsItem]:
    """Score each item by keyword matches against configured topics.

    Title matches count 3x, content_snippet matches count 1x.
    Each match is multiplied by the topic's weight.
    Items with score 0 are excluded.
    """
    for item in items:
        total_score = 0.0
        matched: list[str] = []
        title_lower = item.title.lower()
        snippet_lower = item.content_snippet.lower()

        for topic_key, topic_cfg in topics.items():
            weight = topic_cfg.get("weight", 1)
            topic_score = 0.0

            for kw in topic_cfg.get("keywords", []):
                kw_lower = kw.lower()
                # Use word-boundary-aware search for short keywords
                pattern = re.escape(kw_lower)
                title_hits = len(re.findall(pattern, title_lower))
                snippet_hits = len(re.findall(pattern, snippet_lower))
                topic_score += (title_hits * 3 + snippet_hits) * weight

            if topic_score > 0:
                total_score += topic_score
                matched.append(topic_key)

        item.score = total_score
        item.matched_topics = matched

    return [item for item in items if item.score > 0]


def sort_and_limit(items: list[NewsItem], max_items: int) -> list[NewsItem]:
    """Sort by score descending and limit to max_items."""
    items.sort(key=lambda x: x.score, reverse=True)
    return items[:max_items]


def group_into_sections(items: list[NewsItem], topics: dict) -> list[DigestSection]:
    """Group scored items into sections by their highest-scoring topic."""
    section_map: dict[str, list[NewsItem]] = {}

    for item in items:
        if not item.matched_topics:
            continue
        # Use the first matched topic (highest weight match) as the section
        primary_topic = item.matched_topics[0]
        section_map.setdefault(primary_topic, []).append(item)

    # Build sections in the order topics are defined in config
    sections: list[DigestSection] = []
    for topic_key, topic_cfg in topics.items():
        if topic_key in section_map:
            sections.append(DigestSection(
                title=topic_cfg.get("label", topic_key),
                items=section_map[topic_key],
            ))

    return sections
