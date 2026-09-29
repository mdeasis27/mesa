// lib/mesa/trace.ts
// Step-by-step trace recording: what agent received what, what it produced,
// how many tokens and ms it cost. The trace is durable — you can snapshot it,
// resume from it after a crash, and replay it deterministically.

import type { AgentId, Handoff, MessagePayload, StepResult, Trace } from "./types";

let runCounter = 0;

export function createTrace(task: string): Trace {
  runCounter += 1;
  const runId = `run-${runCounter}-${Date.now()}`;
  return {
    runId,
    task,
    startedAt: new Date().toISOString(),
    steps: [],
    totalTokens: 0,
    totalLatencyMs: 0,
    terminated: false,
  };
}

export function recordStep(
  trace: Trace,
  agentId: AgentId,
  input: MessagePayload,
  output: MessagePayload,
  tokensUsed: number,
  latencyMs: number,
  handoff?: Handoff,
): Trace {
  const step: StepResult = {
    agentId,
    input,
    output,
    tokensUsed,
    latencyMs,
    handoff,
  };
  return {
    ...trace,
    steps: [...trace.steps, step],
    totalTokens: trace.totalTokens + tokensUsed,
    totalLatencyMs: trace.totalLatencyMs + latencyMs,
  };
}

export function finishTrace(trace: Trace, reason: string): Trace {
  return {
    ...trace,
    finishedAt: new Date().toISOString(),
    terminated: true,
    terminationReason: reason,
  };
}

export function traceSnapshot(trace: Trace): Record<string, unknown> {
  return {
    runId: trace.runId,
    task: trace.task,
    startedAt: trace.startedAt,
    finishedAt: trace.finishedAt ?? null,
    stepCount: trace.steps.length,
    totalTokens: trace.totalTokens,
    totalLatencyMs: trace.totalLatencyMs,
    terminated: trace.terminated,
    terminationReason: trace.terminationReason ?? null,
    steps: trace.steps.map((s) => ({
      agent: s.agentId,
      tokens: s.tokensUsed,
      latencyMs: s.latencyMs,
      handoff: s.handoff
        ? { from: s.handoff.from, to: s.handoff.to }
        : null,
    })),
  };
}

export function getRunStats(trace: Trace): {
  tokensByAgent: Record<string, number>;
  latencyByAgent: Record<string, number>;
  callCountByAgent: Record<string, number>;
} {
  const tokensByAgent: Record<string, number> = {};
  const latencyByAgent: Record<string, number> = {};
  const callCountByAgent: Record<string, number> = {};

  for (const step of trace.steps) {
    tokensByAgent[step.agentId] = (tokensByAgent[step.agentId] ?? 0) + step.tokensUsed;
    latencyByAgent[step.agentId] = (latencyByAgent[step.agentId] ?? 0) + step.latencyMs;
    callCountByAgent[step.agentId] = (callCountByAgent[step.agentId] ?? 0) + 1;
  }

  return { tokensByAgent, latencyByAgent, callCountByAgent };
}
