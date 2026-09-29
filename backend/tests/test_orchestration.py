import json
from pathlib import Path

import pytest

from mesa.budget import BudgetConfig, BudgetState, check_budget, reason_key
from mesa.reviewer import Reviewer, subgraph_step_count

FIXTURE = Path(__file__).parent / "fixtures" / "orchestration.json"


def _load():
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


def test_subgraph_step_count_matches_fixture():
    for case in _load()["subgraphStepCount"]:
        assert subgraph_step_count(case["maxRejections"]) == case["steps"]


def test_budget_exhaustion_matches_fixture():
    for case in _load()["budgetExhaustion"]:
        config = BudgetConfig(
            max_subqueries=case["maxSubqueries"],
            max_tokens=case["maxTokens"],
            max_steps=case["maxSteps"],
            max_wall_clock_ms=60_000,
        )
        state = BudgetState(
            subqueries_used=case["subqueriesUsed"],
            tokens_used=case["tokensUsed"],
            steps_used=case["stepsUsed"],
        )
        out = check_budget(state, config)
        assert out.exhausted is case["exhausted"]
        assert reason_key(out) == case["reasonKey"]


def test_reviewer_decisions_match_fixture():
    for case in _load()["reviewerDecisions"]:
        reviewer = Reviewer(max_rejections=case["maxRejections"])
        decision = reviewer.apply(case["verdict"], case["rejectCount"])
        assert decision.action == case["action"]
        if "rejectCountAfter" in case and decision.action == "revise":
            assert decision.reject_count == case["rejectCountAfter"]
