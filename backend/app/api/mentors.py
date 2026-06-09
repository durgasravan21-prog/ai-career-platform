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
from app.ai.document_verifier import verify_documents_and_matching_ai
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
    ReportStudentRequest,
    MentorReportResponse,
    VerifyDocumentsRequest,
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
            
        import os
        is_vercel = os.environ.get("VERCEL") == "1" or os.environ.get("VERCEL_ENV")
        upload_dir = Path("/tmp/uploads") if is_vercel else Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        
        filename = f"{file_prefix}_{user_id}_{int(datetime.now(timezone.utc).timestamp())}{ext}"
        filepath = upload_dir / filename
        
        with open(filepath, "wb") as f:
            f.write(file_data)
            
        return f"/uploads/{filename}"
    except Exception as e:
        logger.error(f"Error saving base64 file: {e}")
        return ""


async def _get_mentor_review_stats(db: AsyncSession, mentor_id: int) -> tuple[int, float]:
    """Calculate the reviewed count and review earnings dynamically for a mentor."""
    from app.models.project import UserProject, UserProjectStatus
    result = await db.execute(
        select(UserProject).where(
            UserProject.reviewer_mentor_id == mentor_id,
            UserProject.status == UserProjectStatus.reviewed
        )
    )
    reviewed_projects = result.scalars().all()
    reviewed_count = len(reviewed_projects)
    review_earnings = 0.0
    for up in reviewed_projects:
        if up.project:
            difficulty = up.project.difficulty.value if hasattr(up.project.difficulty, "value") else up.project.difficulty
            if difficulty == "beginner":
                review_earnings += 0.50
            elif difficulty == "intermediate":
                review_earnings += 0.75
            elif difficulty == "advanced":
                review_earnings += 1.00
            else:
                review_earnings += 0.50
    return reviewed_count, review_earnings


def _mentor_to_response(mentor: MentorProfile, reviewed_count: int = 0, review_earnings: float = 0.0) -> MentorResponse:
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
        video_calls_active=mentor.video_calls_active,
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
        review_earnings=review_earnings,
        rejected_at=mentor.rejected_at,
        selfie_url=mentor.selfie_url,
        identity_document_url=mentor.identity_document_url,
        original_price=mentor.original_price,
        price_edited_by_admin=mentor.price_edited_by_admin,
        has_premium_subscription=mentor.has_premium_subscription,
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

    res = []
    for m in filtered:
        rev_count, rev_earnings = await _get_mentor_review_stats(db, m.id)
        res.append(_mentor_to_response(m, reviewed_count=rev_count, review_earnings=rev_earnings))
    return res


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
            rev_count, rev_earnings = await _get_mentor_review_stats(db, mentor.id)
            responses.append(
                MentorMatchResponse(
                    mentor=_mentor_to_response(mentor, reviewed_count=rev_count, review_earnings=rev_earnings),
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
    if not mentor.video_calls_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This mentor has disabled video calls and is not accepting bookings.",
        )

    # Cannot book session with yourself
    if mentor.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot book a session with yourself",
        )

    # Check if student has any unreviewed completed sessions
    sessions_result = await db.execute(
        select(MentorSession).where(
            MentorSession.student_id == current_user.id,
            MentorSession.status == SessionStatus.completed
        )
    )
    completed_sessions = sessions_result.scalars().all()
    for s in completed_sessions:
        if not s.reviews:
            # Get mentor name explicitly to avoid lazy-loading issues
            mentor_res = await db.execute(
                select(MentorProfile).where(MentorProfile.id == s.mentor_id)
            )
            mentor_prof = mentor_res.scalar_one_or_none()
            mentor_name = "Coach"
            if mentor_prof:
                user_res = await db.execute(
                    select(User).where(User.id == mentor_prof.user_id)
                )
                mentor_user = user_res.scalar_one_or_none()
                if mentor_user:
                    mentor_name = mentor_user.name or "Coach"
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mandatory Feedback Required: You must submit a review for your completed session with Coach {mentor_name} before booking a new session."
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
        is_reviewed=False,
        reminder_sent=session.reminder_sent if hasattr(session, "reminder_sent") else False,
        reminder_sent_at=session.reminder_sent_at if hasattr(session, "reminder_sent_at") else None,
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
    if current_user.email.lower() in ("durgasravan21@gmail.com", "challagollasridevi@gmail.com"):
        result = await db.execute(select(MentorSession))
        sessions = list(result.scalars().all())
    else:
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

    # Auto-expire sessions that are confirmed/pending and started more than 1 hour ago (duration)
    from datetime import timedelta, timezone
    now = datetime.now(timezone.utc)
    modified = False
    for s in sessions:
        if s.status in [SessionStatus.pending, SessionStatus.confirmed]:
            sched = s.scheduled_at
            if sched.tzinfo is None:
                sched = sched.replace(tzinfo=timezone.utc)
            duration = s.duration_minutes or 60
            if now > sched + timedelta(minutes=duration):
                s.status = SessionStatus.completed
                modified = True
    if modified:
        await db.commit()

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
            student_name=s.student.name if s.student else None,
            is_reviewed=len(s.reviews) > 0 if s.reviews else False,
            reminder_sent=s.reminder_sent if hasattr(s, "reminder_sent") else False,
            reminder_sent_at=s.reminder_sent_at if hasattr(s, "reminder_sent_at") else None,
        )
        for s in sessions
    ]


