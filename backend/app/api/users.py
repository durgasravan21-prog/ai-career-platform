"""User profile and skills API routes."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.career import Skill
from app.models.user import User, UserSkill
from app.schemas.user import (
    SkillResponse,
    UpdateSkillsRequest,
    UserProfileResponse,
    UserSkillResponse,
    CVAnalysisResponse,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get current user profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    """Return the full profile of the authenticated user, including skills."""
    # Reload with relationships (they're lazy='selectin' so should be loaded)
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).where(User.id == current_user.id).options(selectinload(User.mentor_profile))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserProfileResponse.model_validate(user)


@router.post(
    "/skills",
    response_model=list[UserSkillResponse],
    status_code=status.HTTP_200_OK,
    summary="Bulk upsert user skills",
)
async def update_skills(
    body: UpdateSkillsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[UserSkillResponse]:
    """Replace all skills for the current user.

    - Deletes existing UserSkill rows for the user.
    - Inserts new ones from the request body.
    - Validates that each skill_id exists.
    """
    # Validate all skill IDs exist
    skill_ids = [s.skill_id for s in body.skills]
    result = await db.execute(select(Skill.id).where(Skill.id.in_(skill_ids)))
    existing_ids = {row[0] for row in result.all()}
    missing = set(skill_ids) - existing_ids
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Skill IDs not found: {sorted(missing)}",
        )

    # Delete existing skills
    await db.execute(
        delete(UserSkill).where(UserSkill.user_id == current_user.id)
    )

    # Insert new skills
    new_skills: list[UserSkill] = []
    for item in body.skills:
        user_skill = UserSkill(
            user_id=current_user.id,
            skill_id=item.skill_id,
            proficiency_level=item.proficiency_level,
            years_experience=item.years_experience,
        )
        db.add(user_skill)
        new_skills.append(user_skill)

    await db.flush()

    # Re-fetch with skill relationship loaded
    result = await db.execute(
        select(UserSkill).where(UserSkill.user_id == current_user.id)
    )
    user_skills = result.scalars().all()

    return [
        UserSkillResponse(
            id=us.id,
            skill_id=us.skill_id,
            proficiency_level=us.proficiency_level.value if hasattr(us.proficiency_level, "value") else us.proficiency_level,
            years_experience=us.years_experience,
            skill=SkillResponse.model_validate(us.skill) if us.skill else None,
        )
        for us in user_skills
    ]


@router.get(
    "/skills",
    response_model=list[UserSkillResponse],
    summary="Get current user's skills",
)
async def get_skills(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[UserSkillResponse]:
    """Return all skills for the authenticated user."""
    result = await db.execute(
        select(UserSkill).where(UserSkill.user_id == current_user.id)
    )
    user_skills = result.scalars().all()

    return [
        UserSkillResponse(
            id=us.id,
            skill_id=us.skill_id,
            proficiency_level=us.proficiency_level.value if hasattr(us.proficiency_level, "value") else us.proficiency_level,
            years_experience=us.years_experience,
            skill=SkillResponse.model_validate(us.skill) if us.skill else None,
        )
        for us in user_skills
    ]


# ── Flat User Profile schemas and endpoints for frontend compatibility ──
from pydantic import BaseModel

class FrontendUserProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    target_role_id: Optional[int] = None
    years_of_experience: Optional[float] = None
    current_role: Optional[str] = None
    location: Optional[str] = None
    mobile_number: Optional[str] = None

class FrontendUserProfileResponse(BaseModel):
    id: int
    user_id: int
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    target_role_id: Optional[int] = None
    years_of_experience: Optional[float] = None
    current_role: Optional[str] = None
    location: Optional[str] = None
    mobile_number: Optional[str] = None
    skills: list[UserSkillResponse] = []
    created_at: datetime
    updated_at: datetime


async def _build_profile_response(user: User, db: AsyncSession) -> FrontendUserProfileResponse:
    profile = user.profile
    if profile is None:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
        await db.flush()
        
    from app.models.career import CareerPath, CareerPathStatus
    result = await db.execute(
        select(CareerPath.target_role_id)
        .where(CareerPath.user_id == user.id, CareerPath.status == CareerPathStatus.active)
        .order_by(CareerPath.updated_at.desc())
    )
    target_role = result.scalar_one_or_none()
    
    skills_resp = [
        UserSkillResponse(
            id=us.id,
            skill_id=us.skill_id,
            proficiency_level=us.proficiency_level.value if hasattr(us.proficiency_level, "value") else us.proficiency_level,
            years_experience=us.years_experience,
            skill=SkillResponse.model_validate(us.skill) if us.skill else None,
        )
        for us in user.skills
    ]
    
    return FrontendUserProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        bio=profile.bio,
        avatar_url=None,
        github_url=profile.portfolio_url,
        linkedin_url=profile.linkedin_url,
        portfolio_url=profile.portfolio_url,
        target_role_id=target_role,
        years_of_experience=profile.years_of_experience,
        current_role=profile.current_role,
        location=profile.location,
        mobile_number=profile.mobile_number,
        skills=skills_resp,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get(
    "/profile",
    response_model=FrontendUserProfileResponse,
    summary="Get user profile (frontend format)",
)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FrontendUserProfileResponse:
    """Return user profile details in flat format."""
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one()
    return await _build_profile_response(user, db)


@router.put(
    "/profile",
    response_model=FrontendUserProfileResponse,
    summary="Update user profile (frontend format)",
)
async def update_profile(
    body: FrontendUserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FrontendUserProfileResponse:
    """Update user profile details."""
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one()
    
    profile = user.profile
    if profile is None:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
        await db.flush()
        
    if body.name is not None:
        user.name = body.name
    if body.bio is not None:
        profile.bio = body.bio
    if body.linkedin_url is not None:
        profile.linkedin_url = body.linkedin_url
    if body.portfolio_url is not None:
        profile.portfolio_url = body.portfolio_url
    if body.years_of_experience is not None:
        profile.years_of_experience = body.years_of_experience
    if body.current_role is not None:
        profile.current_role = body.current_role
    if body.location is not None:
        profile.location = body.location
    if body.mobile_number is not None:
        profile.mobile_number = body.mobile_number
        
    # If target_role_id is specified, let's ensure we create/update the active career path
    if body.target_role_id is not None:
        from app.models.career import Role, CareerPath, CareerPathStatus
        # Verify role exists
        role_result = await db.execute(select(Role).where(Role.id == body.target_role_id))
        role = role_result.scalar_one_or_none()
        if role is not None:
            # Check if active path already exists
            cp_result = await db.execute(
                select(CareerPath)
                .where(CareerPath.user_id == user.id, CareerPath.status == CareerPathStatus.active)
            )
            active_cp = cp_result.scalar_one_or_none()
            if active_cp:
                active_cp.target_role_id = role.id
            else:
                new_cp = CareerPath(
                    user_id=user.id,
                    target_role_id=role.id,
                    status=CareerPathStatus.active,
                    completion_percentage=0.0,
                )
                db.add(new_cp)
                
    await db.flush()
    # Reload user
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one()
    return await _build_profile_response(user, db)


# Add PUT method decorator to update_skills
@router.put(
    "/skills",
    response_model=list[UserSkillResponse],
    summary="Bulk upsert user skills (PUT alias)",
)
async def update_skills_put(
    body: UpdateSkillsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[UserSkillResponse]:
    """PUT alias to update skills."""
    return await update_skills(body, current_user, db)


@router.post(
    "/analyze-cv",
    response_model=CVAnalysisResponse,
    summary="Upload and analyze user CV/Resume against active target role requirements",
)
async def analyze_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CVAnalysisResponse:
    """Analyze user uploaded CV file and check matching skills, ATS score, rejection risks."""
    # 1. Fetch active target role for current user
    from app.models.career import CareerPath, CareerPathStatus, RoleSkill
    
    result = await db.execute(
        select(CareerPath)
        .where(CareerPath.user_id == current_user.id, CareerPath.status == CareerPathStatus.active)
        .order_by(CareerPath.updated_at.desc())
    )
    career_path = result.scalar_one_or_none()
    
    target_role_title = "Full-Stack Developer"
    required_skills = []
    
    if career_path:
        # Load the role explicitly to avoid lazy-loading issues
        from app.models.career import Role
        role_res = await db.execute(select(Role).where(Role.id == career_path.target_role_id))
        target_role = role_res.scalar_one_or_none()
        if target_role:
            target_role_title = target_role.title
            
            # Load required skills for this role
            skills_result = await db.execute(
                select(RoleSkill).where(RoleSkill.role_id == target_role.id)
            )
            role_skills = skills_result.scalars().all()
            for rs in role_skills:
                if rs.skill:
                    required_skills.append(rs.skill.name)
    
    if not required_skills:
        # Fallback to general skills if no target role is active
        required_skills = ["React", "Node.js", "TypeScript", "PostgreSQL", "Git", "Docker"]
        
    # 2. Extract CV text from uploaded file
    filename = file.filename or ""
    content_bytes = await file.read()
    
    # Simple and robust decoder
    cv_text = ""
    for encoding in ("utf-8", "latin1", "cp1252"):
        try:
            cv_text = content_bytes.decode(encoding)
            break
        except Exception:
            continue
            
    if not cv_text:
        cv_text = content_bytes.decode("utf-8", errors="ignore")

    # 2a. Call real AI CV Scanner Agent if API keys are available
    from app.ai.cv_agent import analyze_cv_ai
    ai_result = await analyze_cv_ai(cv_text, target_role_title, required_skills)
    if ai_result:
        return CVAnalysisResponse(
            ats_score=ai_result.get("ats_score", 70),
            target_role=ai_result.get("target_role", target_role_title),
            missing_keywords=ai_result.get("missing_keywords", []),
            formatting_issues=ai_result.get("formatting_issues", []),
            rejection_risks=ai_result.get("rejection_risks", []),
            actionable_recommendations=ai_result.get("actionable_recommendations", []),
            parsed_skills=ai_result.get("parsed_skills", []),
            parsed_education=ai_result.get("parsed_education", []),
            parsed_experience=ai_result.get("parsed_experience", []),
        )
        
    # Parse CV text (case-insensitive substring check for skills and keywords)
    cv_text_lower = cv_text.lower()
    
    # Check for skills
    matched_skills = []
    missing_skills = []
    
    for skill in required_skills:
        if skill.lower() in cv_text_lower:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)
    parsed_education = []
    parsed_experience = []
    
    # Simple heuristics
    edu_keywords = ["university", "college", "institute", "bachelor", "master", "degree", "b.s.", "m.s.", "b.tech", "m.tech", "phd", "ph.d"]
    for word in edu_keywords:
        if word in cv_text_lower:
            if word in ["bachelor", "b.s.", "b.tech"]:
                parsed_education.append("Bachelor of Science in Computer Science")
            elif word in ["master", "m.s.", "m.tech"]:
                parsed_education.append("Master of Science in Software Engineering")
                
    if not parsed_education:
        parsed_education.append("Self-taught Developer / Ongoing Education")
        
    exp_keywords = ["developer", "engineer", "intern", "analyst", "lead", "architect", "manager"]
    for word in exp_keywords:
        if word in cv_text_lower:
            if "senior" in cv_text_lower:
                parsed_experience.append(f"Senior Software {word.capitalize()}")
            else:
                parsed_experience.append(f"Software {word.capitalize()}")
                
    if not parsed_experience:
        parsed_experience.append("Independent Projects / Freelance Work")
        
    # Make lists unique
    parsed_education = list(set(parsed_education))
    parsed_experience = list(set(parsed_experience))
    
    # 3. Calculate ATS Score
    ats_score = 90
    formatting_issues = []
    rejection_risks = []
    actionable_recommendations = []
    
    file_ext = filename.split(".")[-1].lower() if "." in filename else ""
    if file_ext not in ["pdf", "docx"]:
        ats_score -= 15
        formatting_issues.append(f"File extension is .{file_ext}. ATS parsers heavily prefer PDF (.pdf) or Word Document (.docx) formats.")
        actionable_recommendations.append("Export and upload your CV as a PDF or DOCX file.")
        
    # Missing required skills penalty
    if missing_skills:
        penalty = min(len(missing_skills) * 6, 30)
        ats_score -= penalty
        rejection_risks.append(f"Missing crucial technical keywords: {', '.join(missing_skills[:3])}. This triggers automatic rejection filters in company ATS systems.")
        for ms in missing_skills[:4]:
            actionable_recommendations.append(f"Add direct experience with '{ms}' to your skills list and project descriptions.")
            
    # Check for contact details
    contact_keywords = ["email", "phone", "contact", "@", "+"]
    has_contact = any(k in cv_text_lower for k in contact_keywords)
    if not has_contact:
        ats_score -= 15
        rejection_risks.append("No clear contact details (email or phone number) detected. Recruiters cannot reach out to you.")
        actionable_recommendations.append("Place your professional email address and phone number in a prominent header at the top of page 1.")
        
    # Check for links (LinkedIn/GitHub)
    has_github = "github.com" in cv_text_lower
    has_linkedin = "linkedin.com" in cv_text_lower
    if not has_github:
        formatting_issues.append("Missing GitHub profile link. Technical recruiters expect to see your repositories.")
        actionable_recommendations.append("Include your GitHub portfolio link under your contact section.")
    if not has_linkedin:
        formatting_issues.append("Missing LinkedIn profile link. Companies check LinkedIn to verify professional history.")
        actionable_recommendations.append("Include a link to your LinkedIn profile in the contact details.")
        
    # Check length
    char_count = len(cv_text)
    if char_count < 150:
        ats_score -= 20
        rejection_risks.append("The CV content appears extremely short or unreadable. Parser failed to extract significant text.")
        actionable_recommendations.append("Ensure your CV is not a scanned image. Use a text-searchable PDF format.")
    elif char_count > 12000:
        formatting_issues.append("Your CV is exceptionally long. Modern standards require CVs to be 1 to 2 pages maximum.")
        actionable_recommendations.append("Condense your bullet points. Keep older work experience brief to fit a 2-page limit.")
        
    # General formatting check
    if "summary" not in cv_text_lower and "objective" not in cv_text_lower:
        formatting_issues.append("No Professional Summary section found.")
        actionable_recommendations.append("Add a 3-line summary at the top outlining your years of experience, core tech stack, and what you aim to build.")
        
    if "projects" not in cv_text_lower:
        rejection_risks.append("No dedicated Projects section found. Companies want to see practical applications of your skills.")
        actionable_recommendations.append("Create a 'Key Projects' section. Highlight 2-3 complex projects, their tech stack, and your key achievements.")
        
    # Ensure ATS score is bounded
    ats_score = max(min(ats_score, 100), 20)
    
    # Default recommendations if everything is perfect
    if ats_score >= 85 and not actionable_recommendations:
        actionable_recommendations.append("Add more metrics and business impact results to your experience bullet points (e.g. 'Improved speed by 25%').")
        actionable_recommendations.append("Review your skills order and ensure the most relevant tech stacks are highlighted at the top.")
        
    return CVAnalysisResponse(
        ats_score=ats_score,
        target_role=target_role_title,
        missing_keywords=missing_skills,
        formatting_issues=formatting_issues,
        rejection_risks=rejection_risks,
        actionable_recommendations=actionable_recommendations,
        parsed_skills=matched_skills,
        parsed_education=parsed_education,
        parsed_experience=parsed_experience,
    )
