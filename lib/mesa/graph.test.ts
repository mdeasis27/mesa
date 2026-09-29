import { describe, expect, it } from "vitest";

import { runGraph } from "./graph";
import { runDemo } from "./demo";
import { createDemoHandlers } from "./demo-agents";

const TASK = "Investigar cómo los burós de crédito calculan un score de riesgo.";

describe("orchestrator graph", () => {
  it("produces a plan, findings, draft and terminates", () => {
    const state = runGraph(TASK, createDemoHandlers(TASK));
    expect(state.phase).toBe("done");
    expect(state.trace.terminated).toBe(true);
    expect(state.plan.length).toBeGreaterThan(0);
    expect(state.trace.steps.length).toBeGreaterThan(0);
  });

  it("is deterministic for the same task", () => {
    const a = runGraph(TASK, createDemoHandlers(TASK));
    const b = runGraph(TASK, createDemoHandlers(TASK));
    expect(a.finalOutput).toBe(b.finalOutput);
    expect(a.reviewerPassed).toBe(b.reviewerPassed);
    expect(a.budget.tokensUsed).toBe(b.budget.tokensUsed);
  });

  it("halts on token exhaustion without throwing", () => {
    const state = runGraph(TASK, createDemoHandlers(TASK), {
      budget: { maxSubqueries: 6, maxTokens: 1, maxSteps: 12, maxWallClockMs: 60_000 },
      maxSections: 4,
      maxRejections: 1,
    });
    expect(state.trace.terminated).toBe(true);
    expect(state.budget.exhausted).toBe(true);
  });

  it("respects maxSteps budget", () => {
    const state = runGraph(TASK, createDemoHandlers(TASK), {
      budget: { maxSubqueries: 6, maxTokens: 100_000, maxSteps: 1, maxWallClockMs: 60_000 },
      maxSections: 4,
      maxRejections: 1,
    });
    expect(state.budget.stepsUsed).toBeLessThanOrEqual(1);
    expect(state.budget.exhausted).toBe(true);
  });
});

describe("demo layer", () => {
  it("runs all demo tasks deterministically", () => {
    const s1 = runDemo(TASK);
    const s2 = runDemo(TASK);
    expect(s1.runId).toBeDefined();
    expect(s1.finalOutput).toBe(s2.finalOutput);
  });

  it("never exceeds the subquery budget", () => {
    const state = runDemo(TASK);
    expect(state.researchResults.length).toBeLessThanOrEqual(6);
  });
});
