"""
MangaForge API - Main Application Entry Point
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.settings import get_settings
from src.db.database import init_db, close_db
from src.db.redis import init_redis, close_redis

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    # Startup
    print(f"Starting {settings.app_name} v{settings.app_version}")

    # Initialize database connection pool
    await init_db()
    print("Database connection pool initialized")

    # Initialize Redis connection
    await init_redis()
    print("Redis connection initialized")

    # MinIO client is initialized on-demand via dependency injection

    yield

    # Shutdown
    print("Shutting down...")
    await close_db()
    await close_redis()
    print("Cleanup complete")


app = FastAPI(
    title=settings.app_name,
    description="AI-powered Manga/Comic Generation Agent System",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs" if settings.debug else "Disabled in production",
    }


# Import and include routers
from src.api.routes import projects, characters, episodes, generation, config
from src.api.websocket import progress as ws_progress

# API routes
app.include_router(projects.router, prefix=settings.api_prefix)
app.include_router(characters.router, prefix=settings.api_prefix)
app.include_router(episodes.router, prefix=settings.api_prefix)
app.include_router(generation.router, prefix=settings.api_prefix)
app.include_router(config.router, prefix=settings.api_prefix)

# WebSocket routes
app.include_router(ws_progress.router, prefix=settings.api_prefix)
