"""Skill-gap analysis AI engine (MOCK implementation).

Produces realistic career-coaching content without calling any external LLM.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.career import SkillGapItem, SkillGapResult


# ── Realistic learning suggestions keyed by skill name ────────────────
_LEARNING_MAP: dict[str, str] = {
    "React": (
        "Start with React fundamentals on react.dev — complete the Tic-Tac-Toe tutorial, "
        "then build a dashboard with React Router and TanStack Query. "
        "Recommended course: 'Epic React' by Kent C. Dodds on epicreact.dev."
    ),
    "TypeScript": (
        "Work through the TypeScript Handbook, then migrate a small JS project to TS. "
        "Recommended: 'Total TypeScript' by Matt Pocock."
    ),
    "Python": (
        "Build a CLI tool and a REST API with FastAPI. "
        "Recommended: 'Python Distilled' by David Beazley and the official FastAPI tutorial."
    ),
    "Node.js": (
        "Build a REST API with Express.js, then explore Fastify for performance. "
        "Recommended: 'Node.js Design Patterns' by Mario Casciaro."
    ),
    "PostgreSQL": (
        "Complete the PostgreSQL exercises on pgexercises.com, then practice query optimization. "
        "Recommended: 'The Art of PostgreSQL' by Dimitri Fontaine."
    ),
    "Docker": (
        "Containerize an existing app, write multi-stage Dockerfiles, and use Docker Compose. "
        "Recommended: 'Docker Deep Dive' by Nigel Poulton."
    ),
    "Kubernetes": (
        "Start with Minikube locally, deploy a multi-service app, learn Helm charts. "
        "Recommended: 'Kubernetes in Action' by Marko Lukša."
    ),
    "AWS": (
        "Get hands-on with EC2, S3, RDS, and Lambda via the AWS Free Tier. "
        "Recommended: AWS Solutions Architect Associate certification path on A Cloud Guru."
    ),
    "TensorFlow": (
        "Complete the TensorFlow Developer Certificate curriculum on Coursera. "
        "Build an image classifier and a text sentiment model."
    ),
    "PyTorch": (
        "Work through the official PyTorch tutorials, then implement a CNN and a transformer. "
        "Recommended: 'Deep Learning with PyTorch' by Eli Stevens."
    ),
    "GraphQL": (
        "Build a GraphQL API with Apollo Server, then integrate it with a React frontend. "
        "Recommended: 'Production Ready GraphQL' by Marc-André Giroux."
    ),
    "CI/CD": (
        "Set up GitHub Actions pipelines for lint, test, build, and deploy stages. "
        "Recommended: GitLab CI/CD or CircleCI documentation for advanced patterns."
    ),
    "System Design": (
        "Study 'Designing Data-Intensive Applications' by Martin Kleppmann. "
        "Practice system design interviews on excalidraw with mock scenarios."
    ),
    "REST APIs": (
        "Design and build a complete RESTful service with proper status codes, pagination, "
        "and authentication. Study the JSON:API specification."
    ),
    "CSS/Tailwind": (
        "Rebuild a popular website's UI with Tailwind CSS. "
        "Recommended: Tailwind CSS official docs and 'Refactoring UI' by Adam Wathan."
    ),
    "Git": (
        "Master branching strategies (Git Flow, trunk-based), interactive rebase, and bisect. "
        "Recommended: 'Pro Git' book (free online)."
    ),
    "Flutter": (
        "Build a cross-platform app with Flutter following the official cookbook. "
        "Recommended: 'Flutter in Action' by Eric Windmill."
    ),
    "Swift": (
        "Complete Apple's SwiftUI tutorials, then build a full iOS app with Core Data. "
        "Recommended: Stanford CS193p course (free on YouTube)."
    ),
    "Terraform": (
        "Define cloud infrastructure as code with Terraform modules for AWS/GCP. "
        "Recommended: HashiCorp Learn tracks and 'Terraform: Up & Running' by Yevgeniy Brikman."
    ),
    "Machine Learning": (
        "Complete Andrew Ng's Machine Learning Specialization on Coursera, then build "
        "an end-to-end ML pipeline with scikit-learn and MLflow."
    ),
}

_DEFAULT_SUGGESTION = (
    "Study official documentation, complete hands-on tutorials, and build a "
    "portfolio project that demonstrates the skill in a real-world context."
)


async def analyze_skill_gap(
    current_skills: list[dict[str, Any]],
    target_role: dict[str, Any],
    db: AsyncSession,
) -> SkillGapResult:
    """Analyze the gap between a user's current skills and a target role.

    This is a **mock** implementation that returns realistic, deterministic
    career-coaching data based on the role and skill names.

    Args:
        current_skills: List of dicts with keys: skill_name, proficiency_level.
        target_role: Dict with keys: title, required_skills (list of dicts with
                     skill_name, proficiency_needed, priority).
        db: Async database session (unused in mock, kept for interface parity).

    Returns:
        A complete SkillGapResult with actionable recommendations.
    """
    role_title: str = target_role.get("title", "Software Engineer")
    required_skills: list[dict[str, Any]] = target_role.get("required_skills", [])

    # Build a lookup of the user's current skills
    current_lookup: dict[str, str] = {
        s["skill_name"]: s.get("proficiency_level", "beginner")
        for s in current_skills
    }

    proficiency_rank = {"beginner": 1, "intermediate": 2, "advanced": 3}

    missing_items: list[SkillGapItem] = []
    priority_order: list[str] = []
    suggested_projects: list[str] = []

    for req in sorted(required_skills, key=lambda r: r.get("priority", 99)):
        skill_name = req["skill_name"]
        required_level = req.get("proficiency_needed", "intermediate")
        current_level = current_lookup.get(skill_name)

        # Skill is missing or below required proficiency
        if current_level is None or proficiency_rank.get(
            current_level, 0
        ) < proficiency_rank.get(required_level, 2):
            missing_items.append(
                SkillGapItem(
                    skill_name=skill_name,
                    current_level=current_level,
                    required_level=required_level,
                    priority=req.get("priority", 5),
                    learning_suggestion=_LEARNING_MAP.get(skill_name, _DEFAULT_SUGGESTION),
                )
            )
            priority_order.append(skill_name)

    # Generate project suggestions based on missing skills
    _project_map: dict[str, str] = {
        "React": "Build a real-time dashboard with React, Redux Toolkit, and WebSockets",
        "TypeScript": "Create a type-safe REST client library published to npm",
        "Python": "Build a FastAPI microservice with async SQLAlchemy and JWT auth",
        "Node.js": "Develop a real-time chat server with Socket.io and Redis pub/sub",
        "PostgreSQL": "Design a multi-tenant SaaS database schema with RLS",
        "Docker": "Containerize a 3-tier application with Docker Compose",
        "Kubernetes": "Deploy a microservices app on Kubernetes with Helm charts",
        "AWS": "Build a serverless data pipeline with Lambda, SQS, and DynamoDB",
        "TensorFlow": "Train and deploy an image classification model with TF Serving",
        "PyTorch": "Implement a transformer model for text classification",
        "Flutter": "Build a cross-platform expense tracker with local storage",
        "Swift": "Create an iOS fitness tracker with HealthKit integration",
        "Terraform": "Provision a production-grade VPC with Terraform modules",
        "Machine Learning": "Build an end-to-end ML pipeline with feature store and model registry",
    }

    for skill_name in priority_order[:5]:
        project = _project_map.get(
            skill_name,
            f"Build a portfolio project demonstrating {skill_name} proficiency",
        )
        suggested_projects.append(project)

    # Compute match percentage
    total_required = len(required_skills) if required_skills else 1
    matched = total_required - len(missing_items)
    match_pct = round((matched / total_required) * 100, 1)

    # Broad learning suggestions
    learning_suggestions = [
        f"Focus on {priority_order[0]} first — it's the highest-priority gap for {role_title}."
        if priority_order
        else f"You're well-aligned for {role_title}! Consider deepening existing skills.",
        "Dedicate 1-2 focused hours daily to deliberate practice.",
        "Contribute to open-source projects in your gap areas for real-world experience.",
        "Join developer communities (Discord, Reddit, meetups) for accountability.",
        "Build projects that combine multiple gap skills to maximize learning efficiency.",
    ]

    estimated_months = max(3, len(missing_items) * 2)

    return SkillGapResult(
        target_role=role_title,
        current_match_percentage=match_pct,
        missing_skills=missing_items,
        priority_order=priority_order,
        suggested_projects=suggested_projects,
        learning_suggestions=learning_suggestions,
        estimated_months=estimated_months,
    )
