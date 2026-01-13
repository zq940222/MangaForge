"""
Redis Client Configuration
"""
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Optional

import redis.asyncio as redis
from redis.asyncio import Redis

from src.config.settings import get_settings

settings = get_settings()

# Global Redis client instance
_redis_client: Optional[Redis] = None


async def init_redis() -> Redis:
    """Initialize Redis connection."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


async def close_redis() -> None:
    """Close Redis connection."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None


async def get_redis() -> AsyncGenerator[Redis, None]:
    """Dependency for getting Redis client."""
    client = await init_redis()
    yield client


def redis_client() -> Redis:
    """Get Redis client synchronously (must be initialized first)."""
    if _redis_client is None:
        raise RuntimeError("Redis client not initialized. Call init_redis() first.")
    return _redis_client


class RedisCache:
    """Redis cache helper class."""

    def __init__(self, client: Redis, prefix: str = "mangaforge"):
        self.client = client
        self.prefix = prefix

    def _key(self, key: str) -> str:
        """Generate prefixed key."""
        return f"{self.prefix}:{key}"

    async def get(self, key: str) -> Optional[str]:
        """Get value from cache."""
        return await self.client.get(self._key(key))

    async def set(
        self,
        key: str,
        value: str,
        expire: Optional[int] = None,
    ) -> bool:
        """Set value in cache."""
        return await self.client.set(self._key(key), value, ex=expire)

    async def delete(self, key: str) -> int:
        """Delete key from cache."""
        return await self.client.delete(self._key(key))

    async def exists(self, key: str) -> bool:
        """Check if key exists."""
        return await self.client.exists(self._key(key)) > 0

    async def expire(self, key: str, seconds: int) -> bool:
        """Set key expiration."""
        return await self.client.expire(self._key(key), seconds)

    async def ttl(self, key: str) -> int:
        """Get key TTL."""
        return await self.client.ttl(self._key(key))


class RedisPubSub:
    """Redis Pub/Sub helper for real-time progress updates."""

    def __init__(self, client: Redis, channel_prefix: str = "mangaforge:progress"):
        self.client = client
        self.channel_prefix = channel_prefix

    def _channel(self, project_id: str) -> str:
        """Generate channel name."""
        return f"{self.channel_prefix}:{project_id}"

    async def publish_progress(
        self,
        project_id: str,
        stage: str,
        progress: int,
        message: str,
        data: Optional[dict] = None,
    ) -> int:
        """Publish progress update."""
        import json

        payload = {
            "stage": stage,
            "progress": progress,
            "message": message,
            "data": data or {},
        }
        return await self.client.publish(
            self._channel(project_id),
            json.dumps(payload),
        )

    async def subscribe(self, project_id: str):
        """Subscribe to progress updates."""
        pubsub = self.client.pubsub()
        await pubsub.subscribe(self._channel(project_id))
        return pubsub
