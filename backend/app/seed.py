"""Database seed script.

Populates the database with roles, skills, role-skill mappings,
projects, project-skill mappings, and sample mentor profiles.

Usage:
    python -m app.seed

Idempotent — checks for existing data before inserting.
Uses synchronous SQLAlchemy for simplicity during seeding.
"""

from __future__ import annotations

import sys
from datetime import time, datetime, timezone

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.database import Base
from app.core.security import hash_password

# Import all models so Base.metadata is populated
from app.models.user import User, UserProfile
from app.models.career import (
    CareerPath,
    ProficiencyNeeded,
    Role,
    RoleSkill,
    Skill,
)
from app.models.project import (
    Project,
    ProjectDifficulty,
    ProjectSkill,
)
from app.models.mentor import (
    MentorAvailability,
    MentorProfile,
)

# ── Sync engine for seeding ───────────────────────────────────────────
sync_engine = create_engine(settings.DATABASE_URL_SYNC, echo=False)
SyncSession = sessionmaker(bind=sync_engine)


def seed_skills(session: Session) -> dict[str, int]:
    """Seed 20 skills across categories. Returns name→id mapping."""
    skills_data = [
        # Frontend
        {"name": "React", "category": "Frontend", "description": "A JavaScript library for building user interfaces with component-based architecture."},
        {"name": "TypeScript", "category": "Frontend", "description": "Typed superset of JavaScript that compiles to plain JavaScript."},
        {"name": "CSS/Tailwind", "category": "Frontend", "description": "Modern CSS frameworks and utility-first styling with Tailwind CSS."},
        {"name": "Next.js", "category": "Frontend", "description": "React framework for production with SSR, SSG, and API routes."},
        # Backend
        {"name": "Python", "category": "Backend", "description": "General-purpose programming language widely used for web, data science, and automation."},
        {"name": "Node.js", "category": "Backend", "description": "JavaScript runtime for server-side applications and APIs."},
        {"name": "PostgreSQL", "category": "Backend", "description": "Advanced open-source relational database with JSON and full-text search support."},
        {"name": "REST APIs", "category": "Backend", "description": "Designing and building RESTful web services with proper HTTP semantics."},
        {"name": "GraphQL", "category": "Backend", "description": "Query language for APIs providing flexible, efficient data fetching."},
        {"name": "System Design", "category": "Backend", "description": "Designing scalable, reliable distributed systems and architectures."},
        # DevOps
        {"name": "Docker", "category": "DevOps", "description": "Container platform for packaging and deploying applications consistently."},
        {"name": "Kubernetes", "category": "DevOps", "description": "Container orchestration platform for automated deployment and scaling."},
        {"name": "CI/CD", "category": "DevOps", "description": "Continuous integration and deployment pipelines using GitHub Actions, Jenkins, etc."},
        {"name": "AWS", "category": "DevOps", "description": "Amazon Web Services cloud platform — EC2, S3, Lambda, RDS, and more."},
        {"name": "Terraform", "category": "DevOps", "description": "Infrastructure as code tool for provisioning cloud resources declaratively."},
        # AI/ML
        {"name": "Machine Learning", "category": "AI/ML", "description": "Building predictive models with scikit-learn, XGBoost, and ML pipelines."},
        {"name": "TensorFlow", "category": "AI/ML", "description": "Google's deep learning framework for neural network training and inference."},
        {"name": "PyTorch", "category": "AI/ML", "description": "Facebook's deep learning framework favored for research and production."},
        # Mobile
        {"name": "Flutter", "category": "Mobile", "description": "Google's cross-platform UI toolkit for mobile, web, and desktop apps."},
        {"name": "Swift", "category": "Mobile", "description": "Apple's programming language for iOS, macOS, and watchOS development."},
    ]

    existing = {s.name for s in session.execute(select(Skill)).scalars().all()}
    name_to_id: dict[str, int] = {}

    for data in skills_data:
        if data["name"] not in existing:
            skill = Skill(**data)
            session.add(skill)
            session.flush()
            name_to_id[skill.name] = skill.id
        else:
            skill = session.execute(select(Skill).where(Skill.name == data["name"])).scalar_one()
            name_to_id[skill.name] = skill.id

    return name_to_id


