"""SQLAlchemy ORM models – Role, Skill, RoleSkill, CareerPath."""

from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    # Fallback if pgvector is not available at import time
    Vector = None  # type: ignore[assignment, misc]


class ProficiencyNeeded(str, enum.Enum):
    """Proficiency level required for a role-skill mapping."""
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class CareerPathStatus(str, enum.Enum):
    """Status of a career path."""
    active = "active"
    completed = "completed"
    paused = "paused"


class Role(Base):
    """A career role / job title with associated metadata."""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    seniority_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    avg_salary: Mapped[float | None] = mapped_column(Float, nullable=True)
    embedding = mapped_column(Vector(1536), nullable=True) if Vector else mapped_column(Text, nullable=True)
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
    role_skills: Mapped[list[RoleSkill]] = relationship(
        "RoleSkill", back_populates="role", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Role id={self.id} title={self.title!r}>"


class Skill(Base):
    """A technical or soft skill that can be mapped to roles and users."""

    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding = mapped_column(Vector(1536), nullable=True) if Vector else mapped_column(Text, nullable=True)
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

    def __repr__(self) -> str:
        return f"<Skill id={self.id} name={self.name!r}>"


class RoleSkill(Base):
    """Many-to-many mapping between roles and skills with proficiency & priority."""

    __tablename__ = "role_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    proficiency_needed: Mapped[ProficiencyNeeded] = mapped_column(
        Enum(ProficiencyNeeded, name="proficiency_needed_enum"),
        default=ProficiencyNeeded.intermediate,
        nullable=False,
    )
    priority: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
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
    role: Mapped[Role] = relationship("Role", back_populates="role_skills")
    skill: Mapped[Skill] = relationship("Skill", lazy="selectin")

    def __repr__(self) -> str:
        return f"<RoleSkill role_id={self.role_id} skill_id={self.skill_id}>"


class CareerPath(Base):
    """A user's career progression path toward a target role."""

    __tablename__ = "career_paths"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    target_role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[CareerPathStatus] = mapped_column(
        Enum(CareerPathStatus, name="career_path_status_enum"),
        default=CareerPathStatus.active,
        nullable=False,
    )
    skill_gap_analysis: Mapped[str | None] = mapped_column(Text, nullable=True)
    completion_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
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
    user: Mapped["User"] = relationship("User", back_populates="career_paths")  # noqa: F821
    target_role: Mapped[Role] = relationship("Role", lazy="selectin")

    def __repr__(self) -> str:
        return f"<CareerPath id={self.id} user_id={self.user_id} role_id={self.target_role_id}>"
