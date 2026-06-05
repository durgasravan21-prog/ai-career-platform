"""Pydantic v2 schemas for career / roles / roadmap endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class RoleSkillResponse(BaseModel):
    """A skill required for a specific role."""

    model_config = {"from_attributes": True}

    id: int
    skill_id: int
    skill_name: Optional[str] = None
    proficiency_needed: str
    priority: int


class RoleResponse(BaseModel):
    """Summary of a career role."""

    model_config = {"from_attributes": True}

    id: int
    title: str
    description: Optional[str] = None
    seniority_level: Optional[str] = None
    avg_salary: Optional[float] = None


class RoleDetailResponse(BaseModel):
    """Full detail of a career role including required skills."""

    model_config = {"from_attributes": True}

    id: int
    title: str
    description: Optional[str] = None
    seniority_level: Optional[str] = None
    avg_salary: Optional[float] = None
    required_skills: list[RoleSkillResponse] = []


class RoadmapRequest(BaseModel):
    """Request body to generate a career roadmap."""

    target_role_id: int = Field(..., gt=0)


class SkillGapItem(BaseModel):
    """A single skill gap identified in the analysis."""

    skill_name: str
    current_level: Optional[str] = None
    required_level: str
    priority: int
    learning_suggestion: str


class SkillGapResult(BaseModel):
    """Complete result of a skill-gap analysis."""

    target_role: str
    current_match_percentage: float
    missing_skills: list[SkillGapItem]
    priority_order: list[str]
    suggested_projects: list[str]
    learning_suggestions: list[str]
    estimated_months: int


from app.schemas.user import SkillResponse, UserSkillResponse
from app.schemas.project import ProjectResponse

class LearningResourceSchema(BaseModel):
    """Schema for learning resources suggested in career path."""
    title: str
    url: str
    type: str  # e.g., "course", "tutorial", "book"
    estimated_hours: float
    provider: Optional[str] = None

class MissingSkillSchema(BaseModel):
    """Schema for a missing skill detail in skill gap."""
    skill: SkillResponse
    required_proficiency: str
    current_proficiency: Optional[str] = None
    priority: str  # "high", "medium", "low"
    learning_resources: list[LearningResourceSchema] = []

class SkillGapAnalysisSchema(BaseModel):
    """Detailed skill gap analysis schema."""
    target_role: RoleResponse
    current_skills: list[UserSkillResponse] = []
    missing_skills: list[MissingSkillSchema] = []
    completion_percent: float
    estimated_months: int

class LearningPathStepSchema(BaseModel):
    """A single step in the recommended learning roadmap."""
    order: int
    title: str
    description: str
    skills: list[SkillResponse] = []
    estimated_weeks: int
    resources: list[LearningResourceSchema] = []

class RoadmapResponse(BaseModel):
    """Full career roadmap response matching frontend expectations."""
    model_config = {"from_attributes": True}

    career_path_id: int
    status: str
    created_at: datetime
    skill_gap: SkillGapAnalysisSchema
    recommended_projects: list[ProjectResponse] = []
    learning_path: list[LearningPathStepSchema] = []

