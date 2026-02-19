from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class SourceType(Enum):
    REDDIT = "reddit"
    YOUTUBE = "youtube"
    NEWS = "news"
    GITHUB = "github"


@dataclass
class NewsItem:
    title: str
    url: str
    source_name: str
    source_type: SourceType
    published: datetime | None = None
    content_snippet: str = ""
    score: float = 0.0
    matched_topics: list[str] = field(default_factory=list)
    summary: str = ""
    extra: dict = field(default_factory=dict)  # stars, upvotes, etc.

    @property
    def id(self) -> str:
        return hashlib.sha256(self.url.encode()).hexdigest()[:16]


@dataclass
class DigestSection:
    title: str
    items: list[NewsItem] = field(default_factory=list)


@dataclass
class Digest:
    generated_at: datetime
    intro_summary: str
    sections: list[DigestSection]
    total_items: int
    sources_checked: int
    project_recommendations: str = "[]"
