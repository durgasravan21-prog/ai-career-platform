"""Pydantic v2 schemas for mentor / session endpoints (Phase 3)."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class MentorAvailabilityResponse(BaseModel):
    """A single availability slot."""

    model_config = {"from_attributes": True}

    id: int
    day_of_week: int
    start_time: str
    end_time: str


class MentorResponse(BaseModel):
    """Public mentor profile information."""

    model_config = {"from_attributes": True}

    id: int
    user_id: int
    mentor_name: Optional[str] = None
    expertise: Optional[dict[str, Any]] = None
    hourly_rate: float
    bio: Optional[str] = None
    rating: float
    total_sessions: int
    is_active: bool
    availability: list[MentorAvailabilityResponse] = []


class MentorMatchRequest(BaseModel):
    """Request body for AI-powered mentor matching."""

    career_goal: Optional[str] = Field(None, max_length=500)
    preferred_expertise: list[str] = Field(default_factory=list)
    max_hourly_rate: Optional[float] = Field(None, ge=0)


class MentorMatchResponse(BaseModel):
    """A single mentor match result with score and reasoning."""

    mentor: MentorResponse
    match_score: float
    reasoning: str


class BookSessionRequest(BaseModel):
    """Request body to book a mentoring session."""

    mentor_id: int = Field(..., gt=0)
    scheduled_at: datetime
    duration_minutes: int = Field(default=60, ge=30, le=180)
    project_id: Optional[int] = None


class SessionResponse(BaseModel):
    """Response schema for a mentoring session."""

    model_config = {"from_attributes": True}

    id: int
    student_id: int
    mentor_id: int
    project_id: Optional[int] = None
    scheduled_at: datetime
    duration_minutes: int
    status: str
    amount_cents: int
    stripe_payment_intent_id: Optional[str] = None
    created_at: datetime
    mentor_name: Optional[str] = None


class ReviewRequest(BaseModel):
    """Request body to submit a session review."""

    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=2000)


class ReviewResponse(BaseModel):
    """Response schema for a review."""

    model_config = {"from_attributes": True}

    id: int
    session_id: int
    reviewer_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime
