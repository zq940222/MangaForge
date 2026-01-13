"""
SadTalker Lip Sync Service Implementation
"""
import asyncio
import base64
from pathlib import Path
from typing import Any

import httpx

from src.services.base import ServiceConfig, ServiceResult
from .base import BaseLipsyncService, LipsyncRequest, LipsyncResult


class SadTalkerService(BaseLipsyncService):
    """SadTalker 口型同步服务实现"""

    provider = "sadtalker"

    def __init__(self, config: ServiceConfig):
        super().__init__(config)
        self.base_url = config.endpoint or "http://localhost:7860"
        self.timeout = config.settings.get("timeout", 300)
        self.poll_interval = config.settings.get("poll_interval", 2)

    async def health_check(self) -> bool:
        """检查服务是否可用"""
        try:
            async with httpx.AsyncClient() as client:
                # Gradio 应用健康检查
                response = await client.get(
                    f"{self.base_url}/info",
                    timeout=10,
                )
                return response.status_code == 200
        except Exception:
            return False

    async def get_models(self) -> list[str]:
        """获取可用模型列表"""
        return ["sadtalker", "sadtalker-v2"]

    async def generate(
        self,
        request: LipsyncRequest,
    ) -> ServiceResult:
        """生成口型同步视频"""
        try:
            # 加载图像和音频
            image_data = await self._load_file(request.image_path)
            audio_data = await self._load_file(request.audio_path)

            if not image_data:
                return ServiceResult.fail("Failed to load image")
            if not audio_data:
                return ServiceResult.fail("Failed to load audio")

            # 构建 Gradio API 请求
            # SadTalker Gradio 接口参数
            payload = {
                "data": [
                    f"data:image/png;base64,{base64.b64encode(image_data).decode()}",
                    f"data:audio/wav;base64,{base64.b64encode(audio_data).decode()}",
                    request.preprocess,  # preprocess
                    request.still_mode,  # still mode
                    request.enhance_face,  # face enhancer
                    0,  # batch size (not used in single mode)
                    "crop",  # size
                    request.pose_style,  # pose style
                    request.expression_scale,  # expression scale
                    True,  # use ref video
                    None,  # ref video
                    None,  # ref info
                    True,  # use idle mode
                    5,  # length of idle animation
                    False,  # use eye blink
                    False,  # use pose shift
                ]
            }

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # 调用 Gradio API
                response = await client.post(
                    f"{self.base_url}/api/predict",
                    json=payload,
                )

                if response.status_code != 200:
                    # 尝试队列模式
                    result = await self._call_gradio_queue(client, payload)
                    if not result:
                        return ServiceResult.fail(f"API error: {response.text}")
                    video_url = result
                else:
                    data = response.json()
                    # 获取输出视频
                    outputs = data.get("data", [])
                    if not outputs:
                        return ServiceResult.fail("No output from SadTalker")

                    video_url = outputs[0]  # 第一个输出是视频

                # 下载视频
                video_data = await self._download_result(client, video_url)

                if not video_data:
                    return ServiceResult.fail("Failed to download result video")

                result = LipsyncResult(
                    video_data=video_data,
                    duration=0,  # 需要从视频中提取
                    fps=request.fps,
                    metadata={"source": "sadtalker"},
                )

                return ServiceResult.ok(result)

        except httpx.TimeoutException:
            return ServiceResult.fail("Request timeout")
        except Exception as e:
            return ServiceResult.fail(f"Generation failed: {e}")

    async def _call_gradio_queue(
        self,
        client: httpx.AsyncClient,
        payload: dict[str, Any],
    ) -> str | None:
        """通过 Gradio 队列模式调用"""
        try:
            # 加入队列
            join_response = await client.post(
                f"{self.base_url}/queue/join",
                json=payload,
            )

            if join_response.status_code != 200:
                return None

            join_data = join_response.json()
            event_id = join_data.get("event_id")

            if not event_id:
                return None

            # 轮询结果
            for _ in range(int(self.timeout / self.poll_interval)):
                status_response = await client.post(
                    f"{self.base_url}/queue/status",
                    json={"event_id": event_id},
                )

                if status_response.status_code == 200:
                    status_data = status_response.json()
                    if status_data.get("status") == "complete":
                        outputs = status_data.get("data", {}).get("data", [])
                        if outputs:
                            return outputs[0]
                    elif status_data.get("status") == "error":
                        return None

                await asyncio.sleep(self.poll_interval)

            return None

        except Exception:
            return None

    async def _load_file(self, file_path: str) -> bytes | None:
        """加载文件"""
        try:
            # 如果是 base64
            if file_path.startswith("data:"):
                parts = file_path.split(",")
                if len(parts) > 1:
                    return base64.b64decode(parts[1])
                return None

            # 从文件读取
            path = Path(file_path)
            if path.exists():
                with open(path, "rb") as f:
                    return f.read()

            # 从 URL 下载
            if file_path.startswith("http"):
                async with httpx.AsyncClient() as client:
                    response = await client.get(file_path, timeout=30)
                    if response.status_code == 200:
                        return response.content

            return None
        except Exception:
            return None

    async def _download_result(
        self,
        client: httpx.AsyncClient,
        url_or_data: str,
    ) -> bytes | None:
        """下载结果"""
        try:
            # 如果是 base64 数据
            if url_or_data.startswith("data:"):
                parts = url_or_data.split(",")
                if len(parts) > 1:
                    return base64.b64decode(parts[1])
                return None

            # 如果是相对路径，构建完整 URL
            if url_or_data.startswith("/"):
                url = f"{self.base_url}{url_or_data}"
            elif not url_or_data.startswith("http"):
                url = f"{self.base_url}/file={url_or_data}"
            else:
                url = url_or_data

            response = await client.get(url, timeout=60)
            if response.status_code == 200:
                return response.content

            return None
        except Exception:
            return None
