"""
Episode Schemas
"""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class EpisodeCreate(BaseModel):
    """创建集请求"""
    episode_number: int = Field(..., ge=1)
    title: Optional[str] = Field(None, max_length=255)
    script_input: Optional[str] = None  # 用户输入的剧本/故事


class EpisodeUpdate(BaseModel):
    """更新集请求"""
    title: Optional[str] = Field(None, max_length=255)
    script_input: Optional[str] = None


class ShotResponse(BaseModel):
    """镜头响应"""
    id: str
    shot_number: int
    duration: float
    scene_description: Optional[str]
    camera_type: Optional[str]
    camera_movement: Optional[str]
    dialog: dict[str, Any]
    image_path: Optional[str]
    video_path: Optional[str]
    audio_path: Optional[str]
    lipsync_video_path: Optional[str]
    final_video_path: Optional[str]
    status: str

    class Config:
        from_attributes = True


class EpisodeResponse(BaseModel):
    """集响应"""
    id: str
    project_id: str
    episode_number: int
    title: Optional[str]
    script_input: Optional[str]
    script_parsed: Optional[dict[str, Any]] = None
    storyboard: Optional[Any] = None  # Can be list or dict
    status: str
    video_path: Optional[str]
    thumbnail_path: Optional[str]
    duration: Optional[int]
    extra_data: dict[str, Any] = Field(default_factory=dict, alias="metadata")
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

    # 关联数据
    shots_count: int = 0
    shots: list[ShotResponse] = []

    class Config:
        from_attributes = True
        populate_by_name = True
