"""SQLAlchemy ORM models – Project, ProjectSkill, UserProject, Recommendation."""

from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProjectDifficulty(str, enum.Enum):
    """Difficulty level of a project."""
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class UserProjectStatus(str, enum.Enum):
    """Status of a user's project submission."""
    in_progress = "in_progress"
    submitted = "submitted"
    reviewed = "reviewed"


class RecommendationType(str, enum.Enum):
    """Type of recommendation."""
    project = "project"
    skill = "skill"
    mentor = "mentor"


class Project(Base):
    """A portfolio / learning project template."""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[ProjectDifficulty] = mapped_column(
        Enum(ProjectDifficulty, name="project_difficulty_enum"),
        default=ProjectDifficulty.beginner,
        nullable=False,
    )
    tech_stack: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    estimated_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    career_relevance_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    github_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    project_skills: Mapped[list[ProjectSkill]] = relationship(
        "ProjectSkill", back_populates="project", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Project id={self.id} title={self.title!r}>"


class ProjectSkill(Base):
    """Many-to-many mapping between projects and skills."""

    __tablename__ = "project_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    project: Mapped[Project] = relationship("Project", back_populates="project_skills")
    skill: Mapped["Skill"] = relationship("Skill", lazy="selectin")  # noqa: F821

    def __repr__(self) -> str:
        return f"<ProjectSkill project_id={self.project_id} skill_id={self.skill_id}>"


class UserProject(Base):
    """A user's submission / progress on a project."""

    __tablename__ = "user_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[UserProjectStatus] = mapped_column(
        Enum(UserProjectStatus, name="user_project_status_enum"),
        default=UserProjectStatus.in_progress,
        nullable=False,
    )
    github_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    portfolio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    review_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewer_mentor_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("mentor_profiles.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    reviewer = relationship("MentorProfile", lazy="selectin")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="projects")  # noqa: F821
    project: Mapped[Project] = relationship("Project", lazy="selectin")

    def __repr__(self) -> str:
        return f"<UserProject id={self.id} user_id={self.user_id} project_id={self.project_id}>"


class Recommendation(Base):
    """AI-generated recommendation for a user."""

    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[RecommendationType] = mapped_column(
        Enum(RecommendationType, name="recommendation_type_enum"),
        nullable=False,
    )
    target_id: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    dismissed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="recommendations")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Recommendation id={self.id} type={self.type} user_id={self.user_id}>"
