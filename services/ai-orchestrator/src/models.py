"""
models.py — Pydantic request/response schemas for all AI Orchestrator endpoints.
"""
from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# ── Shared enums ──────────────────────────────────────────────────────────────

class TriageCategory(str, Enum):
    BUG = "Bug"
    FEATURE = "Feature"
    TASK = "Task"
    EPIC = "Epic"
    INCIDENT = "Incident"
    QUESTION = "Question"
    UNKNOWN = "Unknown"


class TriagePriority(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


# ── Triage work item ──────────────────────────────────────────────────────────

class TriageWorkItemRequest(BaseModel):
    work_item_id: str = Field(..., description="UUID of the work item to triage")
    title: str = Field(..., min_length=1, max_length=512)
    description: Optional[str] = Field(None, max_length=4096)


class TriageWorkItemResponse(BaseModel):
    work_item_id: str
    category: TriageCategory
    suggested_priority: TriagePriority
    effort_estimate_days: Optional[float] = Field(
        None,
        description="LLM-estimated effort in engineering days",
        ge=0.0,
        le=365.0,
    )
    labels: list[str] = Field(default_factory=list, description="Suggested labels/tags")
    summary: str = Field(..., description="One-sentence summary produced by the LLM")
    raw_llm_output: Optional[str] = Field(
        None, description="Full raw text returned by the LLM (for debugging)"
    )


# ── Summarise ticket ─────────────────────────────────────────────────────────

class SummarizeTicketRequest(BaseModel):
    ticket_id: str = Field(..., description="UUID of the helpdesk ticket")
    subject: str = Field(..., min_length=1, max_length=512)
    description: Optional[str] = Field(None, max_length=8192)
    comments: Optional[list[str]] = Field(
        default_factory=list,
        description="Ordered list of comment texts (newest last)",
    )


class SummarizeTicketResponse(BaseModel):
    ticket_id: str
    summary: str = Field(..., description="Concise 2–3 sentence summary")
    sentiment: str = Field(
        ...,
        description="Detected customer sentiment: Positive / Neutral / Frustrated / Angry",
    )
    suggested_resolution: Optional[str] = Field(
        None, description="LLM-suggested resolution steps"
    )
    raw_llm_output: Optional[str] = None


# ── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    redis: str
    openai_configured: bool
