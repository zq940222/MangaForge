"""
Base Lip Sync Service Interface
"""
from abc import abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional

from src.services.base import BaseService, ServiceConfig, ServiceResult, ServiceType


@dataclass
class LipsyncRequest:
    """口型同步请求"""
    image_path: str  # 人脸图像路径
    audio_path: str  # 音频路径

    # 输出参数
    fps: int = 25
    output_format: str = "mp4"

    # 增强选项
    enhance_face: bool = True  # 人脸增强
    still_mode: bool = False  # 静止模式 (只有嘴动)
    preprocess: str = "crop"  # crop / resize / full

    # 表情控制
    expression_scale: float = 1.0  # 表情强度
    pose_style: int = 0  # 姿态风格

    # 其他设置
    settings: dict[str, Any] = field(default_factory=dict)


@dataclass
class LipsyncResult:
    """口型同步结果"""
    video_data: bytes  # 视频字节数据
    duration: float
    fps: int
    metadata: dict[str, Any] = field(default_factory=dict)


class BaseLipsyncService(BaseService):
    """口型同步服务基类"""

    service_type = ServiceType.LIPSYNC

    @abstractmethod
    async def generate(
        self,
        request: LipsyncRequest,
    ) -> ServiceResult:
        """
        生成口型同步视频

        Args:
            request: 口型同步请求

        Returns:
            ServiceResult with LipsyncResult
        """
        pass

    async def sync_lipsync(
        self,
        image_path: str,
        audio_path: str,
        enhance: bool = True,
    ) -> ServiceResult:
        """
        便捷方法：生成口型同步视频

        Args:
            image_path: 人脸图像路径
            audio_path: 音频路径
            enhance: 是否增强

        Returns:
            ServiceResult with LipsyncResult
        """
        request = LipsyncRequest(
            image_path=image_path,
            audio_path=audio_path,
            enhance_face=enhance,
        )
        return await self.generate(request)
