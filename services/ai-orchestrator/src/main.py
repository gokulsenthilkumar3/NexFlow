"""
main.py — NexFlow AI Orchestrator FastAPI application.

Endpoints:
  GET  /health                     — liveness check (Redis + OpenAI status)
  POST /ai/triage-work-item        — synchronous LLM triage for a work item
  POST /ai/summarize-ticket        — synchronous LLM summary + sentiment for a ticket

Background tasks (started in lifespan):
  - triage_worker: consumes events:triage → calls LLM → publishes to events:updates
"""
from __future__ import annotations

import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .llm import init_openai, summarize_ticket, triage_work_item
from .models import (
    HealthResponse,
    SummarizeTicketRequest,
    SummarizeTicketResponse,
    TriageWorkItemRequest,
    TriageWorkItemResponse,
)
from .redis_client import build_redis, get_redis, set_redis_client
from .triage_worker import run_triage_worker

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    FastAPI lifespan context manager.
    - On startup: initialise Redis client, OpenAI client, and start background worker.
    - On shutdown: cancel the background worker and close Redis.
    """
    settings = get_settings()

    # Initialise Redis
    redis_client = build_redis(settings)
    set_redis_client(redis_client)

    # Initialise OpenAI
    init_openai(settings)

    # Start background triage worker
    worker_task = asyncio.create_task(
        run_triage_worker(redis_client, settings),
        name="triage-worker",
    )
    logger.info("AI Orchestrator startup complete")

    try:
        yield  # Application is live
    finally:
        # Graceful shutdown
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass
        await redis_client.aclose()
        logger.info("AI Orchestrator shutdown complete")


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="NexFlow AI Orchestrator",
    description=(
        "Provides AI-powered triage for work items and ticket summarisation. "
        "Also runs a background Redis Streams consumer for asynchronous triage."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Liveness check",
    tags=["Health"],
)
async def health_check() -> HealthResponse:
    """Return service health including Redis connectivity and OpenAI configuration."""
    settings = get_settings()

    # Test Redis
    redis_status = "ok"
    try:
        redis = get_redis()
        await redis.ping()
    except Exception as exc:  # noqa: BLE001
        redis_status = f"error: {exc}"

    return HealthResponse(
        status="ok",
        redis=redis_status,
        openai_configured=bool(settings.openai_api_key),
    )


@app.post(
    "/ai/triage-work-item",
    response_model=TriageWorkItemResponse,
    summary="Synchronous LLM triage for a work item",
    tags=["AI"],
)
async def triage_work_item_endpoint(body: TriageWorkItemRequest) -> TriageWorkItemResponse:
    """
    Call the LLM synchronously to categorise and prioritise a work item.
    Returns category, suggested priority, effort estimate, labels, and a one-sentence summary.
    Also publishes the result to `events:updates` so the work-item-service can patch the DB.
    """
    settings = get_settings()

    try:
        result = await triage_work_item(
            settings=settings,
            work_item_id=body.work_item_id,
            title=body.title,
            description=body.description,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Triage failed for work_item_id=%s: %s", body.work_item_id, exc)
        raise HTTPException(status_code=502, detail=f"LLM call failed: {exc}") from exc

    # Also publish to events:updates for async consumers
    try:
        from .updates_publisher import publish_triage_result
        redis = get_redis()
        await publish_triage_result(redis, settings, result)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not publish triage result to stream: %s", exc)
        # Non-fatal — return the result even if publishing fails

    return TriageWorkItemResponse(**result)


@app.post(
    "/ai/summarize-ticket",
    response_model=SummarizeTicketResponse,
    summary="Summarise a helpdesk ticket with sentiment detection",
    tags=["AI"],
)
async def summarize_ticket_endpoint(body: SummarizeTicketRequest) -> SummarizeTicketResponse:
    """
    Call the LLM to produce a 2–3 sentence summary of a helpdesk ticket,
    detect customer sentiment, and suggest resolution steps.
    """
    settings = get_settings()

    try:
        result = await summarize_ticket(
            settings=settings,
            ticket_id=body.ticket_id,
            subject=body.subject,
            description=body.description,
            comments=body.comments,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Summarize failed for ticket_id=%s: %s", body.ticket_id, exc)
        raise HTTPException(status_code=502, detail=f"LLM call failed: {exc}") from exc

    return SummarizeTicketResponse(**result)
