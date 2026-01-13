"""
Fish-Speech Service Implementation (Open Source Chinese TTS with Voice Cloning)
"""
import base64
from pathlib import Path
from typing import Any

import httpx

from src.services.base import ServiceConfig, ServiceResult
from .base import BaseVoiceService, VoiceGenerationRequest, VoiceGenerationResult


class FishSpeechService(BaseVoiceService):
    """Fish-Speech 语音生成服务实现"""

    provider = "fish-speech"

    def __init__(self, config: ServiceConfig):
        super().__init__(config)
        self.base_url = config.endpoint or "http://localhost:8080"
        self.timeout = config.settings.get("timeout", 120)

    async def health_check(self) -> bool:
        """检查服务是否可用"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/health",
                    timeout=10,
                )
                return response.status_code == 200
        except Exception:
            return False

    async def get_models(self) -> list[str]:
        """获取可用模型列表"""
        return ["fish-speech-1.4", "fish-speech-1.5"]

    async def get_voices(self) -> list[dict[str, Any]]:
        """获取可用声音列表 (预设声音)"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v1/voices",
                    timeout=10,
                )
                if response.status_code == 200:
                    return response.json().get("voices", [])
                return []
        except Exception:
            return []

    async def generate(
        self,
        request: VoiceGenerationRequest,
    ) -> ServiceResult:
        """生成语音"""
        try:
            # 构建请求
            payload = {
                "text": request.text,
                "format": request.format,
                "speed": request.speed,
            }

            # 如果有参考音频，添加到请求
            if request.reference_audio:
                ref_audio_base64 = await self._load_audio(request.reference_audio)
                if ref_audio_base64:
                    payload["reference_audio"] = ref_audio_base64

            # 如果有声音 ID
            if request.voice_id:
                payload["voice_id"] = request.voice_id

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/v1/tts",
                    json=payload,
                )

                if response.status_code != 200:
                    return ServiceResult.fail(f"API error: {response.text}")

                # 检查响应类型
                content_type = response.headers.get("content-type", "")

                if "audio" in content_type:
                    # 直接返回音频数据
                    audio_data = response.content
                else:
                    # JSON 响应，可能包含 base64 音频
                    data = response.json()
                    audio_base64 = data.get("audio")
                    if audio_base64:
                        audio_data = base64.b64decode(audio_base64)
                    else:
                        return ServiceResult.fail("No audio in response")

                # 估算时长
                duration = self._estimate_duration(len(audio_data), request.format)

                result = VoiceGenerationResult(
                    audio_data=audio_data,
                    duration=duration,
                    format=request.format,
                    sample_rate=request.sample_rate,
                    metadata={},
                )

                return ServiceResult.ok(result)

        except httpx.TimeoutException:
            return ServiceResult.fail("Request timeout")
        except Exception as e:
            return ServiceResult.fail(f"Generation failed: {e}")

    async def _load_audio(self, audio_path: str) -> str | None:
        """加载并编码音频"""
        try:
            # 如果已经是 base64
            if audio_path.startswith("data:audio"):
                return audio_path.split(",")[1]

            # 从文件读取
            path = Path(audio_path)
            if path.exists():
                with open(path, "rb") as f:
                    return base64.b64encode(f.read()).decode("utf-8")

            # 可能是 URL
            if audio_path.startswith("http"):
                async with httpx.AsyncClient() as client:
                    response = await client.get(audio_path)
                    if response.status_code == 200:
                        return base64.b64encode(response.content).decode("utf-8")

            return None
        except Exception:
            return None

    def _estimate_duration(self, size_bytes: int, format: str) -> float:
        """估算音频时长"""
        # 根据格式估算比特率
        bitrate_map = {
            "wav": 768000,  # 48kHz * 16bit
            "mp3": 128000,  # 128kbps
            "ogg": 96000,   # 96kbps
        }
        bitrate = bitrate_map.get(format, 128000)
        return size_bytes * 8 / bitrate
