from __future__ import annotations

import json
import logging
import os
import re
import time
from datetime import datetime, timezone

import requests
from openai import OpenAI
from supabase import Client, create_client

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
        self.hero_bucket = os.getenv("SUPABASE_HERO_IMAGE_BUCKET", "hero-images")
        self.supabase = self._init_supabase_client()
        self._hero_bucket_ready = False

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

    def recommend_projects(
        self,
        sections: list[DigestSection],
        recent_projects: list[dict] | None = None,
        target_category: str | None = None,
    ) -> str:
        """Generate 1 creative project/business idea inspired by today's digest."""
        recent_projects = recent_projects or []
        valid_cats = ("tool", "framework", "model", "library", "saas", "community", "marketplace")
        category = (target_category or "tool").lower()
        if category not in valid_cats:
            category = "tool"

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
        avoid_names = [str(p.get("name", "")) for p in recent_projects if p.get("name")]
        avoid_names_text = ", ".join(avoid_names[:12]) if avoid_names else "None"

        prompt = (
            "You are a creative startup advisor for daily AI build ideas.\n\n"
            "Generate ONE original project idea based on today's digest. "
            "The idea must be specific and implementation-oriented, not generic.\n\n"
            "Hard constraints:\n"
            f"1) Category MUST be exactly \"{category}\".\n"
            "2) Do not reuse names or concepts from recent ideas.\n"
            "3) Avoid generic coding-copilot concepts unless strongly differentiated.\n"
            "4) Connect directly to at least two concrete trends in today's digest.\n\n"
            f"Recent idea names to avoid: {avoid_names_text}\n\n"
            "Respond ONLY with a JSON array containing exactly 1 object (no markdown, no code fences). "
            "The object must have:\n"
            '- "name": a catchy name for the project idea\n'
            '- "description": one sentence describing what it does\n'
            '- "why": one sentence on why this is a good idea right now (connect it to today\'s trends)\n'
            '- "url": leave as empty string ""\n'
            f'- "category": exactly "{category}"\n\n'
            f"Today's digest items:\n{overview}\n\n"
            "JSON array:"
        )

        raw = self._call(prompt, max_tokens=450, temperature=0.85)
        parsed = self._parse_projects_json(raw)

        # Retry once with stronger anti-duplication guidance if output clashes with recent history.
        if recent_projects and self._is_project_duplicate(parsed, recent_projects):
            retry_prompt = (
                prompt
                + "\n\nPrevious output was too close to recent ideas. "
                + "Regenerate with a distinctly different product name, audience, and value proposition."
            )
            raw_retry = self._call(retry_prompt, max_tokens=450, temperature=0.9)
            parsed_retry = self._parse_projects_json(raw_retry)
            if parsed_retry != "[]" and not self._is_project_duplicate(parsed_retry, recent_projects):
                return parsed_retry

        return parsed

    def generate_hero_image(self, item: NewsItem) -> str:
        """Generate and persist a hero image for the top article."""
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
                    stored_url = self._store_hero_image(item, image_url)
                    if stored_url:
                        logger.info("Generated hero image with DALL-E 3 and stored in Supabase")
                        return stored_url
                    logger.warning("Generated hero image but failed to persist to Supabase")
                    return ""
            except Exception as e:
                logger.warning(
                    "Hero image generation failed (attempt %d/2): %s",
                    attempt + 1,
                    e,
                )

        return ""

    @staticmethod
    def _init_supabase_client() -> Client | None:
        """Create a Supabase client for hero-image storage, if configured."""
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        if not url or not key:
            logger.warning("Supabase storage credentials missing; hero images will use fallback")
            return None
        try:
            return create_client(url, key)
        except Exception as e:
            logger.warning("Failed to initialize Supabase client: %s", e)
            return None

    def _ensure_hero_bucket(self) -> bool:
        """Ensure the hero image bucket exists and is public."""
        if not self.supabase:
            return False
        if self._hero_bucket_ready:
            return True
        try:
            bucket_names: set[str] = set()
            for bucket in self.supabase.storage.list_buckets() or []:
                if isinstance(bucket, dict):
                    name = bucket.get("name") or bucket.get("id")
                else:
                    name = getattr(bucket, "name", None) or getattr(bucket, "id", None)
                if name:
                    bucket_names.add(str(name))

            if self.hero_bucket not in bucket_names:
                self.supabase.storage.create_bucket(
                    self.hero_bucket,
                    options={
                        "public": True,
                        "file_size_limit": 8 * 1024 * 1024,
                        "allowed_mime_types": ["image/png", "image/jpeg", "image/webp"],
                    },
                )
                logger.info("Created Supabase storage bucket: %s", self.hero_bucket)

            self._hero_bucket_ready = True
            return True
        except Exception as e:
            logger.warning("Failed to ensure hero image bucket '%s': %s", self.hero_bucket, e)
            return False

    def _store_hero_image(self, item: NewsItem, temp_url: str) -> str:
        """Download generated image and upload to Supabase Storage, returning public URL."""
        if not self.supabase:
            return ""
        if not self._ensure_hero_bucket():
            return ""

        try:
            response = requests.get(temp_url, timeout=30)
            response.raise_for_status()
        except Exception as e:
            logger.warning("Failed to download generated hero image: %s", e)
            return ""

        content_type = response.headers.get("content-type", "image/png").split(";")[0].strip().lower()
        ext = "png"
        if content_type == "image/jpeg":
            ext = "jpg"
        elif content_type == "image/webp":
            ext = "webp"
        elif content_type not in {"image/png", "image/jpeg", "image/webp"}:
            content_type = "image/png"

        path = f"{datetime.now(timezone.utc).strftime('%Y/%m/%d')}/{item.id}.{ext}"

        try:
            self.supabase.storage.from_(self.hero_bucket).upload(
                path,
                response.content,
                file_options={
                    "content-type": content_type,
                    "x-upsert": "true",
                },
            )
            return self.supabase.storage.from_(self.hero_bucket).get_public_url(path)
        except Exception as e:
            logger.warning("Failed to upload hero image to Supabase Storage: %s", e)
            return ""

    @staticmethod
    def _parse_projects_json(raw: str) -> str:
        """Parse LLM response into a validated single-project JSON array string."""
        if not raw:
            return "[]"
        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
        raw = re.sub(r"\s*```$", "", raw.strip())
        try:
            projects = json.loads(raw)
            if isinstance(projects, dict):
                projects = [projects]
            if not isinstance(projects, list):
                raise ValueError("Expected a JSON array")
            # Validate and clean each project
            cleaned: list[dict] = []
            valid_cats = ("tool", "framework", "model", "library", "saas", "community", "marketplace")
            for p in projects[:1]:
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

    @staticmethod
    def _is_project_duplicate(raw_project_json: str, recent_projects: list[dict]) -> bool:
        """Check if generated project is too similar to recent projects."""
        try:
            parsed = json.loads(raw_project_json)
            if not isinstance(parsed, list) or not parsed:
                return False
            p = parsed[0]
        except Exception:
            return False

        new_sig = (
            f"{str(p.get('name', '')).lower()}|"
            f"{str(p.get('description', '')).lower()[:120]}"
        )
        for recent in recent_projects:
            recent_sig = (
                f"{str(recent.get('name', '')).lower()}|"
                f"{str(recent.get('description', '')).lower()[:120]}"
            )
            if new_sig == recent_sig:
                return True
            if str(p.get("name", "")).strip().lower() == str(recent.get("name", "")).strip().lower():
                return True
        return False

    def _call(self, prompt: str, max_tokens: int = 300, temperature: float = 0.3) -> str:
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
                    temperature=temperature,
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
