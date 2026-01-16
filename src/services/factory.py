"""
Service Factory - 根据配置创建服务实例
"""
from typing import Optional, Type

from src.config.settings import get_settings
from src.services.base import BaseService, ServiceConfig, ServiceType

# LLM Services
from src.services.llm.base import BaseLLMService
from src.services.llm.anthropic_service import AnthropicService
from src.services.llm.openai_service import OpenAIService

# Image Services
from src.services.image.base import BaseImageService
from src.services.image.comfyui_service import ComfyUIService

# Video Services
from src.services.video.base import BaseVideoService
from src.services.video.kling_service import KlingService

# Voice Services
from src.services.voice.base import BaseVoiceService
from src.services.voice.edge_tts_service import EdgeTTSService
from src.services.voice.fish_speech_service import FishSpeechService

# Lipsync Services
from src.services.lipsync.base import BaseLipsyncService
from src.services.lipsync.sadtalker_service import SadTalkerService


# 服务注册表
SERVICE_REGISTRY: dict[ServiceType, dict[str, Type[BaseService]]] = {
    ServiceType.LLM: {
        "anthropic": AnthropicService,
        "openai": OpenAIService,
    },
    ServiceType.IMAGE: {
        "comfyui": ComfyUIService,
    },
    ServiceType.VIDEO: {
        "kling": KlingService,
    },
    ServiceType.VOICE: {
        "edge-tts": EdgeTTSService,
        "fish-speech": FishSpeechService,
    },
    ServiceType.LIPSYNC: {
        "sadtalker": SadTalkerService,
    },
}


class ServiceFactory:
    """服务工厂"""

    def __init__(self, user_id: Optional[str] = None):
        self.settings = get_settings()
        self.user_id = user_id
        self._service_cache: dict[str, BaseService] = {}

    def _get_cache_key(self, service_type: ServiceType, provider: str) -> str:
        """生成缓存键"""
        return f"{service_type.value}:{provider}"

    def create_service(
        self,
        service_type: ServiceType,
        provider: str,
        config: Optional[ServiceConfig] = None,
    ) -> BaseService:
        """
        创建服务实例

        Args:
            service_type: 服务类型
            provider: 提供商
            config: 服务配置 (可选，不提供则使用默认配置)

        Returns:
            服务实例

        Raises:
            ValueError: 如果服务类型或提供商不支持
        """
        # 检查是否支持
        if service_type not in SERVICE_REGISTRY:
            raise ValueError(f"Unsupported service type: {service_type}")

        providers = SERVICE_REGISTRY[service_type]
        if provider not in providers:
            raise ValueError(
                f"Unsupported provider '{provider}' for {service_type.value}. "
                f"Available: {list(providers.keys())}"
            )

        # 检查缓存
        cache_key = self._get_cache_key(service_type, provider)
        if cache_key in self._service_cache:
            return self._service_cache[cache_key]

        # 如果没有提供配置，使用默认配置
        if config is None:
            config = self._get_default_config(service_type, provider)

        # 创建实例
        service_class = providers[provider]
        service = service_class(config)

        # 缓存
        self._service_cache[cache_key] = service

        return service

    def _get_default_config(
        self,
        service_type: ServiceType,
        provider: str,
    ) -> ServiceConfig:
        """获取默认配置"""
        config = ServiceConfig(provider=provider)

        if service_type == ServiceType.LLM:
            if provider == "anthropic":
                config.api_key = self.settings.anthropic_api_key
                config.model = self.settings.anthropic_model
            elif provider == "openai":
                config.api_key = self.settings.openai_api_key
                config.model = self.settings.openai_model

        elif service_type == ServiceType.IMAGE:
            if provider == "comfyui":
                config.endpoint = self.settings.comfyui_url
                config.settings = {"timeout": self.settings.comfyui_timeout}

        elif service_type == ServiceType.VIDEO:
            if provider == "kling":
                # 需要用户配置 API Key
                pass

        elif service_type == ServiceType.VOICE:
            if provider == "fish-speech":
                config.endpoint = "http://localhost:8080"
            elif provider == "edge-tts":
                pass  # 无需配置

        elif service_type == ServiceType.LIPSYNC:
            if provider == "sadtalker":
                config.endpoint = "http://localhost:7860"

        return config

    def get_llm_service(
        self,
        provider: Optional[str] = None,
        config: Optional[ServiceConfig] = None,
    ) -> BaseLLMService:
        """获取 LLM 服务"""
        provider = provider or self.settings.llm_provider
        return self.create_service(ServiceType.LLM, provider, config)

    def get_image_service(
        self,
        provider: str = "comfyui",
        config: Optional[ServiceConfig] = None,
    ) -> BaseImageService:
        """获取图像生成服务"""
        return self.create_service(ServiceType.IMAGE, provider, config)

    def get_video_service(
        self,
        provider: str = "kling",
        config: Optional[ServiceConfig] = None,
    ) -> BaseVideoService:
        """获取视频生成服务"""
        return self.create_service(ServiceType.VIDEO, provider, config)

    def get_voice_service(
        self,
        provider: str = "edge-tts",
        config: Optional[ServiceConfig] = None,
    ) -> BaseVoiceService:
        """获取语音生成服务"""
        return self.create_service(ServiceType.VOICE, provider, config)

    def get_lipsync_service(
        self,
        provider: str = "sadtalker",
        config: Optional[ServiceConfig] = None,
    ) -> BaseLipsyncService:
        """获取口型同步服务"""
        return self.create_service(ServiceType.LIPSYNC, provider, config)

    def get_available_providers(self, service_type: ServiceType) -> list[str]:
        """获取可用的提供商列表"""
        if service_type in SERVICE_REGISTRY:
            return list(SERVICE_REGISTRY[service_type].keys())
        return []

    def clear_cache(self) -> None:
        """清除服务缓存"""
        self._service_cache.clear()


# 全局工厂实例
_factory: Optional[ServiceFactory] = None


def get_service_factory() -> ServiceFactory:
    """获取服务工厂单例"""
    global _factory
    if _factory is None:
        _factory = ServiceFactory()
    return _factory