def seed_roles(session: Session) -> dict[str, int]:
    """Seed 8 career roles. Returns title→id mapping."""
    roles_data = [
        {
            "title": "Full-Stack Developer",
            "description": "Builds both frontend and backend of web applications, handling everything from UI to database design.",
            "seniority_level": "Mid-Senior",
            "avg_salary": 125000.0,
        },
        {
            "title": "Frontend Developer",
            "description": "Specializes in building responsive, accessible user interfaces with modern JavaScript frameworks.",
            "seniority_level": "Mid",
            "avg_salary": 110000.0,
        },
        {
            "title": "Backend Developer",
            "description": "Designs and builds server-side logic, APIs, databases, and system integrations.",
            "seniority_level": "Mid-Senior",
            "avg_salary": 120000.0,
        },
        {
            "title": "DevOps Engineer",
            "description": "Manages CI/CD pipelines, infrastructure as code, monitoring, and cloud deployments.",
            "seniority_level": "Senior",
            "avg_salary": 135000.0,
        },
        {
            "title": "ML Engineer",
            "description": "Designs, trains, and deploys machine learning models in production environments.",
            "seniority_level": "Senior",
            "avg_salary": 145000.0,
        },
        {
            "title": "Data Scientist",
            "description": "Analyses data to extract insights, builds statistical models, and communicates findings to stakeholders.",
            "seniority_level": "Mid-Senior",
            "avg_salary": 130000.0,
        },
        {
            "title": "Mobile Developer",
            "description": "Builds native and cross-platform mobile applications for iOS and Android.",
            "seniority_level": "Mid",
            "avg_salary": 115000.0,
        },
        {
            "title": "Cloud Architect",
            "description": "Designs cloud infrastructure, ensures scalability, security, and cost optimisation across cloud providers.",
            "seniority_level": "Senior",
            "avg_salary": 155000.0,
        },
    ]

    existing = {r.title for r in session.execute(select(Role)).scalars().all()}
    title_to_id: dict[str, int] = {}

    for data in roles_data:
        if data["title"] not in existing:
            role = Role(**data)
            session.add(role)
            session.flush()
            title_to_id[role.title] = role.id
        else:
            role = session.execute(select(Role).where(Role.title == data["title"])).scalar_one()
            title_to_id[role.title] = role.id

    return title_to_id


