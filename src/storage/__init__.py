"""
MangaForge Storage Module
"""
from .minio_client import (
    MinioStorage,
    get_storage,
    init_storage,
)

__all__ = [
    "MinioStorage",
    "get_storage",
    "init_storage",
]
