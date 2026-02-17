from __future__ import annotations

import logging
import re

import numpy as np
from google import genai

from models import NewsItem, DigestSection

logger = logging.getLogger(__name__)

# Semantic scoring constants
EMBED_MODEL = "gemini-embedding-001"
EMBED_BATCH_SIZE = 100
SEMANTIC_THRESHOLD = 0.65  # Min similarity to assign a topic to a zero-keyword item
SEMANTIC_SCALE = 20.0      # Max bonus: similarity 1.0 -> +20 points


def score_items(items: list[NewsItem], topics: dict) -> list[NewsItem]:
    """Score each item by keyword matches against configured topics.

    Title matches count 3x, content_snippet matches count 1x.
    Each match is multiplied by the topic's weight.
    Returns all items (including zero-score) for semantic re-ranking.
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

    return items


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two 1-D numpy arrays."""
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0.0:
        return 0.0
    return float(np.dot(a, b) / denom)


def _batch_embed(client: genai.Client, texts: list[str]) -> list[np.ndarray]:
    """Embed a list of texts in batches, returning one numpy vector per text."""
    import time
    all_vectors: list[np.ndarray] = []
    for start in range(0, len(texts), EMBED_BATCH_SIZE):
        batch = texts[start : start + EMBED_BATCH_SIZE]
        for attempt in range(3):
            try:
                response = client.models.embed_content(
                    model=EMBED_MODEL,
                    contents=batch,
                )
                for embedding in response.embeddings:
                    all_vectors.append(np.array(embedding.values, dtype=np.float32))
                break
            except Exception as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    wait = 2 ** attempt
                    logger.warning("Embedding rate limited, retrying in %ds...", wait)
                    time.sleep(wait)
                else:
                    logger.error("Embedding batch failed: %s", e)
                    all_vectors.extend([np.zeros(3072, dtype=np.float32)] * len(batch))
                    break
        else:
            logger.error("Embedding batch failed after retries")
            all_vectors.extend([np.zeros(3072, dtype=np.float32)] * len(batch))
    return all_vectors


def semantic_rerank(
    items: list[NewsItem],
    topics: dict,
    client: genai.Client,
) -> list[NewsItem]:
    """Re-score items using semantic similarity to topic descriptions.

    Adds a semantic bonus to existing keyword scores.
    Assigns matched_topics for items that had no keyword match but are
    semantically similar to a topic above SEMANTIC_THRESHOLD.
    """
    if not items:
        return items

    # Pre-filter: keep all keyword-matched items, plus top zero-score items
    # to stay under the free tier limit of 100 texts/minute
    keyword_items = [i for i in items if i.score > 0]
    zero_items = [i for i in items if i.score == 0]
    max_embed = 90 - len(topics)  # Reserve slots for topic descriptions
    if len(keyword_items) >= max_embed:
        embed_items = keyword_items[:max_embed]
    else:
        embed_items = keyword_items + zero_items[:max_embed - len(keyword_items)]
    embed_ids = {id(i) for i in embed_items}
    remaining = [i for i in items if id(i) not in embed_ids]
    logger.info(
        "Embedding %d items (%d keyword + %d zero-score candidates)",
        len(embed_items),
        len(keyword_items),
        len(embed_items) - min(len(keyword_items), len(embed_items)),
    )

    # Build topic description strings
    topic_keys = list(topics.keys())
    topic_texts: list[str] = []
    for key in topic_keys:
        cfg = topics[key]
        if cfg.get("semantic_description"):
            topic_texts.append(cfg["semantic_description"])
        else:
            kws = ", ".join(cfg.get("keywords", []))
            topic_texts.append(f"{cfg.get('label', key)}: {kws}")

    logger.info("Embedding %d topic descriptions...", len(topic_texts))
    topic_vectors = _batch_embed(client, topic_texts)

    # Build item texts for embedding
    item_texts = [
        f"{item.title}. {item.content_snippet[:300]}"
        for item in embed_items
    ]

    logger.info("Embedding %d items for semantic scoring...", len(embed_items))
    item_vectors = _batch_embed(client, item_texts)

    # Score each embedded item against topics
    for item, item_vec in zip(embed_items, item_vectors):
        best_sim = 0.0
        best_topic_key = None

        for topic_key, topic_vec in zip(topic_keys, topic_vectors):
            sim = _cosine_similarity(item_vec, topic_vec)
            if sim > best_sim:
                best_sim = sim
                best_topic_key = topic_key

        # Add semantic bonus
        item.score += best_sim * SEMANTIC_SCALE

        # Assign topic for items that had no keyword match
        if not item.matched_topics and best_sim >= SEMANTIC_THRESHOLD and best_topic_key:
            item.matched_topics = [best_topic_key]
            logger.debug(
                "Semantic rescue: '%s' -> topic '%s' (sim=%.3f)",
                item.title[:60],
                best_topic_key,
                best_sim,
            )

    # Combine embedded items with remaining items, drop irrelevant ones
    all_items = embed_items + remaining
    return [item for item in all_items if item.score > 0.5]


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
