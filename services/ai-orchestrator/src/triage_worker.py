"""
triage_worker.py — Background consumer for the `events:triage` Redis Stream.

For every work item event published by the work-item-service, this worker:
  1. Reads the event from the stream using a consumer group (exactly-once delivery).
  2. Calls the LLM to triage the work item (category, priority, labels, summary).
  3. Publishes the result to `events:updates` (work-item-service will patch the DB).
  4. ACKs the message so it isn't re-processed.

Runs as an asyncio background task started during FastAPI lifespan startup.
"""
from __future__ import annotations

import asyncio
import logging

import redis.asyncio as aioredis

from .config import Settings
from .llm import triage_work_item
from .redis_client import ensure_stream_group
from .updates_publisher import publish_triage_result

logger = logging.getLogger(__name__)

# How long to block waiting for new stream messages (ms)
_BLOCK_MS = 5_000
# How many messages to fetch per batch
_BATCH_COUNT = 10
# Seconds to sleep after a transient error before retrying
_RETRY_SLEEP = 3


async def run_triage_worker(client: aioredis.Redis, settings: Settings) -> None:
    """
    Long-running coroutine that continuously reads from `events:triage`,
    triages each work item with the LLM, and publishes to `events:updates`.
    Designed to run indefinitely as a background asyncio task.
    """
    # Ensure the consumer group exists (idempotent)
    await ensure_stream_group(client, settings.triage_stream, settings.triage_consumer_group)

    logger.info(
        "Triage worker started | stream=%s | group=%s | consumer=%s",
        settings.triage_stream,
        settings.triage_consumer_group,
        settings.triage_consumer_name,
    )

    while True:
        try:
            # Read new messages delivered to this consumer
            response = await client.xreadgroup(
                groupname=settings.triage_consumer_group,
                consumername=settings.triage_consumer_name,
                streams={settings.triage_stream: ">"},
                count=_BATCH_COUNT,
                block=_BLOCK_MS,
            )

            if not response:
                # No messages — loop back and block again
                continue

            for stream_name, entries in response:
                for entry_id, fields in entries:
                    await _process_entry(client, settings, entry_id, fields)

        except asyncio.CancelledError:
            logger.info("Triage worker cancelled — shutting down gracefully")
            raise
        except Exception as exc:  # noqa: BLE001
            logger.exception("Triage worker encountered an error: %s — retrying in %ds", exc, _RETRY_SLEEP)
            await asyncio.sleep(_RETRY_SLEEP)


async def _process_entry(
    client: aioredis.Redis,
    settings: Settings,
    entry_id: str,
    fields: dict,
) -> None:
    """Process a single stream entry: triage → publish → ACK."""
    work_item_id = fields.get("work_item_id", "unknown")
    title = fields.get("title", "")
    description = fields.get("description") or None

    logger.info("Processing triage entry %s (work_item_id=%s)", entry_id, work_item_id)

    try:
        triage_result = await triage_work_item(settings, work_item_id, title, description)
        await publish_triage_result(client, settings, triage_result)

        # ACK the message so it isn't re-delivered
        await client.xack(settings.triage_stream, settings.triage_consumer_group, entry_id)
        logger.info("ACK'd entry %s for work_item_id=%s", entry_id, work_item_id)

    except Exception as exc:  # noqa: BLE001
        # Do NOT ACK — the message will be re-delivered on the next run (or by XAUTOCLAIM)
        logger.error(
            "Failed to process entry %s (work_item_id=%s): %s — message left pending",
            entry_id,
            work_item_id,
            exc,
        )
