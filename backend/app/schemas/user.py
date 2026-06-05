"""Pydantic v2 schemas for user profile and skills endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SkillItem(BaseModel):
    """A single skill entry for bulk upsert."""

    model_config = {
        "populate_by_name": True
    }

    skill_id: int = Field(..., gt=0)
    proficiency_level: str = Field(
        ...,
        validation_alias="proficiency",
        pattern="^(beginner|intermediate|advanced|expert)$",
        description="Must be beginner, intermediate, advanced, or expert",
    )
    years_experience: float = Field(default=0, ge=0)


class UpdateSkillsRequest(BaseModel):
    """Request body for bulk-upserting user skills."""

    skills: list[SkillItem] = Field(..., min_length=1, max_length=50)


class SkillResponse(BaseModel):
    """Response schema for a single skill."""

    model_config = {"from_attributes": True}

    id: int
    name: str
    category: Optional[str] = None
    description: Optional[str] = None


class UserSkillResponse(BaseModel):
    """Response schema for a user-skill association."""

    model_config = {"from_attributes": True}

    id: int
    skill_id: int
    proficiency_level: str
    years_experience: Optional[float] = None
    skill: Optional[SkillResponse] = None


class UserProfileResponse(BaseModel):
    """Response schema for the full user profile."""

    model_config = {"from_attributes": True}

    id: int
    email: str
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    profile: Optional[UserProfileDetail] = None
    skills: list[UserSkillResponse] = []


class UserProfileDetail(BaseModel):
    """Detail of the user profile sub-object."""

    model_config = {"from_attributes": True}

    id: int
    bio: Optional[str] = None
    current_role: Optional[str] = None
    years_of_experience: Optional[float] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class CVAnalysisResponse(BaseModel):
    """Response schema for CV Analysis."""
    ats_score: int
    target_role: str
    missing_keywords: list[str]
    formatting_issues: list[str]
    rejection_risks: list[str]
    actionable_recommendations: list[str]
    parsed_skills: list[str]
    parsed_education: list[str]
    parsed_experience: list[str]


# Rebuild models to resolve forward references
UserProfileResponse.model_rebuild()
