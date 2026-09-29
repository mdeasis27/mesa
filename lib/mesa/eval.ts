// lib/mesa/eval.ts
// Termination eval — the core "does it always finish?" claim, measured rather
// than assumed. Runs the graph with an adversarial reviewer that ALWAYS asks
// for a revision (worst case for termination), across a sweep of rejection
// caps and budget limits, and counts how many runs terminate within budget.

import type { HandlerResult } from "./graph";
import { runGraph, subgraphStepCount } from "./graph";
import { createDemoHandlers } from "./demo-agents";

import type { ReviewResult } from "./types";

const TASKS = [
  "Score crediticio",
  "Robo de identidad sintética",
  "Calibración de modelos de riesgo",
];

const MAX_REJECTIONS_SWEEP = [0, 1, 2, 5];
const BUDGET_SWEEP = [
  { maxSubqueries: 6, maxTokens: 1_000, maxSteps: 8, maxWallClockMs: 120_000 },
  { maxSubqueries: 6, maxTokens: 100_000, maxSteps: 3, maxWallClockMs: 120_000 },
  { maxSubqueries: 6, maxTokens: 100_000, maxSteps: 50, maxWallClockMs: 120_000 },
];

function adversarialReviewer(input: {
  draft: string;
  topic: string;
  rejectCount: number;
}): HandlerResult<ReviewResult> {
  void input;
  return {
    value: { verdict: "reject_and_revise", feedback: "adversarial: revise always" },
    tokensUsed: 10,
    latencyMs: 5,
  };
}

export type TerminationEvalRow = {
  task: string;
  maxRejections: number;
  budgetKey: string;
  terminated: boolean;
  steps: number;
  stepBound: number;
  budgetRespected: boolean;
};

export function getTerminationEval(): {
  totalRuns: number;
  terminatedRuns: number;
  budgetRespectedRuns: number;
  rows: TerminationEvalRow[];
} {
  const rows: TerminationEvalRow[] = [];

  for (const task of TASKS) {
    for (const maxRejections of MAX_REJECTIONS_SWEEP) {
      for (const budget of BUDGET_SWEEP) {
        const handlers = createDemoHandlers(task);
        const state = runGraph(
          task,
          { ...handlers, reviewer: adversarialReviewer },
          { budget, maxSections: 4, maxRejections },
        );

        const steps = state.trace.steps.length;
        const stepBound = subgraphStepCount(maxRejections);
        const budgetRespected =
          state.budget.tokensUsed <= budget.maxTokens &&
          state.budget.subqueriesUsed <= budget.maxSubqueries &&
          state.budget.stepsUsed <= budget.maxSteps;

        rows.push({
          task,
          maxRejections,
          budgetKey: `t${budget.maxTokens}/s${budget.maxSteps}`,
          terminated: state.trace.terminated,
          steps,
          stepBound,
          budgetRespected,
        });
      }
    }
  }

  return {
    totalRuns: rows.length,
    terminatedRuns: rows.filter((r) => r.terminated).length,
    budgetRespectedRuns: rows.filter((r) => r.budgetRespected).length,
    rows,
  };
}
