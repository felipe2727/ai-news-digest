from __future__ import annotations

import logging
import time

from google import genai
from google.genai import types

from models import NewsItem, DigestSection

logger = logging.getLogger(__name__)


class Summarizer:
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self.client = genai.Client(api_key=api_key)
        self.model = model

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

    def _call(self, prompt: str, retries: int = 3, max_tokens: int = 300) -> str:
        """Make an API call with simple retry logic."""
        for attempt in range(retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        max_output_tokens=max_tokens,
                    ),
                )
                text = response.text.strip()
                time.sleep(4)  # Stay under Gemini free tier 15 RPM limit
                return text
            except Exception as e:
                if "429" in str(e) or "ResourceExhausted" in str(e):
                    wait = 2 ** attempt
                    logger.warning("Rate limited, retrying in %ds...", wait)
                    time.sleep(wait)
                else:
                    logger.error("Summarization failed: %s", e)
                    return ""
        return ""
