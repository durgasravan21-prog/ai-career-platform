"""GitHub project analyzer AI engine (MOCK – Phase 2).

Returns realistic static analysis results for any submitted GitHub project.
"""

from __future__ import annotations

from typing import Any

from datetime import datetime, timezone
from app.schemas.project import ProjectAnalysisResponse, UpgradeSuggestionSchema


async def analyze_project(
    metadata: dict[str, Any],
    project_id: int = 1,
    github_url: str = "",
) -> ProjectAnalysisResponse:
    """Analyse a project based on its metadata and return a quality assessment.

    This is a **mock** implementation that returns realistic, deterministic
    results without calling any external AI service.

    Args:
        metadata: Dict with keys like languages, file_count, readme_score,
                  commit_activity, stars, description.
        project_id: The ID of the project being analyzed.
        github_url: The URL of the GitHub repository.

    Returns:
        ProjectAnalysisResponse with scores and actionable feedback.
    """
    # Derive scores from metadata heuristics
    file_count: int = metadata.get("file_count", 10)
    readme_score: int = metadata.get("readme_score", 5)
    commit_activity: int = metadata.get("commit_activity", 20)
    languages: list[str] = metadata.get("languages", ["Python"])
    stars: int = metadata.get("stars", 0)

    # Problem clarity: based on readme quality
    problem_clarity = min(10, max(1, readme_score))

    # Technical complexity: based on file count and language diversity
    tech_complexity = min(10, max(1, len(languages) * 2 + file_count // 10))

    # Career relevance: composite score
    career_relevance = min(100, max(10, commit_activity * 2 + stars + file_count + readme_score * 5))

    # Determine portfolio grade
    total_score = problem_clarity + tech_complexity + (career_relevance // 10)
    if total_score >= 25:
        grade = "A"
    elif total_score >= 18:
        grade = "B"
    elif total_score >= 12:
        grade = "C"
    else:
        grade = "D"

    missing_improvements = [
        "Add comprehensive unit tests (pytest or Jest) to achieve ≥80% coverage",
        "Include a CI/CD pipeline configuration (GitHub Actions recommended)",
        "Add API documentation with OpenAPI/Swagger or Postman collection",
        "Implement proper error handling with custom exception classes",
        "Add a detailed README with architecture diagram, setup instructions, and screenshots",
        "Include Docker support with multi-stage builds for production deployment",
    ]

    # Filter improvements based on what might already exist
    if readme_score >= 7:
        missing_improvements = [m for m in missing_improvements if "README" not in m]
    if file_count > 30:
        missing_improvements = [m for m in missing_improvements if "unit tests" not in m]

    reasoning = (
        f"This project demonstrates {'strong' if grade in ('A', 'B') else 'developing'} "
        f"software engineering practices. The codebase uses {', '.join(languages)} "
        f"with {file_count} files and {commit_activity} commits, indicating "
        f"{'active' if commit_activity > 15 else 'limited'} development engagement. "
        f"The README quality is {'excellent' if readme_score >= 7 else 'adequate' if readme_score >= 4 else 'needs improvement'}. "
        f"To strengthen this project for portfolio use, focus on the suggested improvements below."
    )

    # Mock upgrade suggestions
    upgrade_suggestions = [
        UpgradeSuggestionSchema(
            feature_name="Redis Caching",
            description="Implement Redis caching to reduce database loads on frequent query endpoints.",
            career_impact_score=85,
            estimated_hours=8,
            companies_that_value=["Netflix", "Meta", "Uber"],
            difficulty="medium",
        ),
        UpgradeSuggestionSchema(
            feature_name="E2E Testing Flow",
            description="Add Cypress or Playwright end-to-end integration tests for checkout/auth user paths.",
            career_impact_score=90,
            estimated_hours=12,
            companies_that_value=["Google", "Stripe", "Airbnb"],
            difficulty="hard",
        )
    ]

    return ProjectAnalysisResponse(
        id=1,
        project_id=project_id,
        github_url=github_url,
        problem_clarity=problem_clarity,
        technical_complexity=tech_complexity,
        career_relevance=career_relevance,
        missing_improvements=missing_improvements[:4],
        portfolio_grade=grade,
        upgrade_suggestions=upgrade_suggestions,
        reasoning=reasoning,
        analyzed_at=datetime.now(timezone.utc),
    )