@router.post(
    "/mentors/toggle-video-calls",
    response_model=MentorResponse,
    summary="Toggle video calls active status for a coach",
)
async def toggle_video_calls(
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
            detail="Mentor profile not found.",
        )

    mentor.video_calls_active = not mentor.video_calls_active
    await db.commit()
    await db.refresh(mentor)
    reviewed_count, review_earnings = await _get_mentor_review_stats(db, mentor.id)
    return _mentor_to_response(mentor, reviewed_count=reviewed_count, review_earnings=review_earnings)


# ─── Verification & Onboarding API Endpoints ───────────────────────

@router.post(
    "/mentors/verify-documents",
    summary="Real-time AI verification of government ID and webcam selfie",
)
async def verify_documents_api(
    body: VerifyDocumentsRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Run real-time AI verification on the uploaded selfie and government ID."""
    return await verify_documents_and_matching_ai(
        body.selfie_base64,
        body.identity_document_base64,
        body.id_type,
        body.selfie_filename,
        body.id_filename
    )


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

    # Determine if we need to run AI verification
    # If the mentor profile is already verified and the user is NOT providing new base64 files,
    # we can skip the biometric AI verification step.
    ai_result = None
    if mentor is None or mentor.verification_status != "verified" or (body.selfie_base64 and body.identity_document_base64):
        if not body.selfie_base64 or not body.identity_document_base64:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Identity verification failed: Webcam selfie and government ID document are required.",
            )
        if not body.id_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Identity verification failed: Government ID type must be selected.",
            )
        ai_result = await verify_documents_and_matching_ai(
            body.selfie_base64, body.identity_document_base64, body.id_type,
            body.selfie_filename, body.id_filename
        )
    else:
        # Re-use existing AI verification details if they exist
        if mentor.expertise and isinstance(mentor.expertise, dict):
            ai_result = mentor.expertise.get("ai_verification")

    # Save files if present
    selfie_url = save_base64_file(body.selfie_base64, "selfie", current_user.id) if body.selfie_base64 else (mentor.selfie_url if mentor else None)
    id_doc_url = save_base64_file(body.identity_document_base64, "id_doc", current_user.id) if body.identity_document_base64 else (mentor.identity_document_url if mentor else None)

    # Expertise needs to be stored as {"areas": [...]}
    expertise_dict = {
        "areas": body.expertise,
        "id_type": body.id_type or (mentor.expertise.get("id_type") if mentor and mentor.expertise else None),
        "ai_verification": ai_result
    }

    if mentor is None:
        verification_status = "verified" if current_user.email.lower() in ("durgasravan21@gmail.com", "challagollasridevi@gmail.com") else "pending"
        is_active = True if current_user.email.lower() in ("durgasravan21@gmail.com", "challagollasridevi@gmail.com") else False
        mentor = MentorProfile(
            user_id=current_user.id,
            bio=body.bio,
            hourly_rate=body.hourly_rate,
            expertise=expertise_dict,
            verification_status=verification_status,
            linkedin_url=body.linkedin_url,
            github_url=body.github_url,
            corporate_email=body.corporate_email,
            company_name=body.company_name,
            corporate_email_verified=True if current_user.email.lower() in ("durgasravan21@gmail.com", "challagollasridevi@gmail.com") else False,
            selfie_url=selfie_url,
            identity_document_url=id_doc_url,
            signed_agreement=body.signed_agreement,
            signature_svg_or_text=body.signature_svg_or_text,
            is_active=is_active,
        )
        db.add(mentor)
    else:
        mentor.bio = body.bio
        mentor.hourly_rate = body.hourly_rate
        mentor.expertise = expertise_dict
        
        # Preserve verification status if already verified, otherwise reset to pending
        if current_user.email.lower() in ("durgasravan21@gmail.com", "challagollasridevi@gmail.com"):
            mentor.verification_status = "verified"
            mentor.is_active = True
        elif mentor.verification_status != "verified":
            mentor.verification_status = "pending"
            mentor.is_active = False
            
        mentor.rejected_at = None
        mentor.linkedin_url = body.linkedin_url
        mentor.github_url = body.github_url
        
        # Reset corporate email verification only if corporate email is updated
        if mentor.corporate_email != body.corporate_email:
            mentor.corporate_email = body.corporate_email
            mentor.corporate_email_verified = False
            
        if body.company_name:
            mentor.company_name = body.company_name
            
        if selfie_url:
            mentor.selfie_url = selfie_url
        if id_doc_url:
            mentor.identity_document_url = id_doc_url
            
        mentor.signed_agreement = body.signed_agreement
        if body.signature_svg_or_text:
            mentor.signature_svg_or_text = body.signature_svg_or_text

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
    
    reviewed_count, review_earnings = await _get_mentor_review_stats(db, mentor.id)
    return _mentor_to_response(mentor, reviewed_count=reviewed_count, review_earnings=review_earnings)


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
    if body.token != expected_token or body.email.lower() != (mentor.corporate_email or "").lower():
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
    if current_user.email.lower() not in ("durgasravan21@gmail.com", "challagollasridevi@gmail.com"):
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
    reviewed_count, review_earnings = await _get_mentor_review_stats(db, mentor.id)
    return _mentor_to_response(mentor, reviewed_count=reviewed_count, review_earnings=review_earnings)


@router.get(
    "/admin/mentors/pending",
    response_model=list[MentorResponse],
    summary="List pending mentors for admin review",
)
async def list_pending_mentors(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MentorResponse]:
    """Return all pending mentors for admin review. Only accessible by admins."""
    if current_user.email.lower() not in ("durgasravan21@gmail.com", "challagollasridevi@gmail.com"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the platform admin can view pending applications.",
        )
    query = select(MentorProfile).where(
        MentorProfile.verification_status == "pending"
    )
    result = await db.execute(query)
    mentors = result.scalars().all()
    res = []
    for m in mentors:
        rev_count, rev_earnings = await _get_mentor_review_stats(db, m.id)
        res.append(_mentor_to_response(m, reviewed_count=rev_count, review_earnings=rev_earnings))
    return res


class AdminUpdatePricingRequest(BaseModel):
    hourly_rate: float
    original_price: Optional[float] = None


@router.post(
    "/admin/mentors/{mentor_id}/update-pricing",
    response_model=MentorResponse,
    summary="Update mentor pricing by admin",
)
async def admin_update_pricing(
    mentor_id: int,
    body: AdminUpdatePricingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MentorResponse:
    if current_user.email.lower() not in ("durgasravan21@gmail.com", "challagollasridevi@gmail.com"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the platform admin can update mentor pricing.",
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
    mentor.hourly_rate = body.hourly_rate
    if body.original_price is not None:
        mentor.original_price = body.original_price
    elif mentor.original_price is None:
        mentor.original_price = body.hourly_rate * 1.3
    mentor.price_edited_by_admin = True
    await db.flush()
    reviewed_count, review_earnings = await _get_mentor_review_stats(db, mentor.id)
    return _mentor_to_response(mentor, reviewed_count=reviewed_count, review_earnings=review_earnings)


@router.post(
    "/admin/mentors/{mentor_id}/toggle-premium",
    response_model=MentorResponse,
    summary="Toggle mentor premium tier status by admin",
)
async def admin_toggle_premium(
    mentor_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MentorResponse:
    if current_user.email.lower() not in ("durgasravan21@gmail.com", "challagollasridevi@gmail.com"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the platform admin can toggle mentor premium status.",
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
    mentor.has_premium_subscription = not mentor.has_premium_subscription
    await db.flush()
    reviewed_count, review_earnings = await _get_mentor_review_stats(db, mentor.id)
    return _mentor_to_response(mentor, reviewed_count=reviewed_count, review_earnings=review_earnings)


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
    if new_status == "confirmed":
        from datetime import datetime, timezone
        session.scheduled_at = datetime.now(timezone.utc)
    await db.commit()

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
        is_reviewed=len(session.reviews) > 0 if session.reviews else False,
        reminder_sent=session.reminder_sent if hasattr(session, "reminder_sent") else False,
        reminder_sent_at=session.reminder_sent_at if hasattr(session, "reminder_sent_at") else None,
    )


@router.post(
    "/mentors/sessions/{session_id}/remind",
    response_model=SessionResponse,
    summary="Send call joining reminder to student",
)
async def send_join_reminder(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Send call joining reminder (mentor action)."""
    result = await db.execute(
        select(MentorSession).where(MentorSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with id {session_id} not found",
        )

    # Verify user is the mentor for this session
    result_m = await db.execute(
        select(MentorProfile).where(MentorProfile.id == session.mentor_id)
    )
    mentor = result_m.scalar_one_or_none()
    if not mentor or mentor.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the mentor of this session can send join reminders.",
        )

    from datetime import datetime, timezone
    session.reminder_sent = True
    session.reminder_sent_at = datetime.now(timezone.utc)
    await db.commit()

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
        student_name=session.student.name if session.student else None,
        is_reviewed=len(session.reviews) > 0 if session.reviews else False,
        reminder_sent=session.reminder_sent,
        reminder_sent_at=session.reminder_sent_at,
    )


