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
    email: Optional[str] = None
    mobile_number: Optional[str] = None
    expertise: list[str] = Field(default_factory=list)
    hourly_rate: float
    bio: Optional[str] = None
    rating: float
    total_sessions: int
    is_active: bool
    video_calls_active: bool = True
    availability: list[MentorAvailabilityResponse] = []
    
    # Verification and Agreement fields
    company_name: Optional[str] = None
    verification_status: str = "pending"
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    corporate_email: Optional[str] = None
    corporate_email_verified: bool = False
    signed_agreement: bool = False
    verified_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    selfie_url: Optional[str] = None
    identity_document_url: Optional[str] = None
    reviewed_count: int = 0
    review_earnings: float = 0.0
    original_price: Optional[float] = None
    price_edited_by_admin: bool = False
    has_premium_subscription: bool = False


class ApplyMentorRequest(BaseModel):
    """Payload to apply as a new professional mentor."""

    bio: str
    hourly_rate: float = Field(..., ge=0)
    expertise: list[str]
    linkedin_url: str
    github_url: Optional[str] = None
    corporate_email: Optional[str] = None
    company_name: Optional[str] = None
    selfie_base64: Optional[str] = None  # Base64 string of captured webcam selfie
    identity_document_base64: Optional[str] = None  # Base64 string of passport/ID card
    id_type: Optional[str] = None  # Government ID Type: passport, driver_license, national_id, aadhaar, state_id
    selfie_filename: Optional[str] = None
    id_filename: Optional[str] = None
    signed_agreement: bool
    signature_svg_or_text: Optional[str] = None
    availability: list[dict] = []  # list of {"day_of_week": int, "start_time": str, "end_time": str}


class VerifyCorporateRequest(BaseModel):
    """Payload to verify corporate email OTP token."""

    email: str
    token: str


class AdminApproveRequest(BaseModel):
    """Payload for admin to verify or reject a mentor."""

    status: str  # "verified" or "rejected" or "suspended"



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
    student_name: Optional[str] = None
    is_reviewed: bool = False


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


class ReportMentorRequest(BaseModel):
    """Request schema for submitting a mentor report."""

    reason: str = Field(..., min_length=5, max_length=2000)
    screenshot_base64: str


class ReportStudentRequest(BaseModel):
    """Request schema for submitting a student report by a mentor."""

    reason: str = Field(..., min_length=5, max_length=2000)
    screenshot_base64: str


class MentorReportResponse(BaseModel):
    """Response schema for a mentor report."""

    model_config = {"from_attributes": True}

    id: int
    mentor_id: int
    student_id: int
    reason: str
    status: str
    reported_by: str = "student"
    screenshot_url: Optional[str] = None
    created_at: datetime
    mentor_name: Optional[str] = None
    student_name: Optional[str] = None


class VerifyDocumentsRequest(BaseModel):
    """Payload to perform AI document & biometric face verification."""

    selfie_base64: str
    identity_document_base64: str
    id_type: str
    selfie_filename: Optional[str] = None
    id_filename: Optional[str] = None


