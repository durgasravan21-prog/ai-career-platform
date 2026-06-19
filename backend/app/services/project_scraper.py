"""AI-powered project scraper that discovers GitHub repositories and categorizes them.

Runs continuously in the background, searching GitHub every 60 minutes for
trending/latest repositories across various tech topics, then uses AI to
generate project templates with skill mappings, difficulty levels, and
upgrade suggestions.
"""

from __future__ import annotations

import asyncio
import logging
import os
import json
from datetime import datetime, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# ── Search topics mapped to platform roles and skills ─────────────────
SEARCH_TOPICS = [
    # Frontend
    {"query": "topic:react stars:>5 pushed:>2025-01-01", "role_hint": "Frontend Developer", "skill_hints": ["React", "TypeScript", "CSS/Tailwind"]},
    {"query": "topic:nextjs stars:>5 pushed:>2025-01-01", "role_hint": "Frontend Developer", "skill_hints": ["Next.js", "React", "TypeScript"]},
    {"query": "topic:vue stars:>5 pushed:>2025-01-01", "role_hint": "Frontend Developer", "skill_hints": ["React", "TypeScript", "CSS/Tailwind"]},
    # Backend
    {"query": "topic:fastapi stars:>5 pushed:>2025-01-01", "role_hint": "Backend Developer", "skill_hints": ["Python", "REST APIs", "PostgreSQL"]},
    {"query": "topic:express stars:>5 pushed:>2025-01-01", "role_hint": "Backend Developer", "skill_hints": ["Node.js", "REST APIs"]},
    {"query": "topic:django stars:>5 pushed:>2025-01-01", "role_hint": "Backend Developer", "skill_hints": ["Python", "REST APIs", "PostgreSQL"]},
    # Full-Stack
    {"query": "topic:fullstack stars:>3 pushed:>2025-01-01", "role_hint": "Full-Stack Developer", "skill_hints": ["React", "Node.js", "PostgreSQL", "REST APIs"]},
    # DevOps
    {"query": "topic:docker stars:>10 pushed:>2025-01-01", "role_hint": "DevOps Engineer", "skill_hints": ["Docker", "CI/CD", "AWS"]},
    {"query": "topic:kubernetes stars:>10 pushed:>2025-01-01", "role_hint": "DevOps Engineer", "skill_hints": ["Kubernetes", "Docker", "Terraform"]},
    {"query": "topic:terraform stars:>5 pushed:>2025-01-01", "role_hint": "Cloud Architect", "skill_hints": ["Terraform", "AWS", "Docker"]},
    # ML/AI
    {"query": "topic:machine-learning stars:>10 pushed:>2025-01-01", "role_hint": "ML Engineer", "skill_hints": ["Python", "TensorFlow", "PyTorch", "Machine Learning"]},
    {"query": "topic:pytorch stars:>5 pushed:>2025-01-01", "role_hint": "ML Engineer", "skill_hints": ["PyTorch", "Python", "Machine Learning"]},
    {"query": "topic:deep-learning stars:>5 pushed:>2025-01-01", "role_hint": "Data Scientist", "skill_hints": ["TensorFlow", "Python", "Machine Learning"]},
    # Mobile
    {"query": "topic:flutter stars:>5 pushed:>2025-01-01", "role_hint": "Mobile Developer", "skill_hints": ["Flutter"]},
    {"query": "topic:swiftui stars:>5 pushed:>2025-01-01", "role_hint": "Mobile Developer", "skill_hints": ["Swift"]},
]


async def _search_github_repos(query: str, per_page: int = 5) -> list[dict[str, Any]]:
    """Search GitHub for repositories matching the given query.

    Returns a list of raw repo dicts from the GitHub Search API.
    Rate-limited to 10 requests/min for unauthenticated users.
    """
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "CareerAI-Platform-Scraper",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"token {token}"

    url = "https://api.github.com/search/repositories"
    params = {
        "q": query,
        "sort": "updated",
        "order": "desc",
        "per_page": per_page,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=headers, params=params)
            if response.status_code == 200:
                data = response.json()
                return data.get("items", [])
            elif response.status_code == 403:
                logger.warning("GitHub API rate limit reached. Pausing scraper cycle.")
                return []
            else:
                logger.warning(f"GitHub search returned {response.status_code}: {response.text[:200]}")
                return []
    except Exception as e:
        logger.error(f"GitHub search failed: {e}")
        return []


def _estimate_difficulty(stars: int, size_kb: int, language_count: int) -> str:
    """Heuristic to estimate project difficulty based on repo metadata."""
    score = 0
    if stars > 100:
        score += 2
    elif stars > 20:
        score += 1
    if size_kb > 5000:
        score += 2
    elif size_kb > 1000:
        score += 1
    if language_count >= 4:
        score += 1

    if score >= 4:
        return "advanced"
    elif score >= 2:
        return "intermediate"
    return "beginner"


