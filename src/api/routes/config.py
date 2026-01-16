"""
Config API Routes - 用户 API 配置管理
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db, get_current_user_id, get_services
from src.api.schemas.config import (
    UserConfigCreate,
    UserConfigUpdate,
    UserConfigResponse,
    ProviderInfo,
    TestConnectionRequest,
    TestConnectionResponse,
)
from src.models import UserApiConfig, SupportedProvider
from src.services.factory import ServiceFactory
from src.services.base import ServiceConfig, ServiceType

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/providers", response_model=list[ProviderInfo])
async def list_providers(
    service_type: str = None,
    db: AsyncSession = Depends(get_db),
):
    """获取支持的服务商列表"""
    query = select(SupportedProvider)

    if service_type:
        query = query.where(SupportedProvider.service_type == service_type)

    result = await db.execute(query.order_by(SupportedProvider.service_type))
    providers = result.scalars().all()

    return [
        ProviderInfo(
            id=p.id,
            service_type=p.service_type,
            name=p.name,
            description=p.description,
            is_local=p.is_local,
            requires_gpu=p.requires_gpu,
            default_endpoint=p.default_endpoint,
            config_schema=p.config_schema,
        )
        for p in providers
    ]


@router.get("", response_model=list[UserConfigResponse])
async def list_user_configs(
    service_type: str = None,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取用户配置列表"""
    query = select(UserApiConfig).where(UserApiConfig.user_id == user_id)

    if service_type:
        query = query.where(UserApiConfig.service_type == service_type)

    result = await db.execute(query.order_by(UserApiConfig.service_type, UserApiConfig.priority.desc()))
    configs = result.scalars().all()

    return [
        UserConfigResponse(
            id=c.id,
            user_id=c.user_id,
            service_type=c.service_type,
            provider=c.provider,
            endpoint=c.endpoint,
            model=c.model,
            settings=c.settings,
            is_active=c.is_active,
            priority=c.priority,
            created_at=c.created_at,
            updated_at=c.updated_at,
            has_api_key=bool(c.api_key_encrypted),
        )
        for c in configs
    ]


@router.post("", response_model=UserConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_user_config(
    data: UserConfigCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """创建用户配置"""
    from sqlalchemy import func

    # 检查是否已存在相同的配置
    existing = await db.execute(
        select(UserApiConfig).where(
            UserApiConfig.user_id == user_id,
            UserApiConfig.service_type == data.service_type,
            UserApiConfig.provider == data.provider,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Config for {data.service_type}/{data.provider} already exists",
        )

    # 如果没有指定优先级，自动分配最低优先级（新添加的配置默认排在最后）
    priority = data.priority
    if priority is None or priority == 0:
        # 获取当前同类型配置的最低优先级
        max_priority_result = await db.execute(
            select(func.max(UserApiConfig.priority)).where(
                UserApiConfig.user_id == user_id,
                UserApiConfig.service_type == data.service_type,
            )
        )
        max_priority = max_priority_result.scalar() or 0
        # 新配置的优先级比现有最高的还低（即排在最后）
        priority = max(0, max_priority - 1) if max_priority > 0 else 0

    # TODO: 加密 API Key
    encrypted_key = data.api_key  # 应该使用加密

    config = UserApiConfig(
        user_id=user_id,
        service_type=data.service_type,
        provider=data.provider,
        api_key_encrypted=encrypted_key,
        endpoint=data.endpoint,
        model=data.model,
        settings=data.settings,
        priority=priority,
    )

    db.add(config)
    await db.flush()
    await db.refresh(config)

    return UserConfigResponse(
        id=config.id,
        user_id=config.user_id,
        service_type=config.service_type,
        provider=config.provider,
        endpoint=config.endpoint,
        model=config.model,
        settings=config.settings,
        is_active=config.is_active,
        priority=config.priority,
        created_at=config.created_at,
        updated_at=config.updated_at,
        has_api_key=bool(config.api_key_encrypted),
    )


@router.patch("/{config_id}", response_model=UserConfigResponse)
async def update_user_config(
    config_id: str,
    data: UserConfigUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """更新用户配置"""
    result = await db.execute(
        select(UserApiConfig).where(
            UserApiConfig.id == config_id,
            UserApiConfig.user_id == user_id,
        )
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config not found",
        )

    update_data = data.model_dump(exclude_unset=True)

    # 处理 API Key
    if "api_key" in update_data:
        api_key = update_data.pop("api_key")
        if api_key:
            config.api_key_encrypted = api_key  # TODO: 加密

    for field, value in update_data.items():
        setattr(config, field, value)

    await db.flush()
    await db.refresh(config)

    return UserConfigResponse(
        id=config.id,
        user_id=config.user_id,
        service_type=config.service_type,
        provider=config.provider,
        endpoint=config.endpoint,
        model=config.model,
        settings=config.settings,
        is_active=config.is_active,
        priority=config.priority,
        created_at=config.created_at,
        updated_at=config.updated_at,
        has_api_key=bool(config.api_key_encrypted),
    )


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_config(
    config_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """删除用户配置"""
    result = await db.execute(
        select(UserApiConfig).where(
            UserApiConfig.id == config_id,
            UserApiConfig.user_id == user_id,
        )
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config not found",
        )

    await db.delete(config)


@router.post("/test", response_model=TestConnectionResponse)
async def test_connection(
    data: TestConnectionRequest,
    services: ServiceFactory = Depends(get_services),
):
    """测试 API 连接"""
    try:
        # 创建服务配置
        service_config = ServiceConfig(
            provider=data.provider,
            api_key=data.api_key,
            endpoint=data.endpoint,
            model=data.model,
        )

        # 获取服务类型
        service_type = ServiceType(data.service_type)

        # 创建服务实例
        service = services.create_service(service_type, data.provider, service_config)

        # 测试连接
        try:
            is_healthy = await service.health_check()
        except Exception as health_error:
            # health_check 抛出异常时，返回详细错误信息
            return TestConnectionResponse(
                success=False,
                message=f"Connection failed: {str(health_error)}",
            )

        if not is_healthy:
            return TestConnectionResponse(
                success=False,
                message="Connection failed: Health check returned false",
            )

        # 获取可用模型
        try:
            models = await service.get_models()
        except Exception as model_error:
            # 即使获取模型列表失败，连接本身是成功的
            models = []

        return TestConnectionResponse(
            success=True,
            message="Connection successful",
            available_models=models,
        )

    except ValueError as e:
        return TestConnectionResponse(
            success=False,
            message=str(e),
        )
    except Exception as e:
        return TestConnectionResponse(
            success=False,
            message=f"Connection error: {str(e)}",
        )
