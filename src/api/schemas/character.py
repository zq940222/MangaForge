"""
Character Schemas
"""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class CharacterCreate(BaseModel):
    """创建角色请求"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    age_range: Optional[str] = None
    personality: Optional[str] = None
    voice_style: Optional[str] = None


class CharacterUpdate(BaseModel):
    """更新角色请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    age_range: Optional[str] = None
    personality: Optional[str] = None
    voice_style: Optional[str] = None
    voice_sample_path: Optional[str] = None
    voice_settings: Optional[dict[str, Any]] = None


class CharacterResponse(BaseModel):
    """角色响应"""
    id: str
    project_id: str
    name: str
    description: Optional[str]
    gender: Optional[str]
    age_range: Optional[str]
    personality: Optional[str]
    reference_images: Optional[list[str]]
    voice_sample_path: Optional[str]
    voice_settings: dict[str, Any]
    lora_path: Optional[str]
    ip_adapter_embedding: Optional[str]
    trigger_word: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
