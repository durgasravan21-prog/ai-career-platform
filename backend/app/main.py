"""FastAPI application entry point.

Creates the app, configures CORS, includes all routers,
and provides a startup event for table creation.
"""

from __future__ import annotations

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base

# Import all models so Base.metadata is fully populated
import app.models  # noqa: F401

# Import routers
# Import routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.career import router as career_router, router_root as career_root_router
from app.api.projects import router as projects_router
from app.api.mentors import router as mentors_router
from app.api.webhooks import router as webhooks_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: create tables on startup, cleanup on shutdown."""
    logger.info("Starting AI Career & Project Intelligence Platform...")
    try:
        async with engine.begin() as conn:
            if conn.dialect.name != "sqlite":
                from sqlalchemy import text
                try:
                    await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                except Exception as e:
                    logger.warning(f"Could not create vector extension: {e}. Assuming pre-installed.")
            # Create all tables if they don't exist (dev convenience).
            # In production, use Alembic migrations instead.
            await conn.run_sync(Base.metadata.create_all)
    except Exception as db_err:
        logger.error(f"Failed to connect/initialize database during lifespan startup: {db_err}")

    # Add new columns to tables dynamically in separate transactions (to prevent Postgres transaction aborts)
    from sqlalchemy import text
    alterations = [
        ("mentor_profiles", "original_price", "FLOAT"),
        ("mentor_profiles", "price_edited_by_admin", "BOOLEAN DEFAULT FALSE"),
        ("mentor_profiles", "has_premium_subscription", "BOOLEAN DEFAULT FALSE"),
        ("mentor_profiles", "video_calls_active", "BOOLEAN DEFAULT TRUE"),
        ("mentor_profiles", "upi_id", "VARCHAR(255)"),
        ("mentor_profiles", "is_visible", "BOOLEAN DEFAULT TRUE"),
        ("mentor_profiles", "agreement_pdf_path", "VARCHAR(500)"),
        ("mentor_profiles", "commission_paid_until", "TIMESTAMP"),
        ("mentor_reports", "reported_by", "VARCHAR(50) DEFAULT 'student'"),
        ("mentor_reports", "screenshot_url", "VARCHAR(500)"),
        ("mentor_reports", "appeal_message", "TEXT"),
        ("mentor_reports", "admin_message", "TEXT"),
        ("mentor_reports", "resolved_at", "TIMESTAMP"),
        ("mentor_sessions", "reminder_sent", "BOOLEAN DEFAULT FALSE"),
        ("mentor_sessions", "reminder_sent_at", "TIMESTAMP"),
        ("mentor_sessions", "payment_screenshot_url", "VARCHAR(500)"),
        ("mentor_sessions", "payment_amount_paid", "FLOAT"),
        ("mentor_sessions", "payment_status", "VARCHAR(50) DEFAULT 'unpaid'"),
        ("mentor_sessions", "payment_validation_error", "TEXT"),
        ("mentor_sessions", "raise_hand_active", "BOOLEAN DEFAULT FALSE"),
        ("mentor_sessions", "screen_sharing_active", "BOOLEAN DEFAULT FALSE"),
    ]

    for table, col, col_type in alterations:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                logger.info(f"Added column {col} to {table}.")
        except Exception:
            pass
    # Auto-seed database if it is empty (specifically, if no roles are seeded)
    try:
        from app.core.database import async_session_factory
        from sqlalchemy import select
        from app.models.career import Role
        async with async_session_factory() as session:
            result = await session.execute(select(Role).limit(1))
            first_role = result.fetchone()
            if not first_role:
                logger.info("No roles found in database. Auto-seeding default data...")
                from app.seed import run_seed
                run_seed()
                logger.info("Auto-seeding completed successfully!")
    except Exception as seed_err:
        logger.error(f"Auto-seeding check/execution failed: {seed_err}")

    logger.info("Database tables ensured.")

    # Launch the background AI project scraper (every 60 minutes)
    scraper_task = None
    is_vercel = os.environ.get("VERCEL") == "1" or os.environ.get("VERCEL_ENV")
    if not is_vercel:
        # Only run the continuous background loop in non-serverless environments
        try:
            from app.services.project_scraper import run_project_scraper_loop
            scraper_task = asyncio.create_task(run_project_scraper_loop())
            logger.info("Background project scraper task launched.")
        except Exception as scraper_err:
            logger.error(f"Failed to launch project scraper: {scraper_err}")

    yield

    # Cancel the scraper on shutdown
    if scraper_task and not scraper_task.done():
        scraper_task.cancel()
        try:
            await scraper_task
        except asyncio.CancelledError:
            pass

    logger.info("Shutting down...")
    await engine.dispose()


_is_production = os.environ.get("VERCEL") == "1" or os.environ.get("VERCEL_ENV")
root_path = "/_/backend" if _is_production else ""
app = FastAPI(
    title="AI Career & Project Intelligence Platform",
    description=(
        "AI-powered career coaching platform that analyses your skills, "
        "recommends projects, reviews your portfolio, and matches you "
        "with mentors — all through intelligent skill-gap analysis."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
    root_path=root_path,
)


# ── Global Exception Handlers (Security: sanitize DB errors) ─────────
from sqlalchemy.exc import SQLAlchemyError

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Catch all SQLAlchemy errors and return a sanitized response.

    Prevents table names, column names, and SQL tracebacks from leaking
    in production API responses.
    """
    logger.error(f"Database error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all handler to prevent any unhandled errors from leaking internals."""
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )

# ── CORS Middleware ───────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate Limiting Middleware ──────────────────────────────────────────
from app.core.rate_limit import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware)

# ── Register Routers (with /api/v1 prefix) ───────────────────────────
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(career_router, prefix="/api/v1")
app.include_router(career_root_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(mentors_router, prefix="/api/v1")
app.include_router(webhooks_router, prefix="/api/v1")

# ── Register Routers (without prefix) ────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(career_router)
app.include_router(career_root_router)
app.include_router(projects_router)
app.include_router(mentors_router)
app.include_router(webhooks_router)
# ── Mount Uploads Static Files ────────────────────────────────────────
from fastapi.staticfiles import StaticFiles
import os

uploads_dir = "/tmp/uploads" if (os.environ.get("VERCEL") == "1" or os.environ.get("VERCEL_ENV")) else "uploads"
try:
    os.makedirs(uploads_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
except Exception as e:
    logger.error(f"Failed to mount uploads directory: {e}")


# ── Root Endpoint ─────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root() -> dict:
    """Root endpoint returning API information and health status."""
    return {
        "name": "AI Career & Project Intelligence Platform",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "auth": "/auth",
            "users": "/users",
            "career": "/career",
            "projects": "/projects",
            "mentors": "/mentors",
            "webhooks": "/webhooks",
        },
    }


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Health-check endpoint for load balancers and monitoring."""
    return {"status": "healthy"}


from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast(self, session_id: str, message: str, sender_ws: WebSocket):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                if connection != sender_ws:
                    try:
                        await connection.send_text(message)
                    except Exception:
                        pass

manager = ConnectionManager()

@app.websocket("/ws/signal/{session_id}")
async def websocket_signal_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(session_id, data, websocket)
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
