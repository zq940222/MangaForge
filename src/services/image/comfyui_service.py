"""
ComfyUI Image Generation Service Implementation
"""
import asyncio
import json
import uuid
from typing import Any, Optional

import httpx

from src.services.base import ServiceConfig, ServiceResult
from .base import BaseImageService, ImageGenerationRequest, ImageGenerationResult


class ComfyUIService(BaseImageService):
    """ComfyUI 图像生成服务实现"""

    provider = "comfyui"

    def __init__(self, config: ServiceConfig):
        super().__init__(config)
        self.base_url = config.endpoint or "http://localhost:8188"
        self.timeout = config.settings.get("timeout", 300)

    async def health_check(self) -> bool:
        """检查 ComfyUI 服务是否可用"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/system_stats",
                    timeout=10,
                )
                return response.status_code == 200
        except Exception:
            return False

    async def get_models(self) -> list[str]:
        """获取可用模型列表"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/object_info/CheckpointLoaderSimple",
                    timeout=30,
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("CheckpointLoaderSimple", {}).get(
                        "input", {}
                    ).get("required", {}).get("ckpt_name", [[]])[0]
                return []
        except Exception:
            return []

    async def get_workflows(self) -> list[str]:
        """获取可用工作流列表"""
        # ComfyUI 工作流存储在本地，这里返回预定义的工作流
        return [
            "txt2img_basic",
            "txt2img_with_lora",
            "txt2img_with_ipadapter",
            "txt2img_with_controlnet",
        ]

    async def get_loras(self) -> list[str]:
        """获取可用 LoRA 列表"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/object_info/LoraLoader",
                    timeout=30,
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("LoraLoader", {}).get(
                        "input", {}
                    ).get("required", {}).get("lora_name", [[]])[0]
                return []
        except Exception:
            return []

    def _build_workflow(self, request: ImageGenerationRequest) -> dict[str, Any]:
        """构建 ComfyUI 工作流"""
        # 基础 txt2img 工作流
        workflow = {
            "3": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": request.seed if request.seed >= 0 else int(uuid.uuid4().int % (2**32)),
                    "steps": request.steps,
                    "cfg": request.cfg_scale,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0],
                },
            },
            "4": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {
                    "ckpt_name": "sd_xl_base_1.0.safetensors",
                },
            },
            "5": {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": request.width,
                    "height": request.height,
                    "batch_size": request.batch_size,
                },
            },
            "6": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": request.prompt,
                    "clip": ["4", 1],
                },
            },
            "7": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": request.negative_prompt,
                    "clip": ["4", 1],
                },
            },
            "8": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2],
                },
            },
            "9": {
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "mangaforge",
                    "images": ["8", 0],
                },
            },
        }

        # 添加 LoRA
        if request.lora_name:
            workflow["10"] = {
                "class_type": "LoraLoader",
                "inputs": {
                    "lora_name": request.lora_name,
                    "strength_model": request.lora_weight,
                    "strength_clip": request.lora_weight,
                    "model": ["4", 0],
                    "clip": ["4", 1],
                },
            }
            # 更新 KSampler 和 CLIP 的模型引用
            workflow["3"]["inputs"]["model"] = ["10", 0]
            workflow["6"]["inputs"]["clip"] = ["10", 1]
            workflow["7"]["inputs"]["clip"] = ["10", 1]

        return workflow

    async def generate(
        self,
        request: ImageGenerationRequest,
    ) -> ServiceResult:
        """生成图像"""
        try:
            workflow = self._build_workflow(request)
            prompt_id = str(uuid.uuid4())

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # 提交工作流
                response = await client.post(
                    f"{self.base_url}/prompt",
                    json={
                        "prompt": workflow,
                        "client_id": prompt_id,
                    },
                )

                if response.status_code != 200:
                    return ServiceResult.fail(f"Failed to submit prompt: {response.text}")

                result_data = response.json()
                queue_prompt_id = result_data.get("prompt_id")

                # 轮询等待结果
                images = await self._wait_for_result(client, queue_prompt_id)

                if not images:
                    return ServiceResult.fail("No images generated")

                result = ImageGenerationResult(
                    images=images,
                    seeds=[request.seed if request.seed >= 0 else -1],
                    prompt=request.prompt,
                    metadata={"prompt_id": queue_prompt_id},
                )

                return ServiceResult.ok(result)

        except httpx.TimeoutException:
            return ServiceResult.fail("Request timeout")
        except Exception as e:
            return ServiceResult.fail(f"Generation failed: {e}")

    async def _wait_for_result(
        self,
        client: httpx.AsyncClient,
        prompt_id: str,
        max_wait: int = 300,
    ) -> list[bytes]:
        """等待生成结果"""
        for _ in range(max_wait):
            # 检查历史记录
            response = await client.get(f"{self.base_url}/history/{prompt_id}")
            if response.status_code == 200:
                history = response.json()
                if prompt_id in history:
                    outputs = history[prompt_id].get("outputs", {})
                    images = []
                    for node_output in outputs.values():
                        if "images" in node_output:
                            for img_info in node_output["images"]:
                                # 下载图像
                                img_response = await client.get(
                                    f"{self.base_url}/view",
                                    params={
                                        "filename": img_info["filename"],
                                        "subfolder": img_info.get("subfolder", ""),
                                        "type": img_info.get("type", "output"),
                                    },
                                )
                                if img_response.status_code == 200:
                                    images.append(img_response.content)
                    if images:
                        return images

            await asyncio.sleep(1)

        return []
