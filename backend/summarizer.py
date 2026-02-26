from __future__ import annotations

import json
import logging
import re
import time

from openai import OpenAI

from models import NewsItem, DigestSection

logger = logging.getLogger(__name__)

SYSTEM_MSG = (
    "You are a concise AI news summarizer. "
    "Respond ONLY with the requested summary text. "
    "Do not include reasoning, thinking, citations, or web search results. "
    "Do not use markdown links or URL citations."
)


class Summarizer:
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.client = OpenAI(api_key=api_key)
        self.model = model

    def summarize_item(self, item: NewsItem) -> str:
        """Generate a 2-3 sentence summary of a single news item."""
        content = item.content_snippet[:2000] if item.content_snippet else item.title
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
        """Generate 1 creative project/business idea inspired by today's digest."""
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
            "You are a creative startup advisor. Based on today's AI news digest below, "
            "come up with ONE original project or business idea that someone could build "
            "inspired by the trends and tools in this digest.\n\n"
            "Be creative and specific — don't just describe an existing project from the list. "
            "Instead, imagine a NEW product, tool, or side project that combines or builds on "
            "what's trending. Think about gaps, opportunities, or creative mashups.\n\n"
            "Respond ONLY with a JSON array containing exactly 1 object (no markdown, no code fences). "
            "The object must have:\n"
            '- "name": a catchy name for the project idea\n'
            '- "description": one sentence describing what it does\n'
            '- "why": one sentence on why this is a good idea right now (connect it to today\'s trends)\n'
            '- "url": leave as empty string ""\n'
            '- "category": one of "saas", "tool", "community", "marketplace"\n\n'
            f"Today's digest items:\n{overview}\n\n"
            "JSON array:"
        )
        raw = self._call(prompt, max_tokens=400)
        return self._parse_projects_json(raw)

    def generate_hero_image(self, item: NewsItem) -> str:
        """Generate a single hero image for the top article using DALL-E 3."""
        topic = item.matched_topics[0].replace("_", " ") if item.matched_topics else "ai"
        prompt = (
            "Abstract 3D topographic landscape, cyber-noir, dark background, "
            "emerald green accents, cinematic lighting, high contrast, "
            f"inspired by this AI news headline: {item.title}. "
            f"Topic context: {topic}. "
            "No text, no logos, no watermarks."
        )

        for attempt in range(2):
            try:
                response = self.client.images.generate(
                    model="dall-e-3",
                    prompt=prompt,
                    size="1792x1024",
                    quality="standard",
                    n=1,
                )
                image_url = (response.data[0].url if response.data else "") or ""
                if image_url:
                    logger.info("Generated hero image with DALL-E 3")
                    return image_url
            except Exception as e:
                logger.warning(
                    "Hero image generation failed (attempt %d/2): %s",
                    attempt + 1,
                    e,
                )

        return ""

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
            valid_cats = ("tool", "framework", "model", "library", "saas", "community", "marketplace")
            for p in projects[:3]:
                cat = str(p.get("category", "tool")).lower()
                cleaned.append({
                    "name": str(p.get("name", "Unnamed")),
                    "description": str(p.get("description", "")),
                    "why": str(p.get("why", "")),
                    "url": str(p.get("url", "")),
                    "category": cat if cat in valid_cats else "tool",
                })
            return json.dumps(cleaned)
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning("Failed to parse project JSON: %s — raw: %.200s", e, raw)
            return "[]"

    def _call(self, prompt: str, max_tokens: int = 300) -> str:
        """Make an OpenAI API call with retry on rate limits."""
        for attempt in range(3):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": SYSTEM_MSG},
                        {"role": "user", "content": prompt},
                    ],
                    max_tokens=max_tokens,
                    temperature=0.3,
                )
                text = (response.choices[0].message.content or "").strip()
                text = _clean_response(text)
                if text:
                    logger.info("Summarized with %s", self.model)
                    return text
            except Exception as e:
                err = str(e)
                if "429" in err or "rate" in err.lower():
                    wait = 5 * (2 ** attempt)
                    logger.warning("Rate limited (attempt %d/3), waiting %ds...", attempt + 1, wait)
                    time.sleep(wait)
                else:
                    logger.error("OpenAI call failed: %s", e)
                    break

        logger.error("Summarization failed after retries for: %.80s...", prompt)
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
