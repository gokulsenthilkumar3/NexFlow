"""
redis_client.py — Shared async Redis client factory.
The client is created once at application startup and reused across all modules.
"""
from __future__ import annotations

import logging
from typing import Optional

import redis.asyncio as aioredis

from .config import Settings

logger = logging.getLogger(__name__)

# Module-level singleton — populated during FastAPI lifespan startup
_redis: Optional[aioredis.Redis] = None


def build_redis(settings: Settings) -> aioredis.Redis:
    """Create and return an async Redis client from settings."""
    kwargs: dict = {
        "host": settings.redis_host,
        "port": settings.redis_port,
        "db": settings.redis_db,
        "decode_responses": True,
    }
    if settings.redis_password:
        kwargs["password"] = settings.redis_password

    return aioredis.Redis(**kwargs)


def set_redis_client(client: aioredis.Redis) -> None:
    """Store the shared client (called during app startup)."""
    global _redis
    _redis = client
    logger.info(
        "Redis client registered (host=%s port=%s db=%s)",
        client.connection_pool.connection_kwargs.get("host"),
        client.connection_pool.connection_kwargs.get("port"),
        client.connection_pool.connection_kwargs.get("db"),
    )


def get_redis() -> aioredis.Redis:
    """Return the active Redis client (raises if not initialised)."""
    if _redis is None:
        raise RuntimeError("Redis client has not been initialised. Call set_redis_client() first.")
    return _redis


async def ensure_stream_group(
    client: aioredis.Redis,
    stream: str,
    group: str,
) -> None:
    """
    Create a consumer group on a Redis Stream if it doesn't already exist.
    Uses MKSTREAM so the stream is created if missing.
    """
    try:
        await client.xgroup_create(stream, group, id="0", mkstream=True)
        logger.info("Consumer group '%s' created on stream '%s'", group, stream)
    except aioredis.ResponseError as exc:
        if "BUSYGROUP" in str(exc):
            logger.debug("Consumer group '%s' already exists on stream '%s'", group, stream)
        else:
            raise
