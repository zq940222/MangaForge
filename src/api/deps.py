"""
API Dependencies - 依赖注入
"""
from collections.abc import AsyncGenerator
from typing import Optional
from uuid import uuid4

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import get_async_session
from src.db.redis import get_redis, Redis
from src.storage import get_storage, MinioStorage
from src.services.factory import get_service_factory, ServiceFactory
from src.config.settings import get_settings


# HTTP Bearer token 认证
security = HTTPBearer(auto_error=False)

# 默认开发用户 ID
DEFAULT_DEV_USER_ID = "00000000-0000-0000-0000-000000000001"


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话"""
    async for session in get_async_session():
        yield session


async def get_redis_client() -> AsyncGenerator[Redis, None]:
    """获取 Redis 客户端"""
    async for client in get_redis():
        yield client


def get_storage_client() -> MinioStorage:
    """获取存储客户端"""
    return get_storage()


def get_services() -> ServiceFactory:
    """获取服务工厂"""
    return get_service_factory()


async def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
) -> str:
    """
    获取当前用户 ID

    优先级：
    1. JWT token (未实现)
    2. X-User-ID header (开发模式)
    3. 默认用户 ID
    """
    settings = get_settings()

    # 1. 如果有 Bearer token，使用 JWT 验证
    if credentials:
        # TODO: 验证 JWT token
        # token = credentials.credentials
        # payload = verify_jwt(token)
        # return payload.get("user_id")
        pass

    # 2. 开发模式：从 X-User-ID header 读取
    if settings.env == "development" and x_user_id:
        return x_user_id

    # 3. 返回默认用户 ID
    return DEFAULT_DEV_USER_ID


async def get_current_user_id_required(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    """
    获取当前用户 ID（必需）

    如果未认证则抛出 401 错误
    """
    user_id = await get_current_user_id(credentials)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


# 类型别名
DBSession = AsyncGenerator[AsyncSession, None]
