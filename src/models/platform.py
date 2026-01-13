"""
Platform Account and Publishing Models
"""
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin


class PlatformAccount(Base, UUIDMixin, TimestampMixin):
    """用户关联的发布平台账号"""

    __tablename__ = "platform_accounts"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)

    # 平台类型: douyin / bilibili / kuaishou / wechat_channels / youtube
    platform: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # 平台账号名称 (显示用)
    account_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # 平台用户ID
    platform_user_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # OAuth tokens (加密存储)
    access_token_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    refresh_token_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Token 过期时间
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # 连接状态: connected / expired / disconnected / error
    status: Mapped[str] = mapped_column(String(20), default="disconnected")

    # 平台特定设置
    settings: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)

    # 是否启用自动发布
    auto_publish: Mapped[bool] = mapped_column(Boolean, default=False)

    # 关联的发布记录
    publish_records: Mapped[list["PublishRecord"]] = relationship(
        "PublishRecord", back_populates="platform_account", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<PlatformAccount(id={self.id}, platform={self.platform}, account={self.account_name})>"


class PublishRecord(Base, UUIDMixin, TimestampMixin):
    """发布记录"""

    __tablename__ = "publish_records"

    # 关联的平台账号
    platform_account_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("platform_accounts.id"), nullable=False, index=True
    )

    # 关联的 Episode
    episode_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("episodes.id"), nullable=False, index=True
    )

    # 发布状态: pending / publishing / published / failed / deleted
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)

    # 平台返回的视频ID
    platform_video_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # 平台视频URL
    platform_video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # 发布时使用的标题和描述
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 标签
    hashtags: Mapped[list[str]] = mapped_column(JSONB, default=list)

    # 发布设置 (如定时发布等)
    publish_settings: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)

    # 错误信息
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 发布时间
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # 关联
    platform_account: Mapped["PlatformAccount"] = relationship("PlatformAccount", back_populates="publish_records")

    def __repr__(self) -> str:
        return f"<PublishRecord(id={self.id}, status={self.status})>"
