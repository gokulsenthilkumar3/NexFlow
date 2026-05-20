"""
llm.py — OpenAI GPT wrapper for all AI Orchestrator LLM calls.
Model name, temperature, and token limits are read from env via Settings.
"""
from __future__ import annotations

import json
import logging
from typing import Optional

from openai import AsyncOpenAI

from .config import Settings

logger = logging.getLogger(__name__)

# Module-level client singleton
_client: Optional[AsyncOpenAI] = None


def init_openai(settings: Settings) -> AsyncOpenAI:
    """Initialise and return a cached AsyncOpenAI client."""
    global _client
    _client = AsyncOpenAI(api_key=settings.openai_api_key)
    logger.info("OpenAI client initialised (model=%s)", settings.ai_model)
    return _client


def get_openai_client() -> AsyncOpenAI:
    if _client is None:
        raise RuntimeError("OpenAI client not initialised. Call init_openai() first.")
    return _client


# ── Triage prompt ─────────────────────────────────────────────────────────────

TRIAGE_SYSTEM_PROMPT = """\
You are a senior software project manager performing automated work-item triage.
Given the title and description of a work item, return a JSON object with exactly these keys:

{
  "category": "<Bug|Feature|Task|Epic|Incident|Question|Unknown>",
  "suggested_priority": "<Critical|High|Medium|Low>",
  "effort_estimate_days": <float or null>,
  "labels": [<string>, ...],
  "summary": "<one sentence summary>"
}

Rules:
- Be concise and precise.
- Only use the enum values listed above.
- effort_estimate_days should be a realistic estimate; use null if unclear.
- labels should be lowercase kebab-case (e.g. "auth", "database", "ui").
- Return only valid JSON — no markdown, no prose.
"""


async def triage_work_item(
    settings: Settings,
    work_item_id: str,
    title: str,
    description: Optional[str],
) -> dict:
    """
    Call the LLM to categorise and prioritise a work item.
    Returns a dict matching TriageWorkItemResponse fields.
    """
    user_content = f"Title: {title}\n\nDescription: {description or '(none)'}"

    client = get_openai_client()
    response = await client.chat.completions.create(
        model=settings.ai_model,
        max_tokens=settings.ai_max_tokens,
        temperature=settings.ai_temperature,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": TRIAGE_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
    )

    raw = response.choices[0].message.content or "{}"
    logger.debug("Triage LLM raw output for %s: %s", work_item_id, raw)

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("LLM returned invalid JSON for work item %s; using defaults", work_item_id)
        parsed = {}

    return {
        "work_item_id": work_item_id,
        "category": parsed.get("category", "Unknown"),
        "suggested_priority": parsed.get("suggested_priority", "Medium"),
        "effort_estimate_days": parsed.get("effort_estimate_days"),
        "labels": parsed.get("labels", []),
        "summary": parsed.get("summary", title),
        "raw_llm_output": raw,
    }


# ── Summarise ticket prompt ────────────────────────────────────────────────────

SUMMARIZE_SYSTEM_PROMPT = """\
You are a senior helpdesk analyst. Given a support ticket's subject, description, and comments,
return a JSON object with exactly these keys:

{
  "summary": "<concise 2-3 sentence summary of the issue>",
  "sentiment": "<Positive|Neutral|Frustrated|Angry>",
  "suggested_resolution": "<actionable resolution steps or null>"
}

Rules:
- summary should describe the core problem, not repeat the subject verbatim.
- sentiment should reflect the customer's tone in the latest message.
- suggested_resolution can be null if there is not enough information.
- Return only valid JSON — no markdown, no prose.
"""


async def summarize_ticket(
    settings: Settings,
    ticket_id: str,
    subject: str,
    description: Optional[str],
    comments: Optional[list[str]],
) -> dict:
    """
    Call the LLM to summarise a helpdesk ticket and detect customer sentiment.
    Returns a dict matching SummarizeTicketResponse fields.
    """
    parts = [f"Subject: {subject}"]
    if description:
        parts.append(f"Description:\n{description}")
    if comments:
        parts.append("Comments (oldest first):\n" + "\n---\n".join(comments))

    user_content = "\n\n".join(parts)

    client = get_openai_client()
    response = await client.chat.completions.create(
        model=settings.ai_model,
        max_tokens=settings.ai_max_tokens,
        temperature=settings.ai_temperature,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SUMMARIZE_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
    )

    raw = response.choices[0].message.content or "{}"
    logger.debug("Summarize LLM raw output for ticket %s: %s", ticket_id, raw)

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("LLM returned invalid JSON for ticket %s; using defaults", ticket_id)
        parsed = {}

    return {
        "ticket_id": ticket_id,
        "summary": parsed.get("summary", subject),
        "sentiment": parsed.get("sentiment", "Neutral"),
        "suggested_resolution": parsed.get("suggested_resolution"),
        "raw_llm_output": raw,
    }
