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
from src.services.llm.gemini_service import GeminiService

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
        "gemini": GeminiService,
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
            elif provider == "gemini":
                config.api_key = self.settings.gemini_api_key
                config.model = self.settings.gemini_model

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


async def create_llm_service_from_user_config(
    db,
    user_id: str,
    provider: Optional[str] = None,
) -> Optional[BaseLLMService]:
    """
    从数据库用户配置创建LLM服务

    Args:
        db: 数据库会话
        user_id: 用户ID
        provider: 指定提供商（可选，不指定则使用最高优先级）

    Returns:
        LLM服务实例，如果没有配置则返回None
    """
    from src.services.user_config_service import UserConfigService

    config_service = UserConfigService(db, user_id)
    service_config = await config_service.get_llm_service_config(provider)

    if service_config and service_config.api_key:
        factory = get_service_factory()
        return factory.create_service(
            ServiceType.LLM,
            service_config.provider,
            service_config,
        )

    return None


async def get_llm_service_with_fallback(
    db,
    user_id: str,
    provider: Optional[str] = None,
) -> BaseLLMService:
    """
    获取LLM服务，优先使用用户配置，否则回退到环境变量配置

    Args:
        db: 数据库会话
        user_id: 用户ID
        provider: 指定提供商（可选）

    Returns:
        LLM服务实例

    Raises:
        ValueError: 如果没有可用的LLM配置
    """
    # 1. 尝试从数据库获取用户配置
    llm_service = await create_llm_service_from_user_config(db, user_id, provider)
    if llm_service:
        return llm_service

    # 2. 回退到环境变量配置
    factory = get_service_factory()
    try:
        return factory.get_llm_service(provider)
    except Exception as e:
        raise ValueError(
            f"No LLM service available. Please configure an API key in Settings. Error: {e}"
        )


class LLMServiceWithFallback:
    """
    LLM服务包装器，支持自动回退到其他提供商

    当主提供商失败（如速率限制、认证错误）时，自动尝试下一个提供商
    """

    def __init__(self, services: list[BaseLLMService]):
        if not services:
            raise ValueError("At least one LLM service is required")
        self.services = services
        self.current_index = 0

    async def generate(self, *args, **kwargs):
        """尝试生成，失败时自动回退"""
        last_error = None

        for i, service in enumerate(self.services):
            try:
                result = await service.generate(*args, **kwargs)
                if result.success:
                    return result
                # 如果是速率限制或认证错误，尝试下一个
                error_msg = str(result.error or "").lower()
                if any(x in error_msg for x in ["rate limit", "quota", "429", "authentication"]):
                    last_error = result.error
                    continue
                return result
            except Exception as e:
                last_error = str(e)
                continue

        # 所有服务都失败
        from src.services.base import ServiceResult
        return ServiceResult.fail(f"All LLM providers failed. Last error: {last_error}")

    async def generate_stream(self, *args, **kwargs):
        """流式生成，失败时自动回退"""
        last_error = None

        for service in self.services:
            try:
                async for chunk in service.generate_stream(*args, **kwargs):
                    yield chunk
                return  # 成功完成
            except Exception as e:
                last_error = str(e)
                continue

        raise RuntimeError(f"All LLM providers failed. Last error: {last_error}")

    async def generate_json(self, messages, temperature: float = 0.3, max_tokens: int = 4096, **kwargs):
        """生成 JSON 格式输出，失败时自动回退"""
        import json
        from src.services.base import ServiceResult

        last_error = None

        for i, service in enumerate(self.services):
            try:
                result = await service.generate(
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    json_mode=True,
                    **kwargs,
                )

                if result.success:
                    # 解析 JSON
                    try:
                        response = result.data
                        parsed = json.loads(response.content)
                        return ServiceResult.ok(parsed, {"raw_response": response})
                    except json.JSONDecodeError as e:
                        return ServiceResult.fail(f"JSON parse error: {e}")

                # 如果是速率限制或认证错误，尝试下一个
                error_msg = str(result.error or "").lower()
                if any(x in error_msg for x in ["rate limit", "quota", "429", "authentication"]):
                    last_error = result.error
                    print(f"Provider {i+1} failed with rate limit, trying next...")
                    continue
                return result
            except Exception as e:
                last_error = str(e)
                error_lower = str(e).lower()
                if any(x in error_lower for x in ["rate limit", "quota", "429", "authentication"]):
                    print(f"Provider {i+1} failed with exception, trying next...")
                    continue
                # 其他异常直接返回失败
                return ServiceResult.fail(f"LLM error: {e}")

        # 所有服务都失败
        return ServiceResult.fail(f"All LLM providers failed. Last error: {last_error}")

    # 代理其他方法到主服务
    def __getattr__(self, name):
        return getattr(self.services[0], name)


async def get_llm_services_by_priority(
    db,
    user_id: str,
) -> list[BaseLLMService]:
    """
    按优先级获取所有已配置的LLM服务列表

    Returns:
        按优先级排序的LLM服务列表
    """
    from src.services.user_config_service import UserConfigService

    config_service = UserConfigService(db, user_id)
    configs = await config_service.get_configs_by_type("llm", only_active=True)

    services = []
    factory = get_service_factory()

    for config in configs:
        if config.api_key_encrypted:
            try:
                service_config = await config_service.to_service_config(config)
                service = factory.create_service(
                    ServiceType.LLM,
                    service_config.provider,
                    service_config,
                )
                services.append(service)
            except Exception:
                continue

    return services


async def get_llm_service_with_auto_fallback(
    db,
    user_id: str,
) -> LLMServiceWithFallback:
    """
    获取带自动回退功能的LLM服务

    当主提供商失败时（如速率限制），自动尝试下一个优先级的提供商

    Returns:
        LLMServiceWithFallback 实例
    """
    services = await get_llm_services_by_priority(db, user_id)

    if not services:
        # 回退到环境变量配置
        factory = get_service_factory()
        try:
            service = factory.get_llm_service()
            services = [service]
        except Exception as e:
            raise ValueError(
                f"No LLM service available. Please configure an API key in Settings. Error: {e}"
            )

    return LLMServiceWithFallback(services)
