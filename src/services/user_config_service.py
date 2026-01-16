"""
User Config Service - 从数据库加载用户配置
"""
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import UserApiConfig
from src.services.base import ServiceConfig, ServiceType


class UserConfigService:
    """用户配置服务 - 从数据库加载用户的API配置"""

    def __init__(self, db: AsyncSession, user_id: str):
        self.db = db
        self.user_id = user_id
        self._cache: dict[str, list[UserApiConfig]] = {}

    async def get_configs_by_type(
        self,
        service_type: str,
        only_active: bool = True,
    ) -> list[UserApiConfig]:
        """获取指定类型的所有配置，按优先级排序"""
        cache_key = f"{service_type}:{only_active}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        query = select(UserApiConfig).where(
            UserApiConfig.user_id == self.user_id,
            UserApiConfig.service_type == service_type,
        )

        if only_active:
            query = query.where(UserApiConfig.is_active == True)

        query = query.order_by(UserApiConfig.priority.desc())

        result = await self.db.execute(query)
        configs = list(result.scalars().all())

        self._cache[cache_key] = configs
        return configs

    async def get_primary_config(
        self,
        service_type: str,
    ) -> Optional[UserApiConfig]:
        """获取最高优先级的配置"""
        configs = await self.get_configs_by_type(service_type)
        if configs:
            return configs[0]
        return None

    async def get_config_by_provider(
        self,
        service_type: str,
        provider: str,
    ) -> Optional[UserApiConfig]:
        """获取指定提供商的配置"""
        result = await self.db.execute(
            select(UserApiConfig).where(
                UserApiConfig.user_id == self.user_id,
                UserApiConfig.service_type == service_type,
                UserApiConfig.provider == provider,
                UserApiConfig.is_active == True,
            )
        )
        return result.scalar_one_or_none()

    async def to_service_config(
        self,
        user_config: UserApiConfig,
    ) -> ServiceConfig:
        """将数据库配置转换为ServiceConfig"""
        return ServiceConfig(
            provider=user_config.provider,
            api_key=user_config.api_key_encrypted,  # TODO: 解密
            endpoint=user_config.endpoint,
            model=user_config.model,
            settings=user_config.settings or {},
        )

    async def get_llm_service_config(
        self,
        provider: Optional[str] = None,
    ) -> Optional[ServiceConfig]:
        """获取LLM服务配置"""
        if provider:
            config = await self.get_config_by_provider("llm", provider)
        else:
            config = await self.get_primary_config("llm")

        if config and config.api_key_encrypted:
            return await self.to_service_config(config)
        return None

    async def get_available_llm_provider(self) -> Optional[str]:
        """获取可用的LLM提供商"""
        config = await self.get_primary_config("llm")
        if config and config.api_key_encrypted:
            return config.provider
        return None