def seed_role_skills(
    session: Session,
    role_ids: dict[str, int],
    skill_ids: dict[str, int],
) -> None:
    """Seed role-skill mappings (5-8 skills per role)."""
    existing_count = session.execute(select(RoleSkill)).scalars().all()
    if existing_count:
        return  # Already seeded

    mappings: list[dict] = [
        # Full-Stack Developer (8 skills)
        {"role": "Full-Stack Developer", "skill": "React", "proficiency": "advanced", "priority": 1},
        {"role": "Full-Stack Developer", "skill": "TypeScript", "proficiency": "advanced", "priority": 2},
        {"role": "Full-Stack Developer", "skill": "Node.js", "proficiency": "advanced", "priority": 3},
        {"role": "Full-Stack Developer", "skill": "PostgreSQL", "proficiency": "intermediate", "priority": 4},
        {"role": "Full-Stack Developer", "skill": "REST APIs", "proficiency": "advanced", "priority": 5},
        {"role": "Full-Stack Developer", "skill": "Docker", "proficiency": "intermediate", "priority": 6},
        {"role": "Full-Stack Developer", "skill": "CSS/Tailwind", "proficiency": "intermediate", "priority": 7},
        {"role": "Full-Stack Developer", "skill": "CI/CD", "proficiency": "beginner", "priority": 8},
        # Frontend Developer (6 skills)
        {"role": "Frontend Developer", "skill": "React", "proficiency": "advanced", "priority": 1},
        {"role": "Frontend Developer", "skill": "TypeScript", "proficiency": "advanced", "priority": 2},
        {"role": "Frontend Developer", "skill": "CSS/Tailwind", "proficiency": "advanced", "priority": 3},
        {"role": "Frontend Developer", "skill": "Next.js", "proficiency": "intermediate", "priority": 4},
        {"role": "Frontend Developer", "skill": "REST APIs", "proficiency": "intermediate", "priority": 5},
        {"role": "Frontend Developer", "skill": "GraphQL", "proficiency": "beginner", "priority": 6},
        # Backend Developer (7 skills)
        {"role": "Backend Developer", "skill": "Python", "proficiency": "advanced", "priority": 1},
        {"role": "Backend Developer", "skill": "PostgreSQL", "proficiency": "advanced", "priority": 2},
        {"role": "Backend Developer", "skill": "REST APIs", "proficiency": "advanced", "priority": 3},
        {"role": "Backend Developer", "skill": "Node.js", "proficiency": "intermediate", "priority": 4},
        {"role": "Backend Developer", "skill": "Docker", "proficiency": "intermediate", "priority": 5},
        {"role": "Backend Developer", "skill": "System Design", "proficiency": "intermediate", "priority": 6},
        {"role": "Backend Developer", "skill": "CI/CD", "proficiency": "beginner", "priority": 7},
        # DevOps Engineer (7 skills)
        {"role": "DevOps Engineer", "skill": "Docker", "proficiency": "advanced", "priority": 1},
        {"role": "DevOps Engineer", "skill": "Kubernetes", "proficiency": "advanced", "priority": 2},
        {"role": "DevOps Engineer", "skill": "CI/CD", "proficiency": "advanced", "priority": 3},
        {"role": "DevOps Engineer", "skill": "AWS", "proficiency": "advanced", "priority": 4},
        {"role": "DevOps Engineer", "skill": "Terraform", "proficiency": "intermediate", "priority": 5},
        {"role": "DevOps Engineer", "skill": "Python", "proficiency": "intermediate", "priority": 6},
        {"role": "DevOps Engineer", "skill": "System Design", "proficiency": "intermediate", "priority": 7},
        # ML Engineer (6 skills)
        {"role": "ML Engineer", "skill": "Python", "proficiency": "advanced", "priority": 1},
        {"role": "ML Engineer", "skill": "TensorFlow", "proficiency": "advanced", "priority": 2},
        {"role": "ML Engineer", "skill": "PyTorch", "proficiency": "advanced", "priority": 3},
        {"role": "ML Engineer", "skill": "Machine Learning", "proficiency": "advanced", "priority": 4},
        {"role": "ML Engineer", "skill": "Docker", "proficiency": "intermediate", "priority": 5},
        {"role": "ML Engineer", "skill": "AWS", "proficiency": "intermediate", "priority": 6},
        # Data Scientist (5 skills)
        {"role": "Data Scientist", "skill": "Python", "proficiency": "advanced", "priority": 1},
        {"role": "Data Scientist", "skill": "Machine Learning", "proficiency": "advanced", "priority": 2},
        {"role": "Data Scientist", "skill": "PostgreSQL", "proficiency": "intermediate", "priority": 3},
        {"role": "Data Scientist", "skill": "TensorFlow", "proficiency": "intermediate", "priority": 4},
        {"role": "Data Scientist", "skill": "System Design", "proficiency": "beginner", "priority": 5},
        # Mobile Developer (5 skills)
        {"role": "Mobile Developer", "skill": "Flutter", "proficiency": "advanced", "priority": 1},
        {"role": "Mobile Developer", "skill": "Swift", "proficiency": "advanced", "priority": 2},
        {"role": "Mobile Developer", "skill": "TypeScript", "proficiency": "intermediate", "priority": 3},
        {"role": "Mobile Developer", "skill": "REST APIs", "proficiency": "intermediate", "priority": 4},
        {"role": "Mobile Developer", "skill": "CI/CD", "proficiency": "beginner", "priority": 5},
        # Cloud Architect (7 skills)
        {"role": "Cloud Architect", "skill": "AWS", "proficiency": "advanced", "priority": 1},
        {"role": "Cloud Architect", "skill": "Terraform", "proficiency": "advanced", "priority": 2},
        {"role": "Cloud Architect", "skill": "Kubernetes", "proficiency": "advanced", "priority": 3},
        {"role": "Cloud Architect", "skill": "Docker", "proficiency": "advanced", "priority": 4},
        {"role": "Cloud Architect", "skill": "System Design", "proficiency": "advanced", "priority": 5},
        {"role": "Cloud Architect", "skill": "CI/CD", "proficiency": "intermediate", "priority": 6},
        {"role": "Cloud Architect", "skill": "Python", "proficiency": "intermediate", "priority": 7},
    ]

    for m in mappings:
        role_id = role_ids.get(m["role"])
        skill_id = skill_ids.get(m["skill"])
        if role_id and skill_id:
            rs = RoleSkill(
                role_id=role_id,
                skill_id=skill_id,
                proficiency_needed=ProficiencyNeeded(m["proficiency"]),
                priority=m["priority"],
            )
            session.add(rs)


