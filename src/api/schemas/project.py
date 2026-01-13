"""
Project Schemas
"""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    """创建项目请求"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    style: str = Field(default="anime", pattern="^(anime|manga|realistic|3d)$")
    target_platform: str = Field(default="douyin", pattern="^(douyin|kuaishou|bilibili|youtube)$")
    aspect_ratio: str = Field(default="9:16", pattern="^(9:16|16:9|1:1)$")
    settings: dict[str, Any] = Field(default_factory=dict)


class ProjectUpdate(BaseModel):
    """更新项目请求"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    style: Optional[str] = Field(None, pattern="^(anime|manga|realistic|3d)$")
    target_platform: Optional[str] = Field(None, pattern="^(douyin|kuaishou|bilibili|youtube)$")
    aspect_ratio: Optional[str] = Field(None, pattern="^(9:16|16:9|1:1)$")
    settings: Optional[dict[str, Any]] = None


class ProjectResponse(BaseModel):
    """项目响应"""
    id: str
    user_id: str
    title: str
    description: Optional[str]
    style: str
    target_platform: str
    aspect_ratio: str
    status: str
    settings: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    # 关联数据统计
    episodes_count: int = 0
    characters_count: int = 0

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """项目列表响应"""
    items: list[ProjectResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
