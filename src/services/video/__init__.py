"""
Video Generation Service Module
"""
from .base import BaseVideoService, VideoGenerationRequest, VideoGenerationResult
from .kling_service import KlingService

__all__ = [
    "BaseVideoService",
    "VideoGenerationRequest",
    "VideoGenerationResult",
    "KlingService",
]
