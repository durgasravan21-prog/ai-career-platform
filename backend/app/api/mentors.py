"""Mentor and session API routes (Phase 3)."""

from __future__ import annotations

import base64
import logging
from datetime import datetime, time, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.mentor_matching import match_mentors
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.mentor import (
    MentorAvailability,
    MentorProfile,
    MentorSession,
    Review,
    SessionStatus,
    MentorReport,
)
from app.models.user import User, UserSkill
from app.schemas.mentor import (
    AdminApproveRequest,
    ApplyMentorRequest,
    BookSessionRequest,
    MentorAvailabilityResponse,
    MentorMatchRequest,
    MentorMatchResponse,
    MentorResponse,
    ReviewRequest,
    ReviewResponse,
    SessionResponse,
    VerifyCorporateRequest,
    ReportMentorRequest,
    MentorReportResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Mentors & Sessions"])


def save_base64_file(base64_str: str, file_prefix: str, user_id: int) -> str:
    """Saves a base64-encoded string to a local uploads directory."""
    if not base64_str:
        return ""
    try:
        header = "data:image/jpeg;base64"
        if "," in base64_str:
            header, base64_str = base64_str.split(",", 1)
        
        file_data = base64.b64decode(base64_str)
        
        ext = ".jpg"
        if "pdf" in header.lower():
            ext = ".pdf"
        elif "png" in header.lower():
            ext = ".png"
        elif "jpeg" in header.lower():
            ext = ".jpeg"
            
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        
        filename = f"{file_prefix}_{user_id}_{int(datetime.now(timezone.utc).timestamp())}{ext}"
        filepath = upload_dir / filename
        
        with open(filepath, "wb") as f:
            f.write(file_data)
            
        return f"/uploads/{filename}"
    except Exception as e:
        logger.error(f"Error saving base64 file: {e}")
        return ""


def _mentor_to_response(mentor: MentorProfile, reviewed_count: int = 0) -> MentorResponse:
    """Convert a MentorProfile ORM object to a MentorResponse schema."""
    exp_list = []
    if isinstance(mentor.expertise, dict):
        exp_list = mentor.expertise.get("areas", [])
    elif isinstance(mentor.expertise, list):
        exp_list = mentor.expertise

    email = mentor.user.email if mentor.user else None
    mobile_number = None
    if mentor.user and mentor.user.profile:
        mobile_number = mentor.user.profile.mobile_number

    return MentorResponse(
        id=mentor.id,
        user_id=mentor.user_id,
        mentor_name=mentor.user.name if mentor.user else None,
        email=email,
        mobile_number=mobile_number,
        expertise=exp_list,
        hourly_rate=mentor.hourly_rate,
        bio=mentor.bio,
        rating=mentor.rating,
        total_sessions=mentor.total_sessions,
        is_active=mentor.is_active,
        availability=[
            MentorAvailabilityResponse(
                id=a.id,
                day_of_week=a.day_of_week,
                start_time=a.start_time.isoformat() if a.start_time else "",
                end_time=a.end_time.isoformat() if a.end_time else "",
            )
            for a in mentor.availability
        ],
        company_name=mentor.company_name,
        verification_status=mentor.verification_status,
        linkedin_url=mentor.linkedin_url,
        github_url=mentor.github_url,
        corporate_email=mentor.corporate_email,
        corporate_email_verified=mentor.corporate_email_verified,
        signed_agreement=mentor.signed_agreement,
        verified_at=mentor.verified_at,
        reviewed_count=reviewed_count,
        rejected_at=mentor.rejected_at,
        selfie_url=mentor.selfie_url,
        identity_document_url=mentor.identity_document_url,
    )


@router.get(
    "/mentors",
    response_model=list[MentorResponse],
    summary="List mentors with filters",
)
async def list_mentors(
    expertise: Optional[str] = Query(None, max_length=100),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    max_price: Optional[float] = Query(None, ge=0),
    db: AsyncSession = Depends(get_db),
) -> list[MentorResponse]:
    """Return active mentors, optionally filtered by expertise, rating, and price."""
    query = select(MentorProfile).where(
        MentorProfile.is_active.is_(True),
        MentorProfile.verification_status == "verified"
    )

    result = await db.execute(query)
    mentors = result.scalars().all()

    # Apply post-query filters (JSON expertise filtering needs Python-side logic)
    filtered: list[MentorProfile] = []
    for mentor in mentors:
        if min_rating is not None and mentor.rating < min_rating:
            continue
        if max_price is not None and mentor.hourly_rate > max_price:
            continue
        if expertise is not None:
            expertise_list = mentor.expertise or {}
            areas = expertise_list.get("areas", []) if isinstance(expertise_list, dict) else []
            if not any(expertise.lower() in a.lower() for a in areas):
                continue
        filtered.append(mentor)

    return [_mentor_to_response(m) for m in filtered]


@router.post(
    "/mentors/match",
    response_model=list[MentorMatchResponse],
    summary="AI-powered mentor matching",
)
async def match_mentor(
    body: MentorMatchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MentorMatchResponse]:
    """Find the best mentors for the current user based on skills and career goals."""
    # Get user skills
    result = await db.execute(
        select(UserSkill).where(UserSkill.user_id == current_user.id)
    )
    user_skills = result.scalars().all()
    student_skills = [
        {
            "skill_name": us.skill.name if us.skill else f"skill_{us.skill_id}",
            "proficiency_level": us.proficiency_level.value if hasattr(us.proficiency_level, "value") else us.proficiency_level,
        }
        for us in user_skills
    ]

    # Get available mentors
    query = select(MentorProfile).where(
        MentorProfile.is_active.is_(True),
        MentorProfile.verification_status == "verified"
    )
    if body.max_hourly_rate is not None:
        query = query.where(MentorProfile.hourly_rate <= body.max_hourly_rate)

    result = await db.execute(query)
    mentors = result.scalars().all()

    if not mentors:
        return []

    # Prepare mentor data for AI engine
    mentor_data = [
        {
            "id": m.id,
            "name": m.user.name if m.user else "Mentor",
            "expertise": (m.expertise or {}).get("areas", []) if isinstance(m.expertise, dict) else [],
            "rating": m.rating,
            "hourly_rate": m.hourly_rate,
        }
        for m in mentors
    ]

    # Run AI matching
    matches = await match_mentors(
        student_skills=student_skills,
        career_goal=body.career_goal,
        available_mentors=mentor_data,
    )

    # Build response
    mentor_lookup = {m.id: m for m in mentors}
    responses: list[MentorMatchResponse] = []
    for match in matches:
        mentor = mentor_lookup.get(match["mentor_id"])
        if mentor:
            responses.append(
                MentorMatchResponse(
                    mentor=_mentor_to_response(mentor),
                    match_score=match["match_score"],
                    reasoning=match["reasoning"],
                )
            )

    return responses


@router.post(
    "/mentors/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Book a mentoring session",
)
async def book_session(
    body: BookSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Book a mentoring session with a specific mentor."""
    # Verify mentor exists and is active
    result = await db.execute(
        select(MentorProfile).where(MentorProfile.id == body.mentor_id)
    )
    mentor = result.scalar_one_or_none()
    if mentor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mentor with id {body.mentor_id} not found",
        )
    if not mentor.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This mentor is currently not accepting sessions",
        )

    # Cannot book session with yourself
    if mentor.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot book a session with yourself",
        )

    # Calculate amount (includes 10% commission markup)
    hours = body.duration_minutes / 60.0
    amount_cents = int(mentor.hourly_rate * 1.1 * hours * 100)

    session_status = SessionStatus.confirmed if mentor.hourly_rate == 0 else SessionStatus.pending

    session = MentorSession(
        student_id=current_user.id,
        mentor_id=mentor.id,
        project_id=body.project_id,
        scheduled_at=body.scheduled_at,
        duration_minutes=body.duration_minutes,
        status=session_status,
        amount_cents=amount_cents,
    )
    db.add(session)
    await db.flush()

    return SessionResponse(
        id=session.id,
        student_id=session.student_id,
        mentor_id=session.mentor_id,
        project_id=session.project_id,
        scheduled_at=session.scheduled_at,
        duration_minutes=session.duration_minutes,
        status=session.status.value if hasattr(session.status, "value") else session.status,
        amount_cents=session.amount_cents,
        stripe_payment_intent_id=session.stripe_payment_intent_id,
        created_at=session.created_at,
        mentor_name=mentor.user.name if mentor.user else None,
    )


# Schema for frontend review submissions
from pydantic import BaseModel
class FrontendReviewRequest(BaseModel):
    session_id: int
    rating: int
    comment: str


@router.post(
    "/mentors/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a session review",
)
async def submit_review(
    body: FrontendReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewResponse:
    """Submit a review for a completed mentoring session."""
    # Verify session exists
    result = await db.execute(
        select(MentorSession).where(MentorSession.id == body.session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with id {body.session_id} not found",
        )

    # Only the student can review
    if session.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the student can review this session",
        )

    # Check for existing review
    result = await db.execute(
        select(Review).where(
            Review.session_id == body.session_id,
            Review.reviewer_id == current_user.id,
        )
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this session",
        )

    review = Review(
        session_id=body.session_id,
        reviewer_id=current_user.id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)
    
    # Mark session completed upon receiving review as shortcut
    session.status = SessionStatus.completed
    await db.flush()

    # Update mentor rating
    mentor = session.mentor
    if mentor:
        total = mentor.total_sessions + 1
        mentor.rating = round(
            (mentor.rating * mentor.total_sessions + body.rating) / total, 2
        )
        mentor.total_sessions = total
        await db.flush()

    return ReviewResponse(
        id=review.id,
        session_id=review.session_id,
        reviewer_id=review.reviewer_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
    )


@router.get(
    "/mentors/sessions/me",
    response_model=list[SessionResponse],
    summary="Get user's sessions",
)
async def get_my_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SessionResponse]:
    """Return all mentoring sessions for the current user (as student or mentor)."""
    # Sessions as student
    result = await db.execute(
        select(MentorSession).where(MentorSession.student_id == current_user.id)
    )
    sessions = list(result.scalars().all())

    # Also sessions where user is mentor
    result = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    mentor_profile = result.scalar_one_or_none()
    if mentor_profile:
        result = await db.execute(
            select(MentorSession).where(MentorSession.mentor_id == mentor_profile.id)
        )
        mentor_sessions = result.scalars().all()
        existing_ids = {s.id for s in sessions}
        for ms in mentor_sessions:
            if ms.id not in existing_ids:
                sessions.append(ms)

    return [
        SessionResponse(
            id=s.id,
            student_id=s.student_id,
            mentor_id=s.mentor_id,
            project_id=s.project_id,
            scheduled_at=s.scheduled_at,
            duration_minutes=s.duration_minutes,
            status=s.status.value if hasattr(s.status, "value") else s.status,
            amount_cents=s.amount_cents,
            stripe_payment_intent_id=s.stripe_payment_intent_id,
            created_at=s.created_at,
            mentor_name=s.mentor.user.name if s.mentor and s.mentor.user else None,
        )
        for s in sessions
    ]


# ─── Verification & Onboarding API Endpoints ───────────────────────

@router.post(
    "/mentors/apply",
    response_model=MentorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Apply as a professional mentor",
)
async def apply_as_mentor(
    body: ApplyMentorRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MentorResponse:
    # Save files if present
    selfie_url = save_base64_file(body.selfie_base64, "selfie", current_user.id) if body.selfie_base64 else None
    id_doc_url = save_base64_file(body.identity_document_base64, "id_doc", current_user.id) if body.identity_document_base64 else None

    # Check if they already have a mentor profile
    result = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    mentor = result.scalar_one_or_none()

    # Enforce 60-day (2-month) cooldown on rejected applications
    if mentor is not None and mentor.verification_status == "rejected" and mentor.rejected_at is not None:
        rej_at = mentor.rejected_at
        if rej_at.tzinfo is None:
            rej_at = rej_at.replace(tzinfo=timezone.utc)
        delta = datetime.now(timezone.utc) - rej_at
        days_passed = delta.days
        if days_passed < 60:
            remaining_days = 60 - days_passed
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cooldown active. You can re-apply in {remaining_days} days.",
            )

    # Expertise needs to be stored as {"areas": [...]}
    expertise_dict = {"areas": body.expertise}

    if mentor is None:
        mentor = MentorProfile(
            user_id=current_user.id,
            bio=body.bio,
            hourly_rate=body.hourly_rate,
            expertise=expertise_dict,
            verification_status="pending",
            linkedin_url=body.linkedin_url,
            github_url=body.github_url,
            corporate_email=body.corporate_email,
            company_name=body.company_name,
            corporate_email_verified=False,
            selfie_url=selfie_url,
            identity_document_url=id_doc_url,
            signed_agreement=body.signed_agreement,
            signature_svg_or_text=body.signature_svg_or_text,
            is_active=False,  # inactive until approved
        )
        db.add(mentor)
    else:
        mentor.bio = body.bio
        mentor.hourly_rate = body.hourly_rate
        mentor.expertise = expertise_dict
        mentor.verification_status = "pending"
        mentor.rejected_at = None
        mentor.linkedin_url = body.linkedin_url
        mentor.github_url = body.github_url
        mentor.corporate_email = body.corporate_email
        if body.company_name:
            mentor.company_name = body.company_name
        mentor.corporate_email_verified = False
        if selfie_url:
            mentor.selfie_url = selfie_url
        if id_doc_url:
            mentor.identity_document_url = id_doc_url
        mentor.signed_agreement = body.signed_agreement
        mentor.signature_svg_or_text = body.signature_svg_or_text
        mentor.is_active = False

    await db.flush()

    # Update availability
    from sqlalchemy import delete
    await db.execute(
        delete(MentorAvailability).where(MentorAvailability.mentor_id == mentor.id)
    )
    for slot in body.availability:
        try:
            start_t = time.fromisoformat(slot["start_time"])
            end_t = time.fromisoformat(slot["end_time"])
            avail = MentorAvailability(
                mentor_id=mentor.id,
                day_of_week=slot["day_of_week"],
                start_time=start_t,
                end_time=end_t,
            )
            db.add(avail)
        except Exception as e:
            logger.error(f"Error parsing availability slot {slot}: {e}")

    await db.flush()

    # Generate a dummy verification token for corporate email if present
    if body.corporate_email:
        dummy_token = f"VERIFY_{current_user.id}_99"
        logger.info(f"Generated corporate email token for {body.corporate_email}: {dummy_token}")
        print(f"\n[EMAIL SIMULATION] Sent corporate email to {body.corporate_email} with token: {dummy_token}\n")

    # Refresh relationship
    await db.refresh(mentor)
    return _mentor_to_response(mentor)


@router.get(
    "/mentors/application-status",
    response_model=MentorResponse,
    summary="Get user's mentor application status",
)
async def get_application_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MentorResponse:
    result = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    mentor = result.scalar_one_or_none()
    if mentor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No mentor profile found for this user.",
        )
    
    from app.models.project import UserProject, UserProjectStatus
    result_count = await db.execute(
        select(UserProject).where(
            UserProject.reviewer_mentor_id == mentor.id,
            UserProject.status == UserProjectStatus.reviewed
        )
    )
    reviewed_count = len(result_count.scalars().all())
    return _mentor_to_response(mentor, reviewed_count=reviewed_count)


@router.post(
    "/mentors/verify-corporate",
    summary="Verify corporate email with token",
)
async def verify_corporate(
    body: VerifyCorporateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    mentor = result.scalar_one_or_none()
    if mentor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No mentor profile found.",
        )
    
    expected_token = f"VERIFY_{current_user.id}_99"
    if body.token != expected_token or body.email != mentor.corporate_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid corporate email or verification token.",
        )
        
    mentor.corporate_email_verified = True
    await db.flush()
    return {"message": "Corporate email verified successfully."}


@router.post(
    "/mentors/{mentor_id}/admin-approve",
    response_model=MentorResponse,
    summary="Admin approve or reject a mentor application",
)
async def admin_approve_mentor(
    mentor_id: int,
    body: AdminApproveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MentorResponse:
    if current_user.email != "durgasravan21@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the platform admin can approve or reject mentor applications.",
        )

    result = await db.execute(
        select(MentorProfile).where(MentorProfile.id == mentor_id)
    )
    mentor = result.scalar_one_or_none()
    if mentor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mentor profile with id {mentor_id} not found",
        )
        
    mentor.verification_status = body.status
    if body.status == "verified":
        mentor.is_active = True
        mentor.verified_at = datetime.now(timezone.utc)
        mentor.rejected_at = None
    elif body.status == "rejected":
        mentor.is_active = False
        mentor.rejected_at = datetime.now(timezone.utc)
    else:  # e.g., "suspended" or other status
        mentor.is_active = False
        
    await db.flush()
    return _mentor_to_response(mentor)


@router.get(
    "/admin/mentors/pending",
    response_model=list[MentorResponse],
    summary="List pending mentors for admin review",
)
async def list_pending_mentors(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MentorResponse]:
    """Return all pending mentors for admin review. Only accessible by durgasravan21@gmail.com."""
    if current_user.email != "durgasravan21@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the platform admin can view pending applications.",
        )
    query = select(MentorProfile).where(
        MentorProfile.verification_status == "pending"
    )
    result = await db.execute(query)
    mentors = result.scalars().all()
    return [_mentor_to_response(m) for m in mentors]


class UpdateSessionStatusRequest(BaseModel):
    status: str  # "confirmed", "completed", "cancelled"


@router.post(
    "/mentors/sessions/{session_id}/status",
    response_model=SessionResponse,
    summary="Update session status (mentor action)",
)
async def update_session_status(
    session_id: int,
    body: UpdateSessionStatusRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Update session status (confirm, complete, cancel). Accessible by the mentor or student involved."""
    result = await db.execute(
        select(MentorSession).where(MentorSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with id {session_id} not found",
        )

    # Verify user is either student or mentor for this session
    result_m = await db.execute(
        select(MentorProfile).where(MentorProfile.id == session.mentor_id)
    )
    mentor = result_m.scalar_one_or_none()
    
    is_mentor_user = mentor and mentor.user_id == current_user.id
    is_student_user = session.student_id == current_user.id

    if not is_mentor_user and not is_student_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to manage this session.",
        )

    # Validate status transition
    new_status = body.status.lower()
    if new_status not in ["confirmed", "completed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid session status: {body.status}",
        )

    session.status = SessionStatus(new_status)
    await db.flush()

    return SessionResponse(
        id=session.id,
        student_id=session.student_id,
        mentor_id=session.mentor_id,
        project_id=session.project_id,
        scheduled_at=session.scheduled_at,
        duration_minutes=session.duration_minutes,
        status=session.status.value if hasattr(session.status, "value") else session.status,
        amount_cents=session.amount_cents,
        stripe_payment_intent_id=session.stripe_payment_intent_id,
        created_at=session.created_at,
        mentor_name=mentor.user.name if mentor and mentor.user else None,
    )


@router.post(
    "/mentors/{mentor_id}/report",
    response_model=MentorReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Report a mentor",
)
async def report_mentor(
    mentor_id: int,
    body: ReportMentorRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MentorReportResponse:
    # Check if mentor exists
    result = await db.execute(
        select(MentorProfile).where(MentorProfile.id == mentor_id)
    )
    mentor = result.scalar_one_or_none()
    if mentor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mentor profile with id {mentor_id} not found",
        )

    # Cannot report yourself
    if mentor.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot report yourself",
        )

    report = MentorReport(
        mentor_id=mentor_id,
        student_id=current_user.id,
        reason=body.reason,
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)

    return MentorReportResponse(
        id=report.id,
        mentor_id=report.mentor_id,
        student_id=report.student_id,
        reason=report.reason,
        status=report.status,
        created_at=report.created_at,
        mentor_name=mentor.user.name if mentor.user else "Mentor",
        student_name=current_user.name,
    )


@router.get(
    "/admin/reports",
    response_model=list[MentorReportResponse],
    summary="Get all mentor reports for admin review",
)
async def get_admin_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MentorReportResponse]:
    if current_user.email != "durgasravan21@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the platform admin can view mentor reports.",
        )

    result = await db.execute(
        select(MentorReport).order_by(MentorReport.created_at.desc())
    )
    reports = result.scalars().all()

    responses = []
    for r in reports:
        mentor_name = "Mentor"
        if r.mentor and r.mentor.user:
            mentor_name = r.mentor.user.name
        student_name = "Student"
        if r.student:
            student_name = r.student.name

        responses.append(
            MentorReportResponse(
                id=r.id,
                mentor_id=r.mentor_id,
                student_id=r.student_id,
                reason=r.reason,
                status=r.status,
                created_at=r.created_at,
                mentor_name=mentor_name,
                student_name=student_name,
            )
        )
    return responses


@router.post(
    "/admin/reports/{report_id}/resolve",
    response_model=MentorReportResponse,
    summary="Resolve a mentor report",
)
async def resolve_mentor_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MentorReportResponse:
    if current_user.email != "durgasravan21@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the platform admin can resolve mentor reports.",
        )

    result = await db.execute(
        select(MentorReport).where(MentorReport.id == report_id)
    )
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mentor report with id {report_id} not found",
        )

    report.status = "resolved"
    await db.flush()

    mentor_name = "Mentor"
    if report.mentor and report.mentor.user:
        mentor_name = report.mentor.user.name
    student_name = "Student"
    if report.student:
        student_name = report.student.name

    return MentorReportResponse(
        id=report.id,
        mentor_id=report.mentor_id,
        student_id=report.student_id,
        reason=report.reason,
        status=report.status,
        created_at=report.created_at,
        mentor_name=mentor_name,
        student_name=student_name,
    )




