"""
Generation Schemas
"""
from typing import Any, Optional

from pydantic import BaseModel, Field


class GenerationRequest(BaseModel):
    """生成请求"""
    episode_id: str
    script_input: Optional[str] = None  # 如果提供，将更新 episode 的 script_input

    # 生成配置
    style: Optional[str] = Field(None, pattern="^(anime|manga|realistic|3d)$")
    add_subtitles: bool = True
    bgm_path: Optional[str] = None
    bgm_volume: float = Field(default=0.3, ge=0, le=1)

    # 重新生成选项
    regenerate_from: Optional[str] = Field(
        None,
        pattern="^(script|character|storyboard|render|video|voice|lipsync|edit)$",
        description="从指定阶段重新生成",
    )


class GenerationProgress(BaseModel):
    """生成进度"""
    stage: str
    progress: int  # 0-100
    message: str
    data: dict[str, Any] = Field(default_factory=dict)


class GenerationResponse(BaseModel):
    """生成响应"""
    task_id: str
    episode_id: str
    status: str  # pending / running / completed / failed
    message: str


class GenerationStatusResponse(BaseModel):
    """生成状态响应"""
    task_id: str
    episode_id: str
    status: str
    progress: int
    current_stage: Optional[str]
    message: str
    result: Optional[dict[str, Any]] = None
    error: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


class GenerationResultResponse(BaseModel):
    """生成结果响应"""
    success: bool
    episode_id: str
    video_path: Optional[str]
    video_url: Optional[str]  # 预签名 URL
    duration: Optional[int]
    stages: dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None
