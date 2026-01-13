"""
Kling (可灵) Video Generation Service Implementation
"""
import asyncio
import base64
from pathlib import Path
from typing import Any

import httpx

from src.services.base import ServiceConfig, ServiceResult
from .base import BaseVideoService, VideoGenerationRequest, VideoGenerationResult


class KlingService(BaseVideoService):
    """可灵 Kling 视频生成服务实现"""

    provider = "kling"

    # API 端点
    API_BASE = "https://api.klingai.com"
    API_VERSION = "v1"

    def __init__(self, config: ServiceConfig):
        super().__init__(config)
        self.api_key = config.api_key
        self.timeout = config.settings.get("timeout", 600)
        self.poll_interval = config.settings.get("poll_interval", 5)

    def _get_headers(self) -> dict[str, str]:
        """获取请求头"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def health_check(self) -> bool:
        """检查服务是否可用"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.API_BASE}/{self.API_VERSION}/account/info",
                    headers=self._get_headers(),
                    timeout=10,
                )
                return response.status_code == 200
        except Exception:
            return False

    async def get_models(self) -> list[str]:
        """获取可用模型列表"""
        return [
            "kling-v1",
            "kling-v1.5",
            "kling-v2.0",
            "kling-v2.1",
        ]

    async def generate(
        self,
        request: VideoGenerationRequest,
    ) -> ServiceResult:
        """生成视频"""
        try:
            # 读取并编码图像
            image_base64 = await self._load_image(request.image_path)
            if not image_base64:
                return ServiceResult.fail("Failed to load image")

            # 构建请求参数
            payload = {
                "model": "kling-v2.1",
                "image": image_base64,
                "prompt": request.prompt,
                "negative_prompt": request.negative_prompt,
                "duration": min(request.duration, 10),  # 可灵最长 10 秒
                "mode": "std",  # std / pro
                "camera_control": self._get_camera_control(request),
            }

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # 提交任务
                response = await client.post(
                    f"{self.API_BASE}/{self.API_VERSION}/videos/image2video",
                    headers=self._get_headers(),
                    json=payload,
                )

                if response.status_code != 200:
                    return ServiceResult.fail(f"API error: {response.text}")

                result = response.json()
                task_id = result.get("data", {}).get("task_id")

                if not task_id:
                    return ServiceResult.fail("No task ID returned")

                # 轮询等待结果
                video_url = await self._wait_for_completion(client, task_id)

                if not video_url:
                    return ServiceResult.fail("Video generation failed or timeout")

                # 下载视频
                video_data = await self._download_video(client, video_url)

                if not video_data:
                    return ServiceResult.fail("Failed to download video")

                result = VideoGenerationResult(
                    video_data=video_data,
                    duration=request.duration,
                    fps=request.fps,
                    width=request.width,
                    height=request.height,
                    metadata={"task_id": task_id, "url": video_url},
                )

                return ServiceResult.ok(result)

        except httpx.TimeoutException:
            return ServiceResult.fail("Request timeout")
        except Exception as e:
            return ServiceResult.fail(f"Generation failed: {e}")

    async def get_task_status(self, task_id: str) -> dict[str, Any]:
        """获取任务状态"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.API_BASE}/{self.API_VERSION}/videos/image2video/{task_id}",
                headers=self._get_headers(),
            )
            if response.status_code == 200:
                return response.json()
            return {"status": "error", "message": response.text}

    async def _load_image(self, image_path: str) -> str | None:
        """加载并编码图像"""
        try:
            # 如果已经是 base64，直接返回
            if image_path.startswith("data:image"):
                return image_path.split(",")[1]

            # 从文件读取
            path = Path(image_path)
            if path.exists():
                with open(path, "rb") as f:
                    return base64.b64encode(f.read()).decode("utf-8")

            # 可能是 URL，尝试下载
            if image_path.startswith("http"):
                async with httpx.AsyncClient() as client:
                    response = await client.get(image_path)
                    if response.status_code == 200:
                        return base64.b64encode(response.content).decode("utf-8")

            return None
        except Exception:
            return None

    def _get_camera_control(self, request: VideoGenerationRequest) -> dict[str, Any]:
        """获取摄像机控制参数"""
        movement_map = {
            "static": {"type": "none"},
            "pan_left": {"type": "pan", "direction": "left"},
            "pan_right": {"type": "pan", "direction": "right"},
            "pan_up": {"type": "pan", "direction": "up"},
            "pan_down": {"type": "pan", "direction": "down"},
            "zoom_in": {"type": "zoom", "direction": "in"},
            "zoom_out": {"type": "zoom", "direction": "out"},
        }
        return movement_map.get(request.camera_movement.value, {"type": "none"})

    async def _wait_for_completion(
        self,
        client: httpx.AsyncClient,
        task_id: str,
        max_wait: int = 600,
    ) -> str | None:
        """等待任务完成"""
        elapsed = 0
        while elapsed < max_wait:
            response = await client.get(
                f"{self.API_BASE}/{self.API_VERSION}/videos/image2video/{task_id}",
                headers=self._get_headers(),
            )

            if response.status_code == 200:
                data = response.json().get("data", {})
                status = data.get("status")

                if status == "completed":
                    videos = data.get("videos", [])
                    if videos:
                        return videos[0].get("url")
                    return None
                elif status == "failed":
                    return None

            await asyncio.sleep(self.poll_interval)
            elapsed += self.poll_interval

        return None

    async def _download_video(
        self,
        client: httpx.AsyncClient,
        url: str,
    ) -> bytes | None:
        """下载视频"""
        try:
            response = await client.get(url, timeout=120)
            if response.status_code == 200:
                return response.content
            return None
        except Exception:
            return None
