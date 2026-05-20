"""
config.py — Centralised, env-driven configuration for the AI Orchestrator.
All values are loaded from environment variables (or .env file).
No hardcoded secrets or host/port defaults beyond localhost conventions.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── FastAPI server ──────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000

    # ── Redis connection ─────────────────────────────────────────────────
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: str | None = None

    # ── Redis Streams ────────────────────────────────────────────────────
    triage_stream: str = "events:triage"
    triage_consumer_group: str = "ai-orchestrator-group"
    triage_consumer_name: str = "ai-orchestrator-1"
    updates_stream: str = "events:updates"
    breach_stream: str = "events:breach"

    # ── OpenAI / LLM ─────────────────────────────────────────────────────
    openai_api_key: str
    ai_model: str = "gpt-4o-mini"
    ai_max_tokens: int = 512
    ai_temperature: float = 0.3


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance (singleton)."""
    return Settings()
