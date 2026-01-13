"""
Base Voice/TTS Service Interface
"""
from abc import abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional

from src.services.base import BaseService, ServiceConfig, ServiceResult, ServiceType


@dataclass
class VoiceGenerationRequest:
    """语音生成请求"""
    text: str  # 要转换的文本
    voice_id: Optional[str] = None  # 声音 ID
    reference_audio: Optional[str] = None  # 参考音频路径 (用于声音克隆)

    # 语音参数
    speed: float = 1.0  # 语速
    pitch: float = 1.0  # 音调
    volume: float = 1.0  # 音量

    # 情感
    emotion: Optional[str] = None  # happy / sad / angry / neutral

    # 输出格式
    format: str = "wav"  # wav / mp3 / ogg
    sample_rate: int = 24000

    # 其他设置
    settings: dict[str, Any] = field(default_factory=dict)


@dataclass
class VoiceGenerationResult:
    """语音生成结果"""
    audio_data: bytes  # 音频字节数据
    duration: float  # 音频时长(秒)
    format: str
    sample_rate: int
    metadata: dict[str, Any] = field(default_factory=dict)


class BaseVoiceService(BaseService):
    """语音生成服务基类"""

    service_type = ServiceType.VOICE

    @abstractmethod
    async def generate(
        self,
        request: VoiceGenerationRequest,
    ) -> ServiceResult:
        """
        生成语音

        Args:
            request: 语音生成请求

        Returns:
            ServiceResult with VoiceGenerationResult
        """
        pass

    @abstractmethod
    async def get_voices(self) -> list[dict[str, Any]]:
        """获取可用声音列表"""
        pass

    async def clone_voice(
        self,
        reference_audio: str,
        text: str,
        **kwargs,
    ) -> ServiceResult:
        """
        克隆声音并生成语音

        Args:
            reference_audio: 参考音频路径
            text: 要生成的文本
            **kwargs: 其他参数

        Returns:
            ServiceResult with VoiceGenerationResult
        """
        request = VoiceGenerationRequest(
            text=text,
            reference_audio=reference_audio,
            **kwargs,
        )
        return await self.generate(request)

    async def text_to_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        speed: float = 1.0,
        emotion: Optional[str] = None,
    ) -> ServiceResult:
        """
        便捷方法：文本转语音

        Args:
            text: 文本
            voice_id: 声音 ID
            speed: 语速
            emotion: 情感

        Returns:
            ServiceResult with VoiceGenerationResult
        """
        request = VoiceGenerationRequest(
            text=text,
            voice_id=voice_id,
            speed=speed,
            emotion=emotion,
        )
        return await self.generate(request)