def _estimate_hours(difficulty: str, size_kb: int) -> int:
    """Estimate project hours based on difficulty and code size."""
    base = {"beginner": 20, "intermediate": 40, "advanced": 65}
    hours = base.get(difficulty, 30)
    if size_kb > 3000:
        hours += 15
    elif size_kb > 1000:
        hours += 8
    return min(hours, 120)


async def _ai_categorize_project(
    repo_name: str,
    repo_description: str,
    languages: list[str],
    stars: int,
    role_hint: str,
    skill_hints: list[str],
) -> dict[str, Any] | None:
    """Use AI (Gemini/OpenAI) to generate a rich project template from repo metadata.

    Returns a dict with title, description, difficulty, tech_stack, estimated_hours,
    career_relevance_score, matched_skills, and upgrade_suggestions.
    Falls back to heuristics if no API key is available.
    """
    try:
        from app.ai.llm import call_llm_json, get_api_keys
        gemini_key, openai_key = get_api_keys()

        if gemini_key or openai_key:
            prompt = (
                f"You are an AI Career Coach that categorizes GitHub repositories into learning projects.\n\n"
                f"Repository: {repo_name}\n"
                f"Description: {repo_description}\n"
                f"Languages: {', '.join(languages)}\n"
                f"Stars: {stars}\n"
                f"Suggested Role: {role_hint}\n"
                f"Suggested Skills: {', '.join(skill_hints)}\n\n"
                f"Generate a structured learning project template. Return ONLY a JSON object:\n"
                f'{{\n'
                f'  "title": "A clear, engaging project title (max 80 chars)",\n'
                f'  "description": "A 2-3 sentence project description explaining what the student will build and learn",\n'
                f'  "difficulty": "beginner|intermediate|advanced",\n'
                f'  "estimated_hours": 25,\n'
                f'  "career_relevance_score": 85.0,\n'
                f'  "matched_skills": ["React", "TypeScript"],\n'
                f'  "upgrade_suggestions": [\n'
                f'    {{\n'
                f'      "feature_name": "Feature Name",\n'
                f'      "description": "How to build this feature",\n'
                f'      "career_impact_score": 85,\n'
                f'      "estimated_hours": 10,\n'
                f'      "companies_that_value": ["Google", "Meta"],\n'
                f'      "difficulty": "medium"\n'
                f'    }}\n'
                f'  ]\n'
                f'}}'
            )

            result = await call_llm_json(prompt=prompt)
            if result and "title" in result:
                return result
    except Exception as e:
        logger.error(f"AI categorization failed for {repo_name}: {e}")

    # ── Fallback: heuristic-based categorization ──────────────────────
    return None


def _fallback_categorize(
    repo_name: str,
    repo_description: str,
    languages: list[str],
    stars: int,
    size_kb: int,
    role_hint: str,
    skill_hints: list[str],
) -> dict[str, Any]:
    """Heuristic fallback when AI API is unavailable."""
    difficulty = _estimate_difficulty(stars, size_kb, len(languages))
    hours = _estimate_hours(difficulty, size_kb)

    # Clean up the repo name into a readable title
    title = repo_name.replace("-", " ").replace("_", " ").title()
    if len(title) > 80:
        title = title[:77] + "..."

    description = repo_description or f"A {difficulty}-level {role_hint} project using {', '.join(languages[:3])}."
    if len(description) > 500:
        description = description[:497] + "..."

    return {
        "title": title,
        "description": description,
        "difficulty": difficulty,
        "estimated_hours": hours,
        "career_relevance_score": min(95.0, 60.0 + stars * 0.1 + len(skill_hints) * 5),
        "matched_skills": skill_hints[:5],
        "upgrade_suggestions": [
            {
                "feature_name": "Comprehensive Test Suite",
                "description": f"Add unit and integration tests using {'pytest' if 'Python' in languages else 'Jest/Vitest'} to demonstrate testing best practices.",
                "career_impact_score": 88,
                "estimated_hours": 12,
                "companies_that_value": ["Google", "Stripe", "Airbnb"],
                "difficulty": "medium",
            },
            {
                "feature_name": "CI/CD Pipeline",
                "description": "Set up GitHub Actions for automated testing, linting, and deployment on every push.",
                "career_impact_score": 85,
                "estimated_hours": 8,
                "companies_that_value": ["Netflix", "Uber", "Shopify"],
                "difficulty": "easy",
            },
        ],
    }


