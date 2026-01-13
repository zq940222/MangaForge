"""
MangaForge Services Module - Pluggable AI Service Backends
"""
from .base import BaseService, ServiceConfig, ServiceResult
from .factory import ServiceFactory, get_service_factory

__all__ = [
    "BaseService",
    "ServiceConfig",
    "ServiceResult",
    "ServiceFactory",
    "get_service_factory",
]
