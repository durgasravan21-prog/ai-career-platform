"""GitHub project analyzer AI engine.

Returns detailed static analysis results for any submitted GitHub project using LLM APIs.
"""

from __future__ import annotations

import logging
from typing import Any
from datetime import datetime, timezone
from app.schemas.project import ProjectAnalysisResponse, UpgradeSuggestionSchema
from app.ai.llm import call_llm_json, get_api_keys

logger = logging.getLogger(__name__)

async def analyze_project(
    metadata: dict[str, Any],
    project_id: int = 1,
    github_url: str = "",
) -> ProjectAnalysisResponse:
    """Analyse a project based on its metadata and return a quality assessment using an AI agent."""
    gemini_key, openai_key = get_api_keys()

    if gemini_key or openai_key:
        try:
            logger.info("Using real AI Project Analyzer (GitRepo Scanner & Suggestions Agent)...")
            prompt = (
                f"You are an AI Git Repository Auditor and Career Advisor Agent.\n"
                f"Your task is to analyze the following GitHub repository metadata and return a detailed code quality analysis and upgrade suggestions.\n"
                f"Repository URL: {github_url}\n"
                f"Metadata:\n"
                f"- Primary Languages: {metadata.get('languages')}\n"
                f"- Approximate File Count: {metadata.get('file_count')}\n"
                f"- README Quality Score (1-10): {metadata.get('readme_score')}\n"
                f"- Commit Activity Count: {metadata.get('commit_activity')}\n"
                f"- GitHub Stars: {metadata.get('stars')}\n"
                f"- Description: \"{metadata.get('description')}\"\n\n"
                f"Provide a structured analysis returning exactly these fields in JSON:\n"
                f"1. problem_clarity: Score from 1 to 10 evaluating how clearly the README/description explains the project.\n"
                f"2. technical_complexity: Score from 1 to 10 based on size, language composition, and engineering practices.\n"
                f"3. career_relevance: Score from 1 to 100 on how relevant this project is to tech industry hiring managers.\n"
                f"4. portfolio_grade: Overall grade (A, B, C, D, or F).\n"
                f"5. missing_improvements: List of 3-5 specific technical elements missing (e.g., CI/CD pipelines, unit tests, OpenAPI docs, dockerization, observability, error handling).\n"
                f"6. reasoning: A 3-4 sentence professional review summary.\n"
                f"7. upgrade_suggestions: List of 2-3 specific feature suggestions to make this project stand out. Each must have:\n"
                f"   - feature_name (string)\n"
                f"   - description (string explanation of how to build it)\n"
                f"   - career_impact_score (integer 1-100)\n"
                f"   - estimated_hours (integer)\n"
                f"   - companies_that_value (list of strings of top tech companies)\n"
                f"   - difficulty (string: easy, medium, or hard)\n\n"
                f"Return ONLY the raw JSON object matching this schema:\n"
                f"{{\n"
                f"  \"problem_clarity\": 8,\n"
                f"  \"technical_complexity\": 7,\n"
                f"  \"career_relevance\": 85,\n"
                f"  \"portfolio_grade\": \"B\",\n"
                f"  \"missing_improvements\": [\"improvement 1\", \"improvement 2\"],\n"
                f"  \"reasoning\": \"Professional summary review...\",\n"
                f"  \"upgrade_suggestions\": [\n"
                f"    {{\n"
                f"      \"feature_name\": \"Redis Cache\",\n"
                f"      \"description\": \"Add Redis caching to...\",\n"
                f"      \"career_impact_score\": 90,\n"
                f"      \"estimated_hours\": 10,\n"
                f"      \"companies_that_value\": [\"Netflix\", \"Uber\"],\n"
                f"      \"difficulty\": \"medium\"\n"
                f"    }}\n"
                f"  ]\n"
                f"}}"
            )

            result = await call_llm_json(prompt=prompt)
            if "problem_clarity" in result:
                upgrade_schema_list = []
                for sug in result.get("upgrade_suggestions", []):
                    upgrade_schema_list.append(
                        UpgradeSuggestionSchema(
                            feature_name=sug.get("feature_name", "Upgrade Feature"),
                            description=sug.get("description", ""),
                            career_impact_score=sug.get("career_impact_score", 70),
                            estimated_hours=sug.get("estimated_hours", 8),
                            companies_that_value=sug.get("companies_that_value", []),
                            difficulty=sug.get("difficulty", "medium"),
                        )
                    )
                return ProjectAnalysisResponse(
                    id=1,
                    project_id=project_id,
                    github_url=github_url,
                    problem_clarity=result.get("problem_clarity", 5),
                    technical_complexity=result.get("technical_complexity", 5),
                    career_relevance=result.get("career_relevance", 50),
                    missing_improvements=result.get("missing_improvements", []),
                    portfolio_grade=result.get("portfolio_grade", "C"),
                    upgrade_suggestions=upgrade_schema_list,
                    reasoning=result.get("reasoning", "Analysis completed successfully by AI Agent."),
                    analyzed_at=datetime.now(timezone.utc),
                )
        except Exception as e:
            logger.error(f"Real AI Project Analyzer failed: {e}. Falling back to simulation.")

    # Fallback Heuristics
    file_count: int = metadata.get("file_count", 10)
    readme_score: int = metadata.get("readme_score", 5)
    commit_activity: int = metadata.get("commit_activity", 20)
    languages: list[str] = metadata.get("languages", ["Python"])
    stars: int = metadata.get("stars", 0)

    problem_clarity = min(10, max(1, readme_score))
    tech_complexity = min(10, max(1, len(languages) * 2 + file_count // 10))
    career_relevance = min(100, max(10, commit_activity * 2 + stars + file_count + readme_score * 5))

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
        "Write simple unit tests (with pytest or Jest) to check if your functions work correctly.",
        "Add a simple pipeline (GitHub Actions) to automatically test and build your code on commits.",
        "Add simple API docs (using Swagger or Postman) so others know how to use your code endpoints.",
        "Add simple error handling to catch bugs and show clean messages instead of crashing.",
        "Write a clear README file with setup instructions, pictures, and how the app works.",
        "Add a simple Dockerfile to package your app so it can run easily on any computer.",
    ]

    if readme_score >= 7:
        missing_improvements = [m for m in missing_improvements if "README" not in m]
    if file_count > 30:
        missing_improvements = [m for m in missing_improvements if "unit tests" not in m]

    reasoning = (
        f"This project shows {'good' if grade in ('A', 'B') else 'simple'} programming choices. "
        f"It is written in {', '.join(languages)} with {file_count} files and {commit_activity} code changes. "
        f"The README file is {'very clear and easy to read' if readme_score >= 7 else 'good' if readme_score >= 4 else 'needs more details'}. "
        f"Please check the suggestions below to make your project even better for your portfolio."
    )

    upgrade_suggestions = [
        UpgradeSuggestionSchema(
            feature_name="Redis Caching",
            description="Use Redis to cache frequent query results so the database does not work too hard.",
            career_impact_score=85,
            estimated_hours=8,
            companies_that_value=["Netflix", "Meta", "Uber"],
            difficulty="medium",
        ),
        UpgradeSuggestionSchema(
            feature_name="E2E Testing Flow",
            description="Add Cypress or Playwright tests to test the main user actions like login and checkout automatically.",
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
