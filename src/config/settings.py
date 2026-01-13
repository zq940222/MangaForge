"""
MangaForge Configuration Settings
"""
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignore extra fields from .env
    )

    # ===========================================
    # Application
    # ===========================================
    app_name: str = "MangaForge"
    app_version: str = "1.0.0"
    env: Literal["development", "production", "testing"] = "development"
    debug: bool = False
    secret_key: str = "your-secret-key-change-in-production"

    # ===========================================
    # API
    # ===========================================
    api_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000,http://localhost:8000"

    # ===========================================
    # Database
    # ===========================================
    database_url: str = "postgresql://mangaforge:mangaforge_dev@localhost:5432/mangaforge_dev"
    db_pool_size: int = 5
    db_max_overflow: int = 10

    # ===========================================
    # Redis
    # ===========================================
    redis_url: str = "redis://localhost:6379/0"

    # ===========================================
    # MinIO
    # ===========================================
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_secure: bool = False
    minio_bucket: str = "mangaforge"

    # ===========================================
    # RabbitMQ
    # ===========================================
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"

    # ===========================================
    # ComfyUI
    # ===========================================
    comfyui_url: str = "http://localhost:8188"
    comfyui_timeout: int = 300

    # ===========================================
    # LLM Configuration
    # ===========================================
    llm_provider: Literal["openai", "anthropic", "local"] = "anthropic"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    openai_model: str = "gpt-4-turbo-preview"
    anthropic_model: str = "claude-3-5-sonnet-20241022"
    local_llm_url: str = "http://localhost:11434"
    local_llm_model: str = "llama3"

    # ===========================================
    # Image Generation
    # ===========================================
    default_image_width: int = 1024
    default_image_height: int = 1024
    default_style: str = "manga"

    # ===========================================
    # Task Queue
    # ===========================================
    celery_broker_url: str = "amqp://guest:guest@localhost:5672/"
    celery_result_backend: str = "redis://localhost:6379/1"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
