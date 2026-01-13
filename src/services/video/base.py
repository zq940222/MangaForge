"""
Base Video Generation Service Interface
"""
from abc import abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from src.services.base import BaseService, ServiceConfig, ServiceResult, ServiceType


class CameraMovement(str, Enum):
    """摄像机运动类型"""
    STATIC = "static"
    PAN_LEFT = "pan_left"
    PAN_RIGHT = "pan_right"
    PAN_UP = "pan_up"
    PAN_DOWN = "pan_down"
    ZOOM_IN = "zoom_in"
    ZOOM_OUT = "zoom_out"
    ROTATE_CW = "rotate_cw"
    ROTATE_CCW = "rotate_ccw"


@dataclass
class VideoGenerationRequest:
    """视频生成请求 (图生视频)"""
    image_path: str  # 输入图像路径或 base64
    prompt: str = ""  # 运动描述提示词
    negative_prompt: str = ""

    # 视频参数
    duration: float = 5.0  # 视频时长(秒)
    fps: int = 24
    width: int = 768
    height: int = 1344  # 默认 9:16 竖屏

    # 摄像机运动
    camera_movement: CameraMovement = CameraMovement.STATIC
    motion_intensity: float = 0.5  # 运动强度 0-1

    # 其他设置
    seed: int = -1
    settings: dict[str, Any] = field(default_factory=dict)


@dataclass
class VideoGenerationResult:
    """视频生成结果"""
    video_data: bytes  # 视频字节数据
    duration: float
    fps: int
    width: int
    height: int
    metadata: dict[str, Any] = field(default_factory=dict)


class BaseVideoService(BaseService):
    """视频生成服务基类"""

    service_type = ServiceType.VIDEO

    @abstractmethod
    async def generate(
        self,
        request: VideoGenerationRequest,
    ) -> ServiceResult:
        """
        生成视频 (图生视频)

        Args:
            request: 视频生成请求

        Returns:
            ServiceResult with VideoGenerationResult
        """
        pass

    @abstractmethod
    async def get_task_status(self, task_id: str) -> dict[str, Any]:
        """
        获取任务状态 (用于异步 API)

        Args:
            task_id: 任务 ID

        Returns:
            任务状态信息
        """
        pass

    async def image_to_video(
        self,
        image_path: str,
        motion_prompt: str = "",
        camera_movement: CameraMovement = CameraMovement.STATIC,
        duration: float = 5.0,
        aspect_ratio: str = "9:16",
    ) -> ServiceResult:
        """
        便捷方法：图片转视频

        Args:
            image_path: 图像路径
            motion_prompt: 运动描述
            camera_movement: 摄像机运动
            duration: 时长
            aspect_ratio: 宽高比

        Returns:
            ServiceResult with VideoGenerationResult
        """
        # 计算尺寸
        if aspect_ratio == "9:16":
            width, height = 768, 1344
        elif aspect_ratio == "16:9":
            width, height = 1344, 768
        else:
            width, height = 1024, 1024

        request = VideoGenerationRequest(
            image_path=image_path,
            prompt=motion_prompt,
            duration=duration,
            width=width,
            height=height,
            camera_movement=camera_movement,
        )
        return await self.generate(request)