def seed_projects(session: Session, skill_ids: dict[str, int]) -> None:
    """Seed 10 sample projects with skills."""
    existing = session.execute(select(Project)).scalars().all()
    if existing:
        return

    projects_data = [
        {
            "title": "Real-time Chat Application",
            "description": "Build a full-featured chat app with rooms, direct messages, typing indicators, and message history using WebSockets.",
            "difficulty": ProjectDifficulty.intermediate,
            "tech_stack": {"languages": ["TypeScript", "Python"], "frameworks": ["React", "FastAPI", "Socket.io"]},
            "estimated_hours": 40,
            "career_relevance_score": 85.0,
            "skills": [("React", True), ("TypeScript", True), ("Node.js", False), ("PostgreSQL", False)],
        },
        {
            "title": "E-Commerce Platform",
            "description": "A complete online store with product catalog, cart, checkout, payment integration, and admin dashboard.",
            "difficulty": ProjectDifficulty.advanced,
            "tech_stack": {"languages": ["TypeScript"], "frameworks": ["Next.js", "Stripe", "Prisma"]},
            "estimated_hours": 80,
            "career_relevance_score": 92.0,
            "skills": [("React", True), ("Next.js", True), ("PostgreSQL", True), ("REST APIs", False), ("CSS/Tailwind", False)],
        },
        {
            "title": "Task Management API",
            "description": "RESTful API with authentication, role-based access control, task CRUD, and team collaboration features.",
            "difficulty": ProjectDifficulty.beginner,
            "tech_stack": {"languages": ["Python"], "frameworks": ["FastAPI", "SQLAlchemy"]},
            "estimated_hours": 25,
            "career_relevance_score": 78.0,
            "skills": [("Python", True), ("REST APIs", True), ("PostgreSQL", False)],
        },
        {
            "title": "CI/CD Pipeline Dashboard",
            "description": "Monitor and manage CI/CD pipelines across GitHub Actions, track build times, failure rates, and deployment status.",
            "difficulty": ProjectDifficulty.intermediate,
            "tech_stack": {"languages": ["TypeScript", "Python"], "frameworks": ["React", "FastAPI", "Docker"]},
            "estimated_hours": 50,
            "career_relevance_score": 88.0,
            "skills": [("Docker", True), ("CI/CD", True), ("React", False), ("Python", False)],
        },
        {
            "title": "ML Model Serving Platform",
            "description": "Deploy and serve machine learning models via REST APIs with versioning, A/B testing, and monitoring.",
            "difficulty": ProjectDifficulty.advanced,
            "tech_stack": {"languages": ["Python"], "frameworks": ["FastAPI", "TensorFlow Serving", "Docker"]},
            "estimated_hours": 60,
            "career_relevance_score": 95.0,
            "skills": [("Python", True), ("TensorFlow", True), ("Docker", True), ("AWS", False), ("Machine Learning", False)],
        },
        {
            "title": "Personal Portfolio Website",
            "description": "A responsive portfolio site with blog, project showcase, contact form, and CMS integration.",
            "difficulty": ProjectDifficulty.beginner,
            "tech_stack": {"languages": ["TypeScript"], "frameworks": ["Next.js", "Tailwind CSS", "MDX"]},
            "estimated_hours": 20,
            "career_relevance_score": 70.0,
            "skills": [("React", True), ("CSS/Tailwind", True), ("Next.js", False)],
        },
        {
            "title": "Kubernetes Cluster Manager",
            "description": "Web interface for managing Kubernetes clusters — view pods, deployments, services, and logs in real-time.",
            "difficulty": ProjectDifficulty.advanced,
            "tech_stack": {"languages": ["Go", "TypeScript"], "frameworks": ["React", "Kubernetes API"]},
            "estimated_hours": 70,
            "career_relevance_score": 90.0,
            "skills": [("Kubernetes", True), ("Docker", True), ("React", False), ("System Design", False)],
        },
        {
            "title": "Sentiment Analysis Dashboard",
            "description": "Analyse social media sentiment in real-time using NLP, display trends and insights on an interactive dashboard.",
            "difficulty": ProjectDifficulty.intermediate,
            "tech_stack": {"languages": ["Python", "TypeScript"], "frameworks": ["PyTorch", "React", "FastAPI"]},
            "estimated_hours": 45,
            "career_relevance_score": 87.0,
            "skills": [("PyTorch", True), ("Python", True), ("Machine Learning", False), ("React", False)],
        },
        {
            "title": "Cross-Platform Expense Tracker",
            "description": "Mobile app for tracking expenses with budget categories, charts, receipt scanning, and cloud sync.",
            "difficulty": ProjectDifficulty.intermediate,
            "tech_stack": {"languages": ["Dart"], "frameworks": ["Flutter", "Firebase"]},
            "estimated_hours": 35,
            "career_relevance_score": 75.0,
            "skills": [("Flutter", True), ("REST APIs", False)],
        },
        {
            "title": "Infrastructure as Code Starter Kit",
            "description": "Terraform modules for provisioning a production-grade AWS environment with VPC, ECS, RDS, and monitoring.",
            "difficulty": ProjectDifficulty.advanced,
            "tech_stack": {"languages": ["HCL", "Python"], "frameworks": ["Terraform", "AWS CDK"]},
            "estimated_hours": 55,
            "career_relevance_score": 91.0,
            "skills": [("Terraform", True), ("AWS", True), ("Docker", False), ("CI/CD", False)],
        },
    ]

    for pdata in projects_data:
        skills_list = pdata.pop("skills")
        project = Project(**pdata)
        session.add(project)
        session.flush()

        for skill_name, is_primary in skills_list:
            sid = skill_ids.get(skill_name)
            if sid:
                ps = ProjectSkill(
                    project_id=project.id,
                    skill_id=sid,
                    is_primary=is_primary,
                )
                session.add(ps)


