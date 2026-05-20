"""
test_models.py — Unit tests for Pydantic schemas in src/models.py.

These tests are fully offline: no network, no Redis, no OpenAI key required.
They validate field constraints, enum membership, and serialisation round-trips.
"""
import pytest
from pydantic import ValidationError

from src.models import (
    TriageCategory,
    TriagePriority,
    TriageWorkItemRequest,
    TriageWorkItemResponse,
    SummarizeTicketRequest,
    SummarizeTicketResponse,
    KbArticleCandidate,
    SuggestArticlesRequest,
    SuggestArticlesResponse,
    RankedKbArticle,
    HealthResponse,
)


# ── TriageCategory & TriagePriority enums ─────────────────────────────────────

class TestEnums:
    def test_triage_category_values(self):
        assert TriageCategory.BUG == "Bug"
        assert TriageCategory.FEATURE == "Feature"
        assert TriageCategory.INCIDENT == "Incident"
        assert TriageCategory.UNKNOWN == "Unknown"

    def test_triage_priority_values(self):
        assert TriagePriority.CRITICAL == "Critical"
        assert TriagePriority.HIGH == "High"
        assert TriagePriority.MEDIUM == "Medium"
        assert TriagePriority.LOW == "Low"

    def test_all_categories_covered(self):
        expected = {"Bug", "Feature", "Task", "Epic", "Incident", "Question", "Unknown"}
        assert {c.value for c in TriageCategory} == expected

    def test_all_priorities_covered(self):
        expected = {"Critical", "High", "Medium", "Low"}
        assert {p.value for p in TriagePriority} == expected


# ── TriageWorkItemRequest ────────────────────────────────────────────────────

class TestTriageWorkItemRequest:
    def test_valid_minimal(self):
        req = TriageWorkItemRequest(work_item_id="abc-123", title="Fix login bug")
        assert req.work_item_id == "abc-123"
        assert req.description is None

    def test_valid_with_description(self):
        req = TriageWorkItemRequest(
            work_item_id="abc-123",
            title="Fix login bug",
            description="Users cannot log in via SSO.",
        )
        assert req.description == "Users cannot log in via SSO."

    def test_empty_title_rejected(self):
        with pytest.raises(ValidationError):
            TriageWorkItemRequest(work_item_id="abc-123", title="")

    def test_title_too_long_rejected(self):
        with pytest.raises(ValidationError):
            TriageWorkItemRequest(work_item_id="abc-123", title="x" * 513)

    def test_description_too_long_rejected(self):
        with pytest.raises(ValidationError):
            TriageWorkItemRequest(
                work_item_id="abc-123",
                title="Valid title",
                description="x" * 4097,
            )


# ── TriageWorkItemResponse ───────────────────────────────────────────────────

class TestTriageWorkItemResponse:
    def _make(self, **kwargs):
        defaults = dict(
            work_item_id="wi-1",
            category=TriageCategory.BUG,
            suggested_priority=TriagePriority.HIGH,
            summary="A concise summary.",
        )
        return TriageWorkItemResponse(**(defaults | kwargs))

    def test_valid_minimal(self):
        resp = self._make()
        assert resp.labels == []
        assert resp.effort_estimate_days is None
        assert resp.raw_llm_output is None

    def test_valid_full(self):
        resp = self._make(
            effort_estimate_days=2.5,
            labels=["backend", "auth"],
            raw_llm_output="{\"category\": \"Bug\"}",
        )
        assert resp.effort_estimate_days == 2.5
        assert "backend" in resp.labels

    def test_effort_negative_rejected(self):
        with pytest.raises(ValidationError):
            self._make(effort_estimate_days=-1.0)

    def test_effort_over_max_rejected(self):
        with pytest.raises(ValidationError):
            self._make(effort_estimate_days=366.0)

    def test_invalid_category_rejected(self):
        with pytest.raises(ValidationError):
            self._make(category="NotACategory")

    def test_invalid_priority_rejected(self):
        with pytest.raises(ValidationError):
            self._make(suggested_priority="NotAPriority")

    def test_serialisation_round_trip(self):
        resp = self._make(effort_estimate_days=1.0, labels=["ci"])
        dumped = resp.model_dump()
        restored = TriageWorkItemResponse(**dumped)
        assert restored == resp


