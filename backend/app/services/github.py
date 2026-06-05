"""GitHub repository metadata fetcher (MOCK – Phase 2).

Returns realistic static metadata for any GitHub URL so the application
can run end-to-end without a real GitHub token.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ProjectMetadata:
    """Metadata extracted from a GitHub repository."""

    languages: list[str] = field(default_factory=list)
    file_count: int = 0
    readme_score: int = 0  # 1-10
    commit_activity: int = 0
    stars: int = 0
    description: str = ""

    def to_dict(self) -> dict[str, Any]:
        """Convert to a plain dictionary for downstream consumers."""
        return {
            "languages": self.languages,
            "file_count": self.file_count,
            "readme_score": self.readme_score,
            "commit_activity": self.commit_activity,
            "stars": self.stars,
            "description": self.description,
        }


async def fetch_repo_metadata(
    github_url: str,
    token: str | None = None,
) -> ProjectMetadata:
    """Fetch metadata from a GitHub repository.

    This is a **mock** implementation that returns realistic data based
    on simple URL heuristics. In production, replace with actual GitHub
    API calls using httpx.

    Args:
        github_url: Full URL to the GitHub repository.
        token: Optional GitHub personal access token for higher rate limits.

    Returns:
        ProjectMetadata with languages, file count, README score, etc.
    """
    url_lower = github_url.lower()

    # Determine languages from URL keywords
    languages: list[str] = []
    lang_keywords = {
        "python": "Python",
        "fastapi": "Python",
        "django": "Python",
        "flask": "Python",
        "react": "TypeScript",
        "next": "TypeScript",
        "vue": "JavaScript",
        "angular": "TypeScript",
        "node": "JavaScript",
        "express": "JavaScript",
        "go": "Go",
        "rust": "Rust",
        "java": "Java",
        "spring": "Java",
        "flutter": "Dart",
        "swift": "Swift",
        "kotlin": "Kotlin",
    }
    for keyword, lang in lang_keywords.items():
        if keyword in url_lower and lang not in languages:
            languages.append(lang)

    if not languages:
        languages = ["Python", "JavaScript"]

    # Derive realistic metadata from URL hash for consistency
    url_hash = sum(ord(c) for c in github_url) % 100

    return ProjectMetadata(
        languages=languages,
        file_count=20 + url_hash,
        readme_score=min(10, max(3, url_hash % 10 + 1)),
        commit_activity=15 + url_hash % 50,
        stars=url_hash * 3,
        description=(
            f"A well-structured {'and '.join(languages)} project demonstrating "
            f"modern software engineering practices including testing, CI/CD, "
            f"and clean architecture patterns."
        ),
    )