class WebRTCSignalRequest(BaseModel):
    payload: str


@router.post(
    "/mentors/sessions/{session_id}/signal",
    summary="Post WebRTC signaling message",
)
async def post_webrtc_signal(
    session_id: int,
    body: WebRTCSignalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MentorSession).where(MentorSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found."
        )

    from app.models.mentor import WebRTCSignal
    new_signal = WebRTCSignal(
        session_id=session_id,
        sender_id=current_user.id,
        payload=body.payload,
    )
    db.add(new_signal)
    await db.commit()
    return {"status": "success"}


@router.get(
    "/mentors/sessions/{session_id}/signals",
    summary="Get WebRTC signaling messages",
)
async def get_webrtc_signals(
    session_id: int,
    after_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.mentor import WebRTCSignal
    query = select(WebRTCSignal).where(WebRTCSignal.session_id == session_id)
    if after_id is not None:
        query = query.where(WebRTCSignal.id > after_id)
    
    query = query.order_by(WebRTCSignal.id.asc())
    result = await db.execute(query)
    signals = result.scalars().all()

    # Automatically clean up old signals for this session older than 2 minutes
    from datetime import datetime, timezone, timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=2)
    from sqlalchemy import delete
    try:
        await db.execute(delete(WebRTCSignal).where(WebRTCSignal.session_id == session_id, WebRTCSignal.created_at < cutoff))
        await db.commit()
    except Exception as e:
        logger.warning(f"Error cleaning up old WebRTC signals: {e}")

    return [
        {
            "id": s.id,
            "session_id": s.session_id,
            "sender_id": s.sender_id,
            "payload": s.payload,
            "created_at": s.created_at,
        }
        for s in signals
    ]



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

    if not body.screenshot_base64 or not body.screenshot_base64.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Screenshot proof is mandatory for submitting a report.",
        )

    screenshot_url = save_base64_file(body.screenshot_base64, "report_proof", current_user.id)
    if not screenshot_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to save screenshot proof. Please upload a valid image file.",
        )

    report = MentorReport(
        mentor_id=mentor_id,
        student_id=current_user.id,
        reason=body.reason,
        status="pending",
        reported_by="student",
        screenshot_url=screenshot_url,
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
        reported_by=report.reported_by,
        screenshot_url=report.screenshot_url,
        created_at=report.created_at,
        mentor_name=mentor.user.name if mentor.user else "Mentor",
        student_name=current_user.name,
    )