async def scrape_and_store_projects() -> int:
    """Run one cycle of the project scraper.

    Searches GitHub, categorizes repos with AI, and stores new project
    templates in the database. Returns the count of newly added projects.
    """
    from app.core.database import async_session_factory
    from app.models.project import Project, ProjectDifficulty, ProjectSkill
    from app.models.career import Skill
    from sqlalchemy import select

    new_count = 0
    total_scanned = 0

    for topic in SEARCH_TOPICS:
        repos = await _search_github_repos(topic["query"], per_page=3)
        if not repos:
            continue

        # Small delay between topic queries to respect rate limits
        await asyncio.sleep(2)

        for repo in repos:
            total_scanned += 1
            github_url = repo.get("html_url", "")
            if not github_url:
                continue

            # Check if we already have this project
            async with async_session_factory() as session:
                existing = await session.execute(
                    select(Project).where(Project.github_url == github_url)
                )
                if existing.scalar_one_or_none():
                    continue  # Skip duplicate

            repo_name = repo.get("name", "unknown")
            repo_desc = repo.get("description", "") or ""
            stars = repo.get("stargazers_count", 0)
            size_kb = repo.get("size", 100)
            repo_languages = list(repo.get("language", "Python") or "Python")
            # GitHub search only returns primary language; enhance with topic hints
            if isinstance(repo.get("language"), str):
                repo_languages = [repo["language"]]
            else:
                repo_languages = ["Python"]

            # Try AI categorization, fall back to heuristics
            ai_result = await _ai_categorize_project(
                repo_name, repo_desc, repo_languages, stars,
                topic["role_hint"], topic["skill_hints"]
            )

            if ai_result:
                project_data = ai_result
            else:
                project_data = _fallback_categorize(
                    repo_name, repo_desc, repo_languages, stars, size_kb,
                    topic["role_hint"], topic["skill_hints"]
                )

            # Save to database
            try:
                async with async_session_factory() as session:
                    # Double-check no duplicate (race condition guard)
                    dup_check = await session.execute(
                        select(Project).where(Project.github_url == github_url)
                    )
                    if dup_check.scalar_one_or_none():
                        continue

                    difficulty_val = project_data.get("difficulty", "beginner")
                    if difficulty_val not in ("beginner", "intermediate", "advanced"):
                        difficulty_val = "beginner"

                    tech_stack = {
                        "languages": repo_languages,
                        "role_hint": topic["role_hint"],
                        "source": "github_scraper",
                        "scraped_at": datetime.now(timezone.utc).isoformat(),
                    }
                    # Store AI upgrade suggestions in tech_stack
                    upgrade_suggestions = project_data.get("upgrade_suggestions", [])
                    if upgrade_suggestions:
                        tech_stack["upgrade_suggestions"] = upgrade_suggestions

                    project = Project(
                        title=project_data.get("title", repo_name)[:500],
                        description=project_data.get("description", repo_desc)[:5000] if project_data.get("description") else repo_desc[:5000],
                        difficulty=ProjectDifficulty(difficulty_val),
                        tech_stack=tech_stack,
                        estimated_hours=project_data.get("estimated_hours", 30),
                        career_relevance_score=project_data.get("career_relevance_score", 70.0),
                        github_url=github_url,
                    )
                    session.add(project)
                    await session.flush()

                    # Link to skills
                    matched_skills = project_data.get("matched_skills", topic["skill_hints"])
                    for skill_name in matched_skills[:6]:
                        skill_result = await session.execute(
                            select(Skill).where(Skill.name.ilike(skill_name))
                        )
                        skill = skill_result.scalar_one_or_none()
                        if skill:
                            ps = ProjectSkill(
                                project_id=project.id,
                                skill_id=skill.id,
                                is_primary=(skill_name == matched_skills[0]),
                            )
                            session.add(ps)

                    await session.commit()
                    new_count += 1
                    logger.info(f"[Scraper] Added project: {project.title} ({github_url})")

            except Exception as e:
                logger.error(f"[Scraper] Failed to save project {repo_name}: {e}")
                continue

    logger.info(f"[Scraper] Cycle complete. Scanned {total_scanned} repos, added {new_count} new projects.")
    return new_count


async def run_project_scraper_loop(interval_seconds: int = 3600) -> None:
    """Run the project scraper in a continuous loop.

    Args:
        interval_seconds: Seconds to wait between scraper cycles (default 60 min).
    """
    logger.info(f"[Scraper] Starting continuous project scraper (interval: {interval_seconds}s)...")

    # Initial delay to let the app fully start up
    await asyncio.sleep(10)

    while True:
        try:
            count = await scrape_and_store_projects()
            logger.info(f"[Scraper] Completed cycle. {count} new projects added. Next run in {interval_seconds}s.")
        except asyncio.CancelledError:
            logger.info("[Scraper] Background scraper cancelled. Shutting down.")
            break
        except Exception as e:
            logger.error(f"[Scraper] Unhandled error in scraper cycle: {e}")

        try:
            await asyncio.sleep(interval_seconds)
        except asyncio.CancelledError:
            logger.info("[Scraper] Background scraper cancelled during sleep. Shutting down.")
            break
