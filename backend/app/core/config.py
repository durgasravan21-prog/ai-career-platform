"""Application configuration using Pydantic Settings.

Reads from environment variables and .env files. All sensitive values
are loaded from env vars — never hardcoded.
"""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the AI Career & Project Intelligence Platform."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_career"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/ai_career"

    # ── Security ──────────────────────────────────────────────────────
    BACKEND_SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    SUPABASE_JWT_SECRET: str = "super-secret-jwt-token-with-at-least-32-characters"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── CORS ──────────────────────────────────────────────────────────
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,https://frontend-xi-eight-13.vercel.app,https://frontend-m7zommubw-durgasravan21-5868s-projects.vercel.app"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse the comma-separated CORS origins string into a list."""
        return [
            origin.strip()
            for origin in self.BACKEND_CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    # ── External APIs ─────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GITHUB_TOKEN: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        import os
        if os.environ.get("VERCEL") == "1" or os.environ.get("VERCEL_ENV"):
            env_db_url = os.environ.get("DATABASE_URL")
            if env_db_url and "sqlite" not in env_db_url and "localhost" not in env_db_url and "127.0.0.1" not in env_db_url:
                self.DATABASE_URL = env_db_url
                self.DATABASE_URL_SYNC = env_db_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
            else:
                self.DATABASE_URL = "sqlite+aiosqlite:////tmp/ai_career.db"
                self.DATABASE_URL_SYNC = "sqlite:////tmp/ai_career.db"



settings = Settings()
