// lib/mesa/demo.ts
// The computed demo layer — runs the graph end to end with deterministic
// agents and exposes the numbers the dashboard renders. Everything below is
// reproducible offline: same task → same plan, findings, trace, budget and
// reviewer verdict.

import type { BudgetConfig, RunState, Trace } from "./types";
import { runGraph } from "./graph";
import { createDemoHandlers } from "./demo-agents";
import { getRunStats } from "./trace";
import { snapshotState } from "./budget";

export const DEFAULT_BUDGET: BudgetConfig = {
  maxSubqueries: 6,
  maxTokens: 10_000,
  maxSteps: 12,
  maxWallClockMs: 120_000,
};

export type DemoTasks = {
  id: string;
  label: string;
  task: string;
};

export const DEMO_TASKS: DemoTasks[] = [
  {
    id: "score-crediticio",
    label: "Score crediticio",
    task: "Investigar cómo los burós de crédito calculan un score de riesgo y qué señales predicen default.",
  },
  {
    id: "robo-identidad",
    label: "Robo de identidad",
    task: "Analizar las técnicas de robo de identidad sintética y cómo un KYC sólido mitiga el fraude.",
  },
  {
    id: "calibracion-riesgo",
    label: "Calibración de riesgo",
    task: "Explicar la calibración de modelos de riesgo y cómo un cutoff traduce probabilidad en decisión.",
  },
];

export function runDemo(task: string, budget: BudgetConfig = DEFAULT_BUDGET): RunState {
  const handlers = createDemoHandlers(task);
  return runGraph(task, handlers, {
    budget,
    maxSections: 4,
    maxRejections: 1,
  });
}

export function getDemoSummary(state: RunState) {
  const trace: Trace = state.trace;
  const stats = getRunStats(trace);
  const budgetSnapshot = snapshotState(state.budget, DEFAULT_BUDGET) as {
    subqueriesUsed: number;
    subqueriesMax: number;
    tokensUsed: number;
    tokensMax: number;
    stepsUsed: number;
    stepsMax: number;
    wallClockMs: number;
    wallClockMax: number;
    exhausted: boolean;
    exhaustedReason: string | null;
  };

  return {
    runId: state.runId,
    task: state.task,
    verdict: state.reviewerPassed ? "approve" : "reject",
    reviewerUsed: state.reviewerUsed,
    sections: state.plan.length,
    findingsCount: state.researchResults.length,
    draftChars: state.finalOutput.length,
    trace: {
      runId: trace.runId,
      stepCount: trace.steps.length,
      totalTokens: trace.totalTokens,
      totalLatencyMs: trace.totalLatencyMs,
      terminated: trace.terminated,
      terminationReason: trace.terminationReason ?? null,
    },
    tokensByAgent: stats.tokensByAgent,
    latencyByAgent: stats.latencyByAgent,
    callCountByAgent: stats.callCountByAgent,
    budget: budgetSnapshot,
    steps: trace.steps.map((s) => ({
      agent: s.agentId,
      input: s.input.content,
      output: s.output.content,
      tokens: s.tokensUsed,
      latencyMs: s.latencyMs,
      handoff: s.handoff ? `${s.handoff.from} → ${s.handoff.to}` : null,
    })),
    plan: state.plan,
    findings: state.researchResults.map((f) => f.result),
    draft: state.finalOutput,
  };
}

export function getAllDemoSummaries(): ReturnType<typeof getDemoSummary>[] {
  return DEMO_TASKS.map((t) => getDemoSummary(runDemo(t.task)));
}
