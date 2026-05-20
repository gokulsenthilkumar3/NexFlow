"""
updates_publisher.py — Publishes AI triage results to the `events:updates` Redis Stream.
The work-item-service consumes from this stream to patch work items with AI suggestions.
"""
from __future__ import annotations

import json
import logging

import redis.asyncio as aioredis

from .config import Settings

logger = logging.getLogger(__name__)


async def publish_triage_result(
    client: aioredis.Redis,
    settings: Settings,
    triage: dict,
) -> str:
    """
    Publish a triage result to `events:updates` so the work-item-service
    can patch the work item with AI-suggested category, priority, and labels.

    Returns the stream entry ID assigned by Redis.
    """
    fields = {
        "work_item_id": triage["work_item_id"],
        "category": triage["category"],
        "suggested_priority": triage["suggested_priority"],
        "labels": json.dumps(triage.get("labels", [])),
        "summary": triage["summary"],
    }
    if triage.get("effort_estimate_days") is not None:
        fields["effort_estimate_days"] = str(triage["effort_estimate_days"])

    entry_id = await client.xadd(settings.updates_stream, fields)
    logger.info(
        "Published triage result for work_item_id=%s to stream '%s' (entry_id=%s)",
        triage["work_item_id"],
        settings.updates_stream,
        entry_id,
    )
    return entry_id


async def publish_breach_summary(
    client: aioredis.Redis,
    settings: Settings,
    ticket_id: str,
    summary: str,
    sentiment: str,
    suggested_resolution: str | None,
) -> str:
    """
    Publish a ticket breach AI summary to `events:breach` for downstream consumers
    (e.g., a notification dashboard, escalation engine).

    Returns the stream entry ID assigned by Redis.
    """
    fields = {
        "ticket_id": ticket_id,
        "summary": summary,
        "sentiment": sentiment,
        "suggested_resolution": suggested_resolution or "",
        "source": "ai-orchestrator",
    }
    entry_id = await client.xadd(settings.breach_stream, fields)
    logger.info(
        "Published breach summary for ticket_id=%s to stream '%s' (entry_id=%s)",
        ticket_id,
        settings.breach_stream,
        entry_id,
    )
    return entry_id