@router.post(
    "/mentors/student/{student_id}/report",
    response_model=MentorReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Report a student (by mentor)",
)
async def report_student(
    student_id: int,
    body: ReportStudentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MentorReportResponse:
    # Check if current user has a mentor profile
    result = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    mentor = result.scalar_one_or_none()
    if mentor is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered coaches/mentors can report a student.",
        )

    # Check if student exists
    from app.models.user import User as UserModel
    student_result = await db.execute(
        select(UserModel).where(UserModel.id == student_id)
    )
    student_user = student_result.scalar_one_or_none()
    if student_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id {student_id} not found",
        )

    # Cannot report yourself
    if student_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot report yourself",
        )

    if not body.screenshot_base64 or not body.screenshot_base64.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Screenshot proof is mandatory for submitting a report.",
        )

    screenshot_url = save_base64_file(body.screenshot_base64, "report_proof", current_user.id)
    if not screenshot_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to save screenshot proof. Please upload a valid image file.",
        )

    report = MentorReport(
        mentor_id=mentor.id,
        student_id=student_id,
        reason=body.reason,
        status="pending",
        reported_by="mentor",
        screenshot_url=screenshot_url,
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
        reported_by=report.reported_by,
        screenshot_url=report.screenshot_url,
        created_at=report.created_at,
        mentor_name=current_user.name,
        student_name=student_user.name,
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
    if current_user.email.lower() not in ("durgasravan21@gmail.com", "challagollasridevi@gmail.com"):
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
                reported_by=r.reported_by,
                screenshot_url=r.screenshot_url,
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
    if current_user.email.lower() not in ("durgasravan21@gmail.com", "challagollasridevi@gmail.com"):
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
        reported_by=report.reported_by,
        screenshot_url=report.screenshot_url,
        created_at=report.created_at,
        mentor_name=mentor_name,
        student_name=student_name,
    )


