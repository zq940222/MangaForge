"""
Platform Schemas - 发布平台相关
"""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# =============================================
# Platform Account Schemas
# =============================================

class PlatformAccountCreate(BaseModel):
    """创建平台账号"""
    platform: str = Field(..., pattern="^(douyin|bilibili|kuaishou|wechat_channels|youtube)$")
    account_name: str = Field(..., min_length=1, max_length=100)
    platform_user_id: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    settings: dict[str, Any] = Field(default_factory=dict)


class PlatformAccountUpdate(BaseModel):
    """更新平台账号"""
    account_name: Optional[str] = Field(None, min_length=1, max_length=100)
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    status: Optional[str] = Field(None, pattern="^(connected|expired|disconnected|error)$")
    settings: Optional[dict[str, Any]] = None
    auto_publish: Optional[bool] = None


class PlatformAccountResponse(BaseModel):
    """平台账号响应"""
    id: str
    user_id: str
    platform: str
    account_name: str
    platform_user_id: Optional[str]
    status: str
    settings: dict[str, Any]
    auto_publish: bool
    token_expires_at: Optional[datetime]
    has_access_token: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlatformInfo(BaseModel):
    """平台信息"""
    id: str
    name: str
    icon: str
    color: str
    supports_scheduling: bool = False
    supports_hashtags: bool = True
    supports_subtitles: bool = True
    max_video_duration: int = 300  # 秒
    max_title_length: int = 100
    max_description_length: int = 2000


# =============================================
# Publishing Schemas
# =============================================

class PublishRequest(BaseModel):
    """发布请求"""
    episode_id: str
    platform_account_ids: list[str] = Field(..., min_length=1)
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    hashtags: list[str] = Field(default_factory=list)
    scheduled_at: Optional[datetime] = None
    settings: dict[str, Any] = Field(default_factory=dict)


class PublishRecordResponse(BaseModel):
    """发布记录响应"""
    id: str
    platform_account_id: str
    episode_id: str
    status: str
    platform_video_id: Optional[str]
    platform_video_url: Optional[str]
    title: str
    description: Optional[str]
    hashtags: list[str]
    publish_settings: dict[str, Any]
    error_message: Optional[str]
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    # 额外的平台信息
    platform: Optional[str] = None
    account_name: Optional[str] = None

    class Config:
        from_attributes = True


class PublishStatusResponse(BaseModel):
    """发布状态响应"""
    total: int
    published: int
    pending: int
    failed: int
    records: list[PublishRecordResponse]


class BatchPublishResponse(BaseModel):
    """批量发布响应"""
    success: bool
    message: str
    records: list[PublishRecordResponse]
