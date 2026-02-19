from __future__ import annotations

import json
import logging
import re
import time

import requests

from models import NewsItem, DigestSection

logger = logging.getLogger(__name__)

# Free models on OpenRouter, in priority order
DEFAULT_MODELS = [
    "openrouter/free",
    "google/gemma-3-27b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
]

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_MSG = (
    "You are a concise AI news summarizer. "
    "Respond ONLY with the requested summary text. "
    "Do not include reasoning, thinking, citations, or web search results. "
    "Do not use markdown links or URL citations."
)


class Summarizer:
    def __init__(self, api_key: str, models: list[str] | None = None):
        self.api_key = api_key
        self.models = models or DEFAULT_MODELS

    def summarize_item(self, item: NewsItem) -> str:
        """Generate a 2-3 sentence summary of a single news item."""
        content = item.content_snippet[:1000] if item.content_snippet else item.title
        prompt = (
            f"Summarize this AI news item in 2-3 concise sentences. "
            f"Focus on: what happened, why it matters, and any key facts.\n\n"
            f"Title: {item.title}\n"
            f"Source: {item.source_name}\n"
            f"Content: {content}\n\n"
            f"Summary:"
        )
        return self._call(prompt)

    def summarize_digest(self, sections: list[DigestSection]) -> str:
        """Generate a brief executive overview of the entire digest."""
        overview_lines = []
        for s in sections:
            titles = ", ".join(i.title for i in s.items[:5])
            overview_lines.append(f"- {s.title}: {titles}")
        overview = "\n".join(overview_lines)

        prompt = (
            f"Write a 3-4 sentence executive summary of today's AI news digest. "
            f"Highlight the most important trends and announcements. "
            f"Be concise and informative.\n\n"
            f"Sections and key items:\n{overview}\n\n"
            f"Executive Summary:"
        )
        return self._call(prompt)

    def recommend_projects(self, sections: list[DigestSection]) -> str:
        """Recommend the top 3 projects as structured JSON."""
        overview_lines = []
        for s in sections:
            for i in s.items[:5]:
                line = f"- [{s.title}] {i.title}"
                if i.extra.get("stars"):
                    line += f" ({i.extra['stars']} stars)"
                if i.url:
                    line += f" | {i.url}"
                overview_lines.append(line)
        overview = "\n".join(overview_lines)

        prompt = (
            "Based on today's AI news digest below, recommend the top 3 projects "
            "or tools that are most worth exploring or trying out.\n\n"
            "Respond ONLY with a JSON array (no markdown, no code fences). Each element must have:\n"
            '- "name": project name\n'
            '- "description": one-sentence description of what it does\n'
            '- "why": one sentence on why it\'s worth checking out right now\n'
            '- "url": the project URL (use the URL from the digest items)\n'
            '- "category": one of "tool", "framework", "model", "library"\n\n'
            "Focus on actionable, hands-on projects (GitHub repos, tools, frameworks) "
            "rather than news stories.\n\n"
            f"Today's digest items:\n{overview}\n\n"
            "JSON array:"
        )
        raw = self._call(prompt, max_tokens=600)
        return self._parse_projects_json(raw)

    @staticmethod
    def _parse_projects_json(raw: str) -> str:
        """Parse LLM response into a validated JSON array string."""
        if not raw:
            return "[]"
        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
        raw = re.sub(r"\s*```$", "", raw.strip())
        try:
            projects = json.loads(raw)
            if not isinstance(projects, list):
                raise ValueError("Expected a JSON array")
            # Validate and clean each project
            cleaned = []
            for p in projects[:3]:
                cleaned.append({
                    "name": str(p.get("name", "Unnamed")),
                    "description": str(p.get("description", "")),
                    "why": str(p.get("why", "")),
                    "url": str(p.get("url", "")),
                    "category": str(p.get("category", "tool"))
                    if p.get("category") in ("tool", "framework", "model", "library")
                    else "tool",
                })
            return json.dumps(cleaned)
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning("Failed to parse project JSON: %s — raw: %.200s", e, raw)
            return "[]"

    def _call(self, prompt: str, max_tokens: int = 300) -> str:
        """Make an API call with model fallback and retry on rate limits."""
        # Small delay between calls to stay under rate limits
        time.sleep(1.5)

        for attempt in range(3):  # retry up to 3 times
            for model in self.models:
                try:
                    response = requests.post(
                        OPENROUTER_URL,
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": model,
                            "messages": [
                                {"role": "system", "content": SYSTEM_MSG},
                                {"role": "user", "content": prompt},
                            ],
                            "max_tokens": max_tokens,
                        },
                        timeout=60,
                    )

                    if response.status_code == 429:
                        logger.warning("Rate limited on %s, trying next model...", model)
                        continue

                    if response.status_code != 200:
                        logger.warning(
                            "Model %s returned %d: %s",
                            model,
                            response.status_code,
                            response.text[:200],
                        )
                        continue

                    data = response.json()

                    # Check for OpenRouter error in response body
                    if "error" in data:
                        logger.warning("Model %s error: %s", model, data["error"])
                        continue

                    msg = data["choices"][0]["message"]
                    text = (msg.get("content") or "").strip()

                    # Clean up thinking model artifacts
                    text = _clean_response(text)

                    if text:
                        used = data.get("model", model)
                        logger.info("Summarized with %s", used)
                        return text

                except requests.exceptions.Timeout:
                    logger.warning("Timeout on %s, trying next model...", model)
                    continue
                except Exception as e:
                    logger.warning("Error with %s: %s", model, e)
                    continue

            # All models failed this attempt — wait before retrying
            wait = 10 * (attempt + 1)
            logger.warning("All models failed (attempt %d/3), waiting %ds...", attempt + 1, wait)
            time.sleep(wait)

        logger.error("All models failed after 3 attempts for: %.80s...", prompt)
        return ""


def _clean_response(text: str) -> str:
    """Remove thinking/reasoning artifacts from model responses."""
    # Remove <think>...</think> blocks
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    # Remove markdown URL citations [text](url)
    text = re.sub(r"\[([^\]]+)\]\(https?://[^)]+\)", r"\1", text)
    # Remove lines that start with common reasoning prefixes
    lines = text.split("\n")
    cleaned = []
    for line in lines:
        stripped = line.strip().lower()
        if stripped.startswith(("the user", "okay,", "let me", "i need to", "looking at")):
            continue
        cleaned.append(line)
    text = "\n".join(cleaned).strip()
    return text