def seed_mentors(session: Session) -> None:
    """Seed sample mentor profiles with availability."""
    mentors_data = [
        {
            "name": "Sarah Chen",
            "email": "sarah.chen@example.com",
            "password": "mentor123456",
            "expertise": {"areas": ["React", "TypeScript", "Next.js", "System Design"]},
            "hourly_rate": 75.0,
            "bio": "Senior Frontend Architect at a Fortune 500 company with 10+ years of experience. Passionate about teaching modern web development practices and mentoring aspiring frontend developers.",
            "rating": 4.8,
            "total_sessions": 142,
            "availability": [
                {"day": 1, "start": "09:00", "end": "12:00"},  # Tuesday
                {"day": 3, "start": "14:00", "end": "17:00"},  # Thursday
                {"day": 5, "start": "10:00", "end": "13:00"},  # Saturday
            ],
        },
        {
            "name": "Marcus Johnson",
            "email": "marcus.johnson@example.com",
            "password": "mentor123456",
            "expertise": {"areas": ["Python", "AWS", "Docker", "Kubernetes", "Terraform"]},
            "hourly_rate": 95.0,
            "bio": "Staff DevOps Engineer and AWS Solutions Architect. Led cloud migrations for 3 startups from zero to IPO. I help engineers level up their infrastructure and deployment skills.",
            "rating": 4.9,
            "total_sessions": 203,
            "availability": [
                {"day": 0, "start": "18:00", "end": "21:00"},  # Monday
                {"day": 2, "start": "18:00", "end": "21:00"},  # Wednesday
                {"day": 4, "start": "09:00", "end": "12:00"},  # Friday
            ],
        },
        {
            "name": "Dr. Priya Patel",
            "email": "priya.patel@example.com",
            "password": "mentor123456",
            "expertise": {"areas": ["Machine Learning", "PyTorch", "TensorFlow", "Python"]},
            "hourly_rate": 110.0,
            "bio": "ML Research Scientist with a PhD in Computer Science. Published 15+ papers in top conferences (NeurIPS, ICML). Specialises in NLP and computer vision. I bridge the gap between ML theory and production systems.",
            "rating": 4.7,
            "total_sessions": 89,
            "availability": [
                {"day": 1, "start": "16:00", "end": "19:00"},  # Tuesday
                {"day": 4, "start": "16:00", "end": "19:00"},  # Friday
            ],
        },
        {
            "name": "Durga sravan Challagolla",
            "email": "challagollasridevi@gmail.com",
            "password": "mentor123456",
            "expertise": {"areas": ["Full-Stack", "React", "Node.js", "Python", "SQL", "JavaScript"]},
            "hourly_rate": 0.0,
            "bio": "Full-Stack Engineer with 5+ years of experience. Focuses on full-stack web applications, database architecture, and project-based student mentoring.",
            "rating": 5.0,
            "total_sessions": 12,
            "availability": [
                {"day": 0, "start": "09:00", "end": "17:00"},
                {"day": 1, "start": "09:00", "end": "17:00"},
                {"day": 2, "start": "09:00", "end": "17:00"},
                {"day": 3, "start": "09:00", "end": "17:00"},
                {"day": 4, "start": "09:00", "end": "17:00"},
                {"day": 5, "start": "09:00", "end": "17:00"},
                {"day": 6, "start": "09:00", "end": "17:00"},
            ],
        },
        {
            "name": "durgasravan21",
            "email": "durgasravan21@gmail.com",
            "password": "mentor123456",
            "expertise": {"areas": ["Full-Stack", "JavaScript", "Software Architecture", "AI Career Strategy"]},
            "hourly_rate": 0.0,
            "bio": "Administrator & Principal Mentor. Specialises in software architecture, project intelligence, and career guidance.",
            "rating": 5.0,
            "total_sessions": 0,
            "availability": [
                {"day": 0, "start": "09:00", "end": "17:00"},
                {"day": 1, "start": "09:00", "end": "17:00"},
                {"day": 2, "start": "09:00", "end": "17:00"},
                {"day": 3, "start": "09:00", "end": "17:00"},
                {"day": 4, "start": "09:00", "end": "17:00"},
                {"day": 5, "start": "09:00", "end": "17:00"},
                {"day": 6, "start": "09:00", "end": "17:00"},
            ],
        },
    ]

    for mdata in mentors_data:
        # Check if user already exists
        user_result = session.execute(select(User).where(User.email == mdata["email"].lower()))
        user = user_result.scalar_one_or_none()
        if not user:
            # Create user account for mentor
            user = User(
                email=mdata["email"].lower(),
                name=mdata["name"],
                hashed_password=hash_password(mdata["password"]),
                is_active=True,
            )
            session.add(user)
            session.flush()

        # Check if user profile exists
        profile_result = session.execute(select(UserProfile).where(UserProfile.user_id == user.id))
        profile = profile_result.scalar_one_or_none()
        if not profile:
            profile = UserProfile(user_id=user.id, bio=mdata["bio"], current_role="Mentor")
            session.add(profile)

        # Check if mentor profile exists
        mentor_result = session.execute(select(MentorProfile).where(MentorProfile.user_id == user.id))
        mentor = mentor_result.scalar_one_or_none()
        if not mentor:
            mentor = MentorProfile(
                user_id=user.id,
                expertise=mdata["expertise"],
                hourly_rate=mdata["hourly_rate"],
                bio=mdata["bio"],
                rating=mdata["rating"],
                total_sessions=mdata["total_sessions"],
                is_active=True,
                verification_status="verified",
            )
            session.add(mentor)
            session.flush()

            # Create availability slots
            for slot in mdata["availability"]:
                avail = MentorAvailability(
                    mentor_id=mentor.id,
                    day_of_week=slot["day"],
                    start_time=time.fromisoformat(slot["start"]),
                    end_time=time.fromisoformat(slot["end"]),
                )
                session.add(avail)


