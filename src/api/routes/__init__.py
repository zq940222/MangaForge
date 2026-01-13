"""
API Routes Module
"""
from .projects import router as projects_router
from .characters import router as characters_router
from .episodes import router as episodes_router
from .generation import router as generation_router
from .config import router as config_router
from .platforms import router as platforms_router

__all__ = [
    "projects_router",
    "characters_router",
    "episodes_router",
    "generation_router",
    "config_router",
    "platforms_router",
]
