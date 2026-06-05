"""Career / roles / roadmap API routes."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.skill_gap import analyze_skill_gap
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.career import CareerPath, CareerPathStatus, Role, RoleSkill
from app.models.user import User, UserSkill
from app.schemas.career import (
    RoadmapRequest,
    RoadmapResponse,
    RoleDetailResponse,
    RoleResponse,
    RoleSkillResponse,
    SkillGapResult,
)
from app.schemas.user import SkillResponse

router = APIRouter(prefix="/career", tags=["Career"])


@router.get(
    "/roles",
    response_model=list[RoleDetailResponse],
    summary="List all career roles with required skills",
)
async def list_roles(
    db: AsyncSession = Depends(get_db),
) -> list[RoleDetailResponse]:
    """Return all available career roles with their required skills."""
    result = await db.execute(select(Role))
    roles = result.scalars().all()

    response: list[RoleDetailResponse] = []
    for role in roles:
        required_skills = [
            RoleSkillResponse(
                id=rs.id,
                skill_id=rs.skill_id,
                skill_name=rs.skill.name if rs.skill else None,
                proficiency_needed=rs.proficiency_needed.value if hasattr(rs.proficiency_needed, "value") else rs.proficiency_needed,
                priority=rs.priority,
            )
            for rs in role.role_skills
        ]
        response.append(
            RoleDetailResponse(
                id=role.id,
                title=role.title,
                description=role.description,
                seniority_level=role.seniority_level,
                avg_salary=role.avg_salary,
                required_skills=required_skills,
            )
        )

    return response


@router.get(
    "/roles/{role_id}",
    response_model=RoleDetailResponse,
    summary="Get role details",
)
async def get_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
) -> RoleDetailResponse:
    """Return details for a specific career role, including required skills."""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found",
        )

    required_skills = [
        RoleSkillResponse(
            id=rs.id,
            skill_id=rs.skill_id,
            skill_name=rs.skill.name if rs.skill else None,
            proficiency_needed=rs.proficiency_needed.value if hasattr(rs.proficiency_needed, "value") else rs.proficiency_needed,
            priority=rs.priority,
        )
        for rs in role.role_skills
    ]

    return RoleDetailResponse(
        id=role.id,
        title=role.title,
        description=role.description,
        seniority_level=role.seniority_level,
        avg_salary=role.avg_salary,
        required_skills=required_skills,
    )


async def _build_roadmap_response(
    career_path: CareerPath,
    gap_result: SkillGapResult,
    db: AsyncSession,
) -> RoadmapResponse:
    """Helper to construct the detailed RoadmapResponse from AI result."""
    from app.schemas.career import RoleResponse, SkillGapAnalysisSchema, MissingSkillSchema, LearningResourceSchema, LearningPathStepSchema
    from app.schemas.user import SkillResponse, UserSkillResponse
    
    role = career_path.target_role
    target_role_resp = RoleResponse.model_validate(role)
    
    # Get current user skills
    result = await db.execute(
        select(UserSkill).where(UserSkill.user_id == career_path.user_id)
    )
    user_skills = result.scalars().all()
    current_skills_resp = [
        UserSkillResponse(
            id=us.id,
            skill_id=us.skill_id,
            proficiency_level=us.proficiency_level.value if hasattr(us.proficiency_level, "value") else us.proficiency_level,
            years_experience=us.years_experience,
            skill=SkillResponse.model_validate(us.skill) if us.skill else None,
        )
        for us in user_skills
    ]
    
    # Load all database skills for mapping
    from app.models.career import Skill
    skills_result = await db.execute(select(Skill))
    all_skills = {s.name.lower(): s for s in skills_result.scalars().all()}
    
    missing_skills_resp = []
    for item in gap_result.missing_skills:
        skill_obj = all_skills.get(item.skill_name.lower())
        if skill_obj:
            skill_resp = SkillResponse.model_validate(skill_obj)
        else:
            skill_resp = SkillResponse(id=0, name=item.skill_name, category="other", description="")
            
        # Structured learning resources
        resources = [
            LearningResourceSchema(
                title=f"Master {item.skill_name} on Coursera",
                url=f"https://www.coursera.org/search?query={item.skill_name}",
                type="course",
                estimated_hours=20.0,
                provider="Coursera",
            ),
            LearningResourceSchema(
                title=f"Official {item.skill_name} Documentation",
                url="https://google.com",
                type="documentation",
                estimated_hours=5.0,
                provider="Official Support",
            )
        ]
        
        # Map priority
        priority_str = "high"
        if item.priority > 7:
            priority_str = "low"
        elif item.priority > 4:
            priority_str = "medium"
            
        missing_skills_resp.append(
            MissingSkillSchema(
                skill=skill_resp,
                required_proficiency=item.required_level,
                current_proficiency=item.current_level,
                priority=priority_str,
                learning_resources=resources,
            )
        )
        
    # Learning path steps
    learning_path_resp = []
    for idx, skill_name in enumerate(gap_result.priority_order[:3]):
        skill_obj = all_skills.get(skill_name.lower())
        skills_list = [SkillResponse.model_validate(skill_obj)] if skill_obj else []
        learning_path_resp.append(
            LearningPathStepSchema(
                order=idx + 1,
                title=f"Step {idx + 1}: Learn {skill_name}",
                description=f"Focus on mastering the fundamentals of {skill_name} and building practical projects.",
                skills=skills_list,
                estimated_weeks=4,
                resources=[
                    LearningResourceSchema(
                        title=f"{skill_name} Tutorial",
                        url="https://google.com",
                        type="tutorial",
                        estimated_hours=10.0,
                        provider="YouTube",
                    )
                ]
            )
        )
        
    # Fetch recommended projects
    from app.api.projects import get_recommendations
    try:
        from app.models.user import User
        user_result = await db.execute(select(User).where(User.id == career_path.user_id))
        user_obj = user_result.scalar_one()
        recs = await get_recommendations(user_obj, db)
        recommended_projects_resp = [r.project for r in recs[:3]]
    except Exception:
        recommended_projects_resp = []
        
    skill_gap_analysis = SkillGapAnalysisSchema(
        target_role=target_role_resp,
        current_skills=current_skills_resp,
        missing_skills=missing_skills_resp,
        completion_percent=career_path.completion_percentage,
        estimated_months=gap_result.estimated_months,
    )
    
    return RoadmapResponse(
        career_path_id=career_path.id,
        status=career_path.status.value if hasattr(career_path.status, "value") else career_path.status,
        created_at=career_path.created_at,
        skill_gap=skill_gap_analysis,
        recommended_projects=recommended_projects_resp,
        learning_path=learning_path_resp,
    )


@router.post(
    "/roadmap",
    response_model=RoadmapResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a career roadmap",
)
async def generate_roadmap(
    body: RoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    """Generate a personalised career roadmap.

    1. Fetches the user's current skills.
    2. Fetches the target role and its required skills.
    3. Runs the AI skill-gap analysis engine.
    4. Persists a CareerPath record.
    5. Returns the full roadmap response.
    """
    # Fetch target role
    result = await db.execute(select(Role).where(Role.id == body.target_role_id))
    role = result.scalar_one_or_none()
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {body.target_role_id} not found",
        )

    # Fetch user's current skills
    result = await db.execute(
        select(UserSkill).where(UserSkill.user_id == current_user.id)
    )
    user_skills = result.scalars().all()

    current_skills_data = [
        {
            "skill_name": us.skill.name if us.skill else f"skill_{us.skill_id}",
            "proficiency_level": us.proficiency_level.value if hasattr(us.proficiency_level, "value") else us.proficiency_level,
        }
        for us in user_skills
    ]

    # Build target role data
    target_role_data = {
        "title": role.title,
        "required_skills": [
            {
                "skill_name": rs.skill.name if rs.skill else f"skill_{rs.skill_id}",
                "proficiency_needed": rs.proficiency_needed.value if hasattr(rs.proficiency_needed, "value") else rs.proficiency_needed,
                "priority": rs.priority,
            }
            for rs in role.role_skills
        ],
    }

    # Run AI analysis
    gap_result: SkillGapResult = await analyze_skill_gap(
        current_skills=current_skills_data,
        target_role=target_role_data,
        db=db,
    )

    # Persist career path (and deactivate old active paths)
    from sqlalchemy import update
    await db.execute(
        update(CareerPath)
        .where(CareerPath.user_id == current_user.id, CareerPath.status == CareerPathStatus.active)
        .values(status=CareerPathStatus.paused)
    )

    career_path = CareerPath(
        user_id=current_user.id,
        target_role_id=role.id,
        status=CareerPathStatus.active,
        skill_gap_analysis=json.dumps(gap_result.model_dump()),
        completion_percentage=gap_result.current_match_percentage,
    )
    db.add(career_path)
    await db.flush()

    return await _build_roadmap_response(career_path, gap_result, db)


@router.get(
    "/skill-gap",
    response_model=RoadmapResponse,
    summary="Get user's active career skill gap analysis",
)
async def get_skill_gap(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    """Return the user's active career path and skill gap analysis."""
    result = await db.execute(
        select(CareerPath)
        .where(CareerPath.user_id == current_user.id, CareerPath.status == CareerPathStatus.active)
        .order_by(CareerPath.updated_at.desc())
    )
    career_path = result.scalar_one_or_none()
    if career_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active career path found. Complete onboarding first.",
        )
    
    try:
        gap_data = json.loads(career_path.skill_gap_analysis) if career_path.skill_gap_analysis else {}
    except Exception:
        gap_data = {}
        
    gap_result = SkillGapResult.model_validate(gap_data)
    return await _build_roadmap_response(career_path, gap_result, db)


# ── Root Router for Roles and Skills ────────────────────────────────
router_root = APIRouter(tags=["Root"])

@router_root.get(
    "/roles",
    response_model=list[RoleDetailResponse],
    summary="List all roles (root alias)",
)
async def list_roles_root(db: AsyncSession = Depends(get_db)):
    """List all roles."""
    return await list_roles(db)


@router_root.get(
    "/roles/{role_id}",
    response_model=RoleDetailResponse,
    summary="Get role details (root alias)",
)
async def get_role_root(role_id: int, db: AsyncSession = Depends(get_db)):
    """Get role details."""
    return await get_role(role_id, db)


@router_root.get(
    "/skills",
    response_model=list[SkillResponse],
    summary="List all skills (root alias)",
)
async def list_skills_root(db: AsyncSession = Depends(get_db)):
    """List all available skills for onboarding selection."""
    from app.models.career import Skill
    result = await db.execute(select(Skill))
    skills = result.scalars().all()
    return [SkillResponse.model_validate(s) for s in skills]

