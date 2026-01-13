"""
User API Configuration Models
"""
from typing import Any, Optional

from sqlalchemy import String, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, UUIDMixin


class UserApiConfig(Base, UUIDMixin, TimestampMixin):
    """用户自行配置的 AI 服务 API Key"""

    __tablename__ = "user_api_configs"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)

    # 服务类型: llm / video / voice / image / lipsync
    service_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # 提供商: openai / anthropic / kling / hunyuan / fish-speech 等
    provider: Mapped[str] = mapped_column(String(50), nullable=False)

    # API Key (加密存储)
    api_key_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 自定义端点 (如本地部署)
    endpoint: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # 选用的模型
    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # 其他设置
    settings: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)

    # 是否启用
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # 优先级 (用于降级，越大越优先)
    priority: Mapped[int] = mapped_column(Integer, default=0)

    def __repr__(self) -> str:
        return f"<UserApiConfig(id={self.id}, service={self.service_type}, provider={self.provider})>"


class SupportedProvider(Base):
    """系统支持的服务商配置"""

    __tablename__ = "supported_providers"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    service_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 是否本地部署
    is_local: Mapped[bool] = mapped_column(Boolean, default=False)

    # 是否需要 GPU
    requires_gpu: Mapped[bool] = mapped_column(Boolean, default=False)

    # 默认端点
    default_endpoint: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # 配置 schema (用于前端动态生成表单)
    config_schema: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)

    def __repr__(self) -> str:
        return f"<SupportedProvider(id={self.id}, name={self.name})>"
