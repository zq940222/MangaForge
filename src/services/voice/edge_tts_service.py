"""
Edge TTS Service Implementation (Free Microsoft TTS)
"""
import io
from typing import Any

import edge_tts

from src.services.base import ServiceConfig, ServiceResult
from .base import BaseVoiceService, VoiceGenerationRequest, VoiceGenerationResult


class EdgeTTSService(BaseVoiceService):
    """Edge TTS 服务实现 (微软免费 TTS)"""

    provider = "edge-tts"

    # 常用中文声音
    DEFAULT_VOICES = {
        "zh-CN-XiaoxiaoNeural": "晓晓 (女声，温柔)",
        "zh-CN-YunxiNeural": "云希 (男声，阳光)",
        "zh-CN-YunjianNeural": "云健 (男声，沉稳)",
        "zh-CN-XiaoyiNeural": "晓伊 (女声，活泼)",
        "zh-CN-YunyangNeural": "云扬 (男声，新闻)",
        "zh-CN-XiaochenNeural": "晓辰 (女声，温暖)",
        "zh-CN-XiaohanNeural": "晓涵 (女声，知性)",
        "zh-CN-XiaomengNeural": "晓梦 (女声，甜美)",
        "zh-CN-XiaomoNeural": "晓墨 (女声，优雅)",
        "zh-CN-XiaoqiuNeural": "晓秋 (女声，成熟)",
        "zh-CN-XiaoruiNeural": "晓睿 (女声，专业)",
        "zh-CN-XiaoshuangNeural": "晓双 (女声，儿童)",
        "zh-CN-XiaoxuanNeural": "晓萱 (女声，活力)",
        "zh-CN-XiaoyanNeural": "晓颜 (女声，温柔)",
        "zh-CN-XiaoyouNeural": "晓悠 (女声，儿童)",
        "zh-CN-YunfengNeural": "云枫 (男声，磁性)",
        "zh-CN-YunhaoNeural": "云皓 (男声，清澈)",
        "zh-CN-YunxiaNeural": "云夏 (男声，少年)",
        "zh-CN-YunyeNeural": "云野 (男声，故事)",
        "zh-CN-YunzeNeural": "云泽 (男声，纪录片)",
    }

    def __init__(self, config: ServiceConfig):
        super().__init__(config)
        self.default_voice = config.settings.get("default_voice", "zh-CN-XiaoxiaoNeural")

    async def health_check(self) -> bool:
        """检查服务是否可用"""
        try:
            voices = await edge_tts.list_voices()
            return len(voices) > 0
        except Exception:
            return False

    async def get_models(self) -> list[str]:
        """获取可用模型列表"""
        return ["edge-tts"]

    async def get_voices(self) -> list[dict[str, Any]]:
        """获取可用声音列表"""
        try:
            voices = await edge_tts.list_voices()
            return [
                {
                    "id": v["ShortName"],
                    "name": v["ShortName"],
                    "gender": v.get("Gender", "Unknown"),
                    "locale": v.get("Locale", ""),
                    "description": self.DEFAULT_VOICES.get(v["ShortName"], ""),
                }
                for v in voices
                if v.get("Locale", "").startswith("zh")  # 只返回中文
            ]
        except Exception:
            return [
                {"id": k, "name": k, "description": v}
                for k, v in self.DEFAULT_VOICES.items()
            ]

    async def generate(
        self,
        request: VoiceGenerationRequest,
    ) -> ServiceResult:
        """生成语音"""
        try:
            voice = request.voice_id or self.default_voice

            # 构建速率字符串
            rate = f"{int((request.speed - 1) * 100):+d}%"
            pitch = f"{int((request.pitch - 1) * 50):+d}Hz"
            volume = f"{int((request.volume - 1) * 100):+d}%"

            # 创建通信对象
            communicate = edge_tts.Communicate(
                text=request.text,
                voice=voice,
                rate=rate,
                pitch=pitch,
                volume=volume,
            )

            # 生成音频
            audio_buffer = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_buffer.write(chunk["data"])

            audio_data = audio_buffer.getvalue()

            if not audio_data:
                return ServiceResult.fail("No audio generated")

            # 估算时长 (mp3 格式，假设 128kbps)
            duration = len(audio_data) / (128 * 1024 / 8)

            result = VoiceGenerationResult(
                audio_data=audio_data,
                duration=duration,
                format="mp3",
                sample_rate=24000,
                metadata={"voice": voice},
            )

            return ServiceResult.ok(result)

        except Exception as e:
            return ServiceResult.fail(f"Generation failed: {e}")
