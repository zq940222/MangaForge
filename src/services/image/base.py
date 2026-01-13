"""
Base Image Generation Service Interface
"""
from abc import abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional

from src.services.base import BaseService, ServiceConfig, ServiceResult, ServiceType


@dataclass
class ImageGenerationRequest:
    """图像生成请求"""
    prompt: str
    negative_prompt: str = ""
    width: int = 1024
    height: int = 1024
    steps: int = 20
    cfg_scale: float = 7.0
    seed: int = -1  # -1 表示随机

    # 角色一致性
    character_image: Optional[str] = None  # IP-Adapter 参考图路径
    lora_name: Optional[str] = None  # LoRA 名称
    lora_weight: float = 0.8

    # ControlNet
    controlnet_image: Optional[str] = None
    controlnet_type: Optional[str] = None  # pose / depth / canny

    # 其他设置
    batch_size: int = 1
    settings: dict[str, Any] = field(default_factory=dict)


@dataclass
class ImageGenerationResult:
    """图像生成结果"""
    images: list[bytes]  # 图像字节数据列表
    seeds: list[int]  # 使用的种子
    prompt: str
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def first_image(self) -> Optional[bytes]:
        """获取第一张图像"""
        return self.images[0] if self.images else None


class BaseImageService(BaseService):
    """图像生成服务基类"""

    service_type = ServiceType.IMAGE

    @abstractmethod
    async def generate(
        self,
        request: ImageGenerationRequest,
    ) -> ServiceResult:
        """
        生成图像

        Args:
            request: 图像生成请求

        Returns:
            ServiceResult with ImageGenerationResult
        """
        pass

    @abstractmethod
    async def get_workflows(self) -> list[str]:
        """获取可用工作流列表"""
        pass

    @abstractmethod
    async def get_loras(self) -> list[str]:
        """获取可用 LoRA 列表"""
        pass

    async def generate_character_reference(
        self,
        prompt: str,
        width: int = 1024,
        height: int = 1024,
    ) -> ServiceResult:
        """
        生成角色参考图

        Args:
            prompt: 角色描述
            width: 图像宽度
            height: 图像高度

        Returns:
            ServiceResult with ImageGenerationResult
        """
        request = ImageGenerationRequest(
            prompt=prompt,
            negative_prompt="lowres, bad anatomy, bad hands, text, error, missing fingers",
            width=width,
            height=height,
            steps=30,  # 角色图需要更多步数
            cfg_scale=7.5,
        )
        return await self.generate(request)

    async def generate_storyboard(
        self,
        prompt: str,
        character_image: Optional[str] = None,
        lora_name: Optional[str] = None,
        aspect_ratio: str = "9:16",
    ) -> ServiceResult:
        """
        生成分镜图

        Args:
            prompt: 分镜描述
            character_image: 角色参考图路径
            lora_name: 角色 LoRA 名称
            aspect_ratio: 宽高比

        Returns:
            ServiceResult with ImageGenerationResult
        """
        # 计算尺寸
        if aspect_ratio == "9:16":
            width, height = 768, 1344
        elif aspect_ratio == "16:9":
            width, height = 1344, 768
        else:
            width, height = 1024, 1024

        request = ImageGenerationRequest(
            prompt=prompt,
            negative_prompt="lowres, bad anatomy, bad hands, text, watermark",
            width=width,
            height=height,
            character_image=character_image,
            lora_name=lora_name,
        )
        return await self.generate(request)