def run_seed() -> None:
    """Execute the full seeding process."""
    print("=== Starting database seed ===")

    # Ensure tables exist
    Base.metadata.create_all(sync_engine)

    # Ensure dynamic columns exist for SQLite database compatibility
    from sqlalchemy import text
    with sync_engine.begin() as conn:
        alter_queries = [
            "ALTER TABLE mentor_profiles ADD COLUMN original_price FLOAT",
            "ALTER TABLE mentor_profiles ADD COLUMN price_edited_by_admin BOOLEAN DEFAULT FALSE",
            "ALTER TABLE mentor_profiles ADD COLUMN has_premium_subscription BOOLEAN DEFAULT FALSE",
            "ALTER TABLE mentor_profiles ADD COLUMN video_calls_active BOOLEAN DEFAULT TRUE",
            "ALTER TABLE mentor_reports ADD COLUMN reported_by VARCHAR(50) DEFAULT 'student'",
            "ALTER TABLE mentor_reports ADD COLUMN screenshot_url VARCHAR(500)",
            "ALTER TABLE mentor_sessions ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE",
            "ALTER TABLE mentor_sessions ADD COLUMN reminder_sent_at TIMESTAMP",
        ]
        for query in alter_queries:
            try:
                conn.execute(text(query))
            except Exception:
                pass

    with SyncSession() as session:
        try:
            print("  -> Seeding skills...")
            skill_ids = seed_skills(session)
            print(f"     [OK] {len(skill_ids)} skills")

            print("  -> Seeding roles...")
            role_ids = seed_roles(session)
            print(f"     [OK] {len(role_ids)} roles")

            print("  -> Seeding role-skill mappings...")
            seed_role_skills(session, role_ids, skill_ids)
            print("     [OK] Role-skill mappings")

            print("  -> Seeding projects...")
            seed_projects(session, skill_ids)
            print("     [OK] Projects with skill mappings")

            print("  -> Seeding mentor profiles...")
            seed_mentors(session)
            print("     [OK] Mentor profiles with availability")

            session.commit()
            print("\n=== Database seeded successfully! ===")

        except Exception as e:
            session.rollback()
            print(f"\n[ERROR] Seeding failed: {e}")
            raise


if __name__ == "__main__":
    run_seed()
