"""Models package – imports all ORM models so Alembic and Base.metadata see them."""

from app.models.user import User, UserProfile, UserSkill  # noqa: F401
from app.models.career import Role, Skill, RoleSkill, CareerPath  # noqa: F401
from app.models.project import Project, ProjectSkill, UserProject, Recommendation  # noqa: F401
from app.models.mentor import MentorProfile, MentorAvailability, MentorSession, Review  # noqa: F401