# ── SummarizeTicketRequest ───────────────────────────────────────────────────

class TestSummarizeTicketRequest:
    def test_valid_minimal(self):
        req = SummarizeTicketRequest(ticket_id="t-1", subject="Cannot reset password")
        assert req.comments == []
        assert req.description is None

    def test_valid_with_comments(self):
        req = SummarizeTicketRequest(
            ticket_id="t-1",
            subject="Cannot reset password",
            comments=["User tried incognito", "Reproduced on Chrome 125"],
        )
        assert len(req.comments) == 2

    def test_empty_subject_rejected(self):
        with pytest.raises(ValidationError):
            SummarizeTicketRequest(ticket_id="t-1", subject="")

    def test_description_too_long_rejected(self):
        with pytest.raises(ValidationError):
            SummarizeTicketRequest(
                ticket_id="t-1",
                subject="Valid",
                description="x" * 8193,
            )


# ── SummarizeTicketResponse ──────────────────────────────────────────────────

class TestSummarizeTicketResponse:
    def test_valid(self):
        resp = SummarizeTicketResponse(
            ticket_id="t-1",
            summary="User cannot reset password.",
            sentiment="Frustrated",
        )
        assert resp.suggested_resolution is None
        assert resp.raw_llm_output is None

    def test_with_resolution(self):
        resp = SummarizeTicketResponse(
            ticket_id="t-1",
            summary="Summary.",
            sentiment="Neutral",
            suggested_resolution="Clear cache and retry.",
        )
        assert resp.suggested_resolution == "Clear cache and retry."


# ── KbArticleCandidate ───────────────────────────────────────────────────────

class TestKbArticleCandidate:
    def test_valid(self):
        c = KbArticleCandidate(
            id="kb-1", title="Reset Password", slug="reset-password",
            excerpt="Step-by-step guide to reset your password."
        )
        assert c.slug == "reset-password"

    def test_excerpt_too_long_rejected(self):
        with pytest.raises(ValidationError):
            KbArticleCandidate(
                id="kb-1", title="T", slug="s", excerpt="x" * 501
            )


# ── SuggestArticlesRequest ───────────────────────────────────────────────────

class TestSuggestArticlesRequest:
    def _candidate(self, n=1):
        return KbArticleCandidate(
            id=f"kb-{n}", title=f"Article {n}",
            slug=f"article-{n}", excerpt=f"Excerpt {n}."
        )

    def test_valid(self):
        req = SuggestArticlesRequest(
            ticket_id="t-1",
            ticket_subject="Login broken",
            candidates=[self._candidate(1)],
        )
        assert len(req.candidates) == 1

    def test_empty_candidates_rejected(self):
        with pytest.raises(ValidationError):
            SuggestArticlesRequest(
                ticket_id="t-1",
                ticket_subject="Login broken",
                candidates=[],
            )


# ── RankedKbArticle & SuggestArticlesResponse ────────────────────────────────

class TestSuggestArticlesResponse:
    def test_valid(self):
        article = RankedKbArticle(
            id="kb-1", title="Reset Password", slug="reset-password",
            excerpt="Guide.", relevance_score=0.95,
            rationale="Directly addresses the password reset issue."
        )
        resp = SuggestArticlesResponse(ticket_id="t-1", suggestions=[article])
        assert resp.suggestions[0].relevance_score == 0.95

    def test_relevance_score_out_of_range_rejected(self):
        with pytest.raises(ValidationError):
            RankedKbArticle(
                id="kb-1", title="T", slug="s", excerpt="E.",
                relevance_score=1.5, rationale="R."
            )

    def test_relevance_score_negative_rejected(self):
        with pytest.raises(ValidationError):
            RankedKbArticle(
                id="kb-1", title="T", slug="s", excerpt="E.",
                relevance_score=-0.1, rationale="R."
            )


# ── HealthResponse ───────────────────────────────────────────────────────────

class TestHealthResponse:
    def test_valid(self):
        h = HealthResponse(status="ok", redis="connected", openai_configured=True)
        assert h.status == "ok"
        assert h.openai_configured is True

    def test_openai_not_configured(self):
        h = HealthResponse(status="degraded", redis="connected", openai_configured=False)
        assert h.openai_configured is False
