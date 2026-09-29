"""Runtime budget enforcement.

Mirrors lib/mesa/budget.ts. A budget is enforced in code, not in a prompt:
`check` returns a reason key when any limit is exceeded. Reason keys are
shared with the TypeScript implementation via the pinned fixture.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import time


@dataclass
class BudgetConfig:
    max_subqueries: int = 6
    max_tokens: int = 10_000
    max_steps: int = 12
    max_wall_clock_ms: int = 120_000


@dataclass
class BudgetState:
    subqueries_used: int = 0
    tokens_used: int = 0
    steps_used: int = 0
    started_at: float = field(default_factory=time.monotonic)
    exhausted: bool = False
    exhausted_reason: str | None = None


def create_budget(config: BudgetConfig) -> BudgetState:
    return BudgetState(started_at=time.monotonic())


def _reason_key(reason: str | None) -> str | None:
    if reason is None:
        return None
    return reason.split(" ")[0].lower()


def check_budget(state: BudgetState, config: BudgetConfig) -> BudgetState:
    """Return the state with `exhausted` set if any limit is crossed.

    The check order (subqueries, tokens, steps, wall clock) is part of the
    shared math and is asserted against the pinned fixture.
    """
    if state.exhausted:
        return state

    elapsed_ms = (time.monotonic() - state.started_at) * 1000

    if state.subqueries_used >= config.max_subqueries:
        return _exhaust(state, f"subqueries {config.max_subqueries}")
    if state.tokens_used >= config.max_tokens:
        return _exhaust(state, f"tokens {config.max_tokens}")
    if state.steps_used >= config.max_steps:
        return _exhaust(state, f"steps {config.max_steps}")
    if elapsed_ms >= config.max_wall_clock_ms:
        return _exhaust(state, f"wallclock {config.max_wall_clock_ms}")

    return state


def _exhaust(state: BudgetState, reason: str) -> BudgetState:
    state.exhausted = True
    state.exhausted_reason = reason
    return state


def spend_tokens(state: BudgetState, tokens: int) -> BudgetState:
    state.tokens_used += tokens
    return state


def spend_subquery(state: BudgetState) -> BudgetState:
    state.subqueries_used += 1
    return state


def spend_step(state: BudgetState, tokens: int) -> BudgetState:
    state.steps_used += 1
    state.tokens_used += tokens
    return state


def reason_key(state: BudgetState) -> str | None:
    return _reason_key(state.exhausted_reason)
