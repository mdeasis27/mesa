"""Reviewer subgraph + termination bound.

Mirrors lib/mesa/reviewer.ts. `subgraph_step_count` and the decision table are
shared math pinned to the fixture.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

DEFAULT_MAX_REJECTIONS = 1

Verdict = Literal["approve", "reject", "reject_and_revise"]
Action = Literal["approve", "reject", "revise"]


@dataclass
class ReviewDecision:
    action: Action
    reject_count: int = 0


def subgraph_step_count(max_rejections: int) -> int:
    # planner + researcher + writer + reviewer, plus (writer + reviewer) per revision.
    return 4 + max_rejections * 2


class Reviewer:
    def __init__(self, max_rejections: int = DEFAULT_MAX_REJECTIONS) -> None:
        self.max_rejections = max_rejections

    def apply(self, verdict: Verdict, reject_count: int) -> ReviewDecision:
        if verdict == "approve":
            return ReviewDecision(action="approve", reject_count=reject_count)
        if verdict == "reject":
            return ReviewDecision(action="reject", reject_count=reject_count)
        if reject_count < self.max_rejections:
            return ReviewDecision(action="revise", reject_count=reject_count + 1)
        return ReviewDecision(action="reject", reject_count=reject_count)
