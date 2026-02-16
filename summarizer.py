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

    def _call(self, prompt: str, retries: int = 3) -> str:
        """Make an API call with simple retry logic."""
        for attempt in range(retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        max_output_tokens=300,
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
