"""Step tracing.

Mirrors lib/mesa/trace.ts. Records agent, tokens, latency per step and
aggregates per-agent statistics.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import time


@dataclass
class TraceStep:
    agent_id: str
    input: str
    output: str
    tokens_used: int
    latency_ms: int


@dataclass
class Trace:
    run_id: str
    started_at: float
    steps: list[TraceStep] = field(default_factory=list)
    terminated: bool = False
    termination_reason: str | None = None

    @property
    def total_tokens(self) -> int:
        return sum(s.tokens_used for s in self.steps)

    @property
    def total_latency_ms(self) -> int:
        return sum(s.latency_ms for s in self.steps)


def create_trace(run_id: str) -> Trace:
    return Trace(run_id=run_id, started_at=time.time())


def record_step(
    trace: Trace,
    agent_id: str,
    input_: str,
    output: str,
    tokens_used: int,
    latency_ms: int,
) -> Trace:
    trace.steps.append(
        TraceStep(agent_id, input_, output, tokens_used, latency_ms)
    )
    return trace


def finish_trace(trace: Trace, reason: str) -> Trace:
    trace.terminated = True
    trace.termination_reason = reason
    return trace


def get_run_stats(trace: Trace) -> dict[str, dict[str, int]]:
    tokens: dict[str, int] = {}
    latency: dict[str, int] = {}
    calls: dict[str, int] = {}
    for step in trace.steps:
        tokens[step.agent_id] = tokens.get(step.agent_id, 0) + step.tokens_used
        latency[step.agent_id] = latency.get(step.agent_id, 0) + step.latency_ms
        calls[step.agent_id] = calls.get(step.agent_id, 0) + 1
    return {"tokens": tokens, "latency": latency, "calls": calls}
