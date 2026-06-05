"""Pydantic v2 schemas for project endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ProjectSkillResponse(BaseModel):
    """A skill associated with a project."""

    model_config = {"from_attributes": True}

    id: int
    skill_id: int
    skill_name: Optional[str] = None
    is_primary: bool


class ProjectResponse(BaseModel):
    """Summary of a project."""

    model_config = {"from_attributes": True}

    id: int
    title: str
    description: Optional[str] = None
    difficulty: str
    tech_stack: Optional[dict[str, Any]] = None
    estimated_hours: Optional[int] = None
    career_relevance_score: Optional[float] = None
    github_url: Optional[str] = None
    created_at: datetime
    skills: list[ProjectSkillResponse] = []


class ProjectListResponse(BaseModel):
    """Paginated list of projects."""

    projects: list[ProjectResponse]
    total: int


class SubmitProjectRequest(BaseModel):
    """Request body to submit a completed project."""

    project_id: int = Field(..., gt=0)
    github_url: str = Field(..., min_length=10, max_length=500)
    portfolio_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)


class AnalyzeGithubRequest(BaseModel):
    """Request body to analyze a GitHub repository."""

    github_url: str = Field(..., min_length=10, max_length=500)
    project_id: Optional[int] = None


class UpgradeSuggestionSchema(BaseModel):
    """Schema for individual upgrade suggestions in project analysis."""
    feature_name: str
    description: str
    career_impact_score: int
    estimated_hours: int
    companies_that_value: list[str]
    difficulty: str


class ProjectAnalysisResponse(BaseModel):
    """AI analysis results for a submitted project, matching frontend ProjectAnalysis."""
    id: int = 1
    project_id: int
    github_url: str
    problem_clarity: int = Field(..., ge=1, le=10)
    technical_complexity: int = Field(..., ge=1, le=10)
    career_relevance: int = Field(..., ge=1, le=100)
    missing_improvements: list[str]
    portfolio_grade: str = Field(..., pattern="^[A-DF]$")
    upgrade_suggestions: list[UpgradeSuggestionSchema] = []
    reasoning: str
    analyzed_at: datetime



class UpgradeItem(BaseModel):
    """A single upgrade suggestion for a project."""

    feature: str
    description: str
    career_impact: str
    estimated_hours: int
    companies_that_value: list[str]


class UpgradeResponse(BaseModel):
    """Response with project upgrade suggestions."""

    project_title: str
    upgrades: list[UpgradeItem]


class ProjectRecommendationResponse(BaseModel):
    """A project recommendation for the current user."""

    project: ProjectResponse
    relevance_score: float
    reason: str
