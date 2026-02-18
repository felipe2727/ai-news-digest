from __future__ import annotations

import logging

import requests

from models import NewsItem, DigestSection

logger = logging.getLogger(__name__)

# Free models on OpenRouter, in priority order
DEFAULT_MODELS = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-4-maverick:free",
    "qwen/qwen3-235b-a22b:free",
]

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


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
        """Recommend the top 3 projects to explore based on the digest."""
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
            f"Based on today's AI news digest below, recommend the top 3 projects "
            f"or tools that are most worth exploring or trying out. "
            f"For each, provide:\n"
            f"1. The project name\n"
            f"2. A one-sentence description of what it does\n"
            f"3. Why it's worth checking out right now\n\n"
            f"Focus on actionable, hands-on projects (GitHub repos, tools, frameworks) "
            f"rather than news stories. Format each as a numbered item.\n\n"
            f"Today's digest items:\n{overview}\n\n"
            f"Top 3 Project Recommendations:"
        )
        return self._call(prompt, max_tokens=500)

    def _call(self, prompt: str, max_tokens: int = 300) -> str:
        """Make an API call with model fallback — tries each model in order."""
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
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": max_tokens,
                    },
                    timeout=30,
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

                text = data["choices"][0]["message"]["content"].strip()
                if text:
                    logger.debug("Used model: %s", model)
                    return text

            except requests.exceptions.Timeout:
                logger.warning("Timeout on %s, trying next model...", model)
                continue
            except Exception as e:
                logger.warning("Error with %s: %s", model, e)
                continue

        logger.error("All models failed for prompt: %.80s...", prompt)
        return ""
