"""Project upgrade suggestion engine (MOCK – Phase 2).

Returns three realistic feature upgrade suggestions for any project.
"""

from __future__ import annotations

from typing import Any

from app.schemas.project import UpgradeItem, UpgradeResponse


async def suggest_upgrades(project: dict[str, Any]) -> UpgradeResponse:
    """Suggest feature upgrades for a project to increase career impact.

    This is a **mock** implementation that returns three curated upgrade
    ideas regardless of project content, tailored to look realistic.

    Args:
        project: Dict with at least 'title' and optionally 'tech_stack',
                 'description', 'difficulty'.

    Returns:
        UpgradeResponse with three upgrade suggestions.
    """
    title = project.get("title", "Project")
    tech_stack: dict[str, Any] = project.get("tech_stack", {})
    languages: list[str] = tech_stack.get("languages", ["Python"])

    upgrades: list[UpgradeItem] = [
        UpgradeItem(
            feature="Real-time WebSocket Integration",
            description=(
                f"Add real-time functionality to {title} using WebSockets. "
                "Implement live notifications, real-time data updates, and collaborative "
                "features. Use Socket.io or native WebSocket API depending on the stack."
            ),
            career_impact=(
                "Real-time systems are a top-3 skill for senior full-stack roles. "
                "Demonstrates understanding of event-driven architecture, which is "
                "valued in fintech, collaboration tools, and gaming companies."
            ),
            estimated_hours=15,
            companies_that_value=[
                "Slack", "Discord", "Figma", "Notion", "Bloomberg", "Coinbase"
            ],
        ),
        UpgradeItem(
            feature="Authentication & Authorization with RBAC",
            description=(
                "Implement a complete auth system with role-based access control (RBAC). "
                "Include JWT tokens, refresh token rotation, OAuth2 social login "
                "(Google/GitHub), and granular permission checks per endpoint."
            ),
            career_impact=(
                "Security and auth are critical for any production application. "
                "RBAC demonstrates enterprise-grade thinking and is required for "
                "senior backend and full-stack positions at most companies."
            ),
            estimated_hours=20,
            companies_that_value=[
                "Auth0/Okta", "Stripe", "Google", "AWS", "Microsoft", "Datadog"
            ],
        ),
        UpgradeItem(
            feature="Observability Stack (Logging, Metrics, Tracing)",
            description=(
                f"Instrument {title} with structured logging (Pino/structlog), "
                "Prometheus metrics, and OpenTelemetry distributed tracing. "
                "Add a health-check endpoint and Grafana dashboard configuration."
            ),
            career_impact=(
                "Observability is the #1 skill gap for mid-to-senior engineers. "
                "Production-grade monitoring shows you can own services in production, "
                "which is a key differentiator in SRE and platform engineering roles."
            ),
            estimated_hours=12,
            companies_that_value=[
                "Datadog", "New Relic", "Grafana Labs", "Netflix", "Uber", "Shopify"
            ],
        ),
    ]

    return UpgradeResponse(project_title=title, upgrades=upgrades)