@router.get(
    "/admin/users/active",
    summary="Get active users registry for admin review",
)
async def get_active_users_registry(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.email.lower() not in ("durgasravan21@gmail.com", "challagollasridevi@gmail.com"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the platform admin can view active users registry.",
        )

    from app.models.user import User as UserModel
    result = await db.execute(select(UserModel))
    users = result.scalars().all()

    active_users = []
    for u in users:
        active_path = None
        for path in u.career_paths:
            path_status = path.status.value if hasattr(path.status, "value") else path.status
            if path_status == "active":
                active_path = path
                break
        
        dream_role = "Not Configured"
        skill_progress = 0
        if active_path:
            if active_path.target_role:
                dream_role = active_path.target_role.title
            skill_progress = int(active_path.completion_percentage)

        active_proj_title = "None"
        for up in u.projects:
            up_status = up.status.value if hasattr(up.status, "value") else up.status
            if up_status != "reviewed":
                if up.project:
                    active_proj_title = up.project.title
                break

        user_status = "Active Now" if u.is_active else "Idle"

        active_users.append({
            "id": u.id,
            "name": u.name or u.email.split("@")[0],
            "email": u.email,
            "role": u.role,
            "dream_role": dream_role,
            "skill_progress": skill_progress,
            "active_project": active_proj_title,
            "status": user_status
        })

    return active_users





