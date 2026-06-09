"""Async SQLAlchemy engine, session factory, and FastAPI dependency.

Uses SQLAlchemy 2.0 async patterns with asyncpg driver.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from sqlalchemy.pool import NullPool
from fastapi import Request

from app.core.config import settings

# ── Engine & Session Factory ─────────────────────────────────────────
if "sqlite" in settings.DATABASE_URL:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
    )
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        poolclass=NullPool,
        connect_args={"statement_cache_size": 0},
    )

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Declarative Base ─────────────────────────────────────────────────
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


# ── FastAPI Dependency ───────────────────────────────────────────────
async def get_db(request: Request = None) -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session and ensure it is closed after use."""
    async with async_session_factory() as session:
        try:
            yield session
            if (request and request.method not in ("GET", "HEAD")) or session.new or session.dirty or session.deleted:
                await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
