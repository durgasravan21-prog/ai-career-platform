"""SQLAlchemy ORM models – MentorProfile, MentorAvailability, MentorSession, Review (Phase 3)."""

from __future__ import annotations

import enum
from datetime import datetime, time, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    Vector = None  # type: ignore[assignment, misc]


class SessionStatus(str, enum.Enum):
    """Status of a mentoring session."""
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


class MentorProfile(Base):
    """A mentor's public profile with expertise and pricing."""

    __tablename__ = "mentor_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    expertise: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    hourly_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_sessions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    expertise_embedding = (
        mapped_column(Vector(1536), nullable=True)
        if Vector
        else mapped_column(Text, nullable=True)
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Verification and Application Flow
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    linkedin_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    github_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    corporate_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    corporate_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    selfie_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    identity_document_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    signed_agreement: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    signature_svg_or_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

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
    user: Mapped["User"] = relationship("User", lazy="selectin")  # noqa: F821
    availability: Mapped[list[MentorAvailability]] = relationship(
        "MentorAvailability", back_populates="mentor", lazy="selectin"
    )
    sessions: Mapped[list[MentorSession]] = relationship(
        "MentorSession", back_populates="mentor", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<MentorProfile id={self.id} user_id={self.user_id}>"


class MentorAvailability(Base):
    """Weekly availability slots for a mentor."""

    __tablename__ = "mentor_availability"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mentor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("mentor_profiles.id", ondelete="CASCADE"), nullable=False
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
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
    mentor: Mapped[MentorProfile] = relationship("MentorProfile", back_populates="availability")

    def __repr__(self) -> str:
        return f"<MentorAvailability id={self.id} mentor_id={self.mentor_id} day={self.day_of_week}>"


class MentorSession(Base):
    """A booked mentoring session between a student and a mentor."""

    __tablename__ = "mentor_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    mentor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("mentor_profiles.id", ondelete="CASCADE"), nullable=False
    )
    project_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus, name="session_status_enum"),
        default=SessionStatus.pending,
        nullable=False,
    )
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
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
    student: Mapped["User"] = relationship("User", lazy="selectin")  # noqa: F821
    mentor: Mapped[MentorProfile] = relationship("MentorProfile", back_populates="sessions")
    project: Mapped["Project | None"] = relationship("Project", lazy="selectin")  # noqa: F821
    reviews: Mapped[list[Review]] = relationship(
        "Review", back_populates="session", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<MentorSession id={self.id} student_id={self.student_id} mentor_id={self.mentor_id}>"


class Review(Base):
    """A review left after a mentoring session."""

    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("mentor_sessions.id", ondelete="CASCADE"), nullable=False
    )
    reviewer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
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
    session: Mapped[MentorSession] = relationship("MentorSession", back_populates="reviews")
    reviewer: Mapped["User"] = relationship("User", lazy="selectin")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Review id={self.id} session_id={self.session_id} rating={self.rating}>"


class MentorReport(Base):
    """A report submitted by a student regarding a mentor's behavior or session."""

    __tablename__ = "mentor_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mentor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("mentor_profiles.id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False) # pending, resolved
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    mentor: Mapped[MentorProfile] = relationship("MentorProfile", lazy="selectin")
    student: Mapped["User"] = relationship("User", lazy="selectin")  # noqa: F821

    def __repr__(self) -> str:
        return f"<MentorReport id={self.id} mentor_id={self.mentor_id} student_id={self.student_id}>"
