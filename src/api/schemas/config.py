"""
Config Schemas
"""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class UserConfigCreate(BaseModel):
    """创建用户配置请求"""
    service_type: str = Field(..., pattern="^(llm|video|voice|image|lipsync)$")
    provider: str = Field(..., min_length=1, max_length=50)
    api_key: Optional[str] = None
    endpoint: Optional[str] = None
    model: Optional[str] = None
    settings: dict[str, Any] = Field(default_factory=dict)
    priority: int = Field(default=0)


class UserConfigUpdate(BaseModel):
    """更新用户配置请求"""
    api_key: Optional[str] = None
    endpoint: Optional[str] = None
    model: Optional[str] = None
    settings: Optional[dict[str, Any]] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None


class UserConfigResponse(BaseModel):
    """用户配置响应"""
    id: str
    user_id: str
    service_type: str
    provider: str
    endpoint: Optional[str]
    model: Optional[str]
    settings: dict[str, Any]
    is_active: bool
    priority: int
    created_at: datetime
    updated_at: datetime

    # 不返回 API Key，只返回是否已配置
    has_api_key: bool = False

    class Config:
        from_attributes = True


class ProviderInfo(BaseModel):
    """服务商信息"""
    id: str
    service_type: str
    name: str
    description: Optional[str]
    is_local: bool
    requires_gpu: bool
    default_endpoint: Optional[str]
    config_schema: dict[str, Any] = Field(default_factory=dict)


class TestConnectionRequest(BaseModel):
    """测试连接请求"""
    service_type: str
    provider: str
    api_key: Optional[str] = None
    endpoint: Optional[str] = None
    model: Optional[str] = None


class TestConnectionResponse(BaseModel):
    """测试连接响应"""
    success: bool
    message: str
    available_models: list[str] = Field(default_factory=list)
