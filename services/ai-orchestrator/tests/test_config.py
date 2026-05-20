"""
test_config.py — Unit tests for Settings in src/config.py.

All tests override env vars inline; no real .env file required.
"""
import pytest
from pydantic import ValidationError

from src.config import Settings


class TestSettings:
    def _make(self, **overrides):
        """Build a Settings instance with a dummy OPENAI_API_KEY unless overridden."""
        base = {"openai_api_key": "sk-test-key"}
        return Settings(**(base | overrides))

    def test_defaults(self):
        s = self._make()
        assert s.host == "0.0.0.0"
        assert s.port == 8000
        assert s.redis_host == "localhost"
        assert s.redis_port == 6379
        assert s.redis_db == 0
        assert s.redis_password is None
        assert s.ai_model == "gpt-4o-mini"
        assert s.ai_max_tokens == 512
        assert s.ai_temperature == 0.3

    def test_stream_names(self):
        s = self._make()
        assert s.triage_stream == "events:triage"
        assert s.updates_stream == "events:updates"
        assert s.breach_stream == "events:breach"
        assert s.triage_consumer_group == "ai-orchestrator-group"

    def test_custom_values(self):
        s = self._make(
            host="127.0.0.1",
            port=9000,
            redis_host="redis-server",
            redis_port=6380,
            ai_model="gpt-4o",
            ai_max_tokens=1024,
            ai_temperature=0.7,
        )
        assert s.host == "127.0.0.1"
        assert s.port == 9000
        assert s.redis_host == "redis-server"
        assert s.redis_port == 6380
        assert s.ai_model == "gpt-4o"
        assert s.ai_max_tokens == 1024
        assert s.ai_temperature == 0.7

    def test_redis_password_set(self):
        s = self._make(redis_password="secret")
        assert s.redis_password == "secret"

    def test_openai_key_required(self, monkeypatch):
        """Settings must reject construction without OPENAI_API_KEY.

        Uses monkeypatch to remove any OPENAI_API_KEY that the CI runner
        may have injected via environment variables, so pydantic-settings
        cannot fall back to it and the ValidationError is reliably raised.
        """
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        with pytest.raises((ValidationError, Exception)):
            Settings()  # no openai_api_key in env or kwargs

    def test_openai_key_stored(self):
        s = self._make(openai_api_key="sk-abc123")
        assert s.openai_api_key == "sk-abc123"
