import { describe, expect, it } from "vitest";
import fixture from "./fixtures/orchestration.json";

import { checkBudget, createBudget } from "./budget";
import { createReviewer, subgraphStepCount } from "./reviewer";

const STEP_COUNTS = fixture.subgraphStepCount as { maxRejections: number; steps: number }[];
const BUDGET_CASES = fixture.budgetExhaustion as {
  subqueriesUsed: number;
  tokensUsed: number;
  stepsUsed: number;
  maxSubqueries: number;
  maxTokens: number;
  maxSteps: number;
  exhausted: boolean;
  reasonKey: string | null;
}[];
const REVIEWER_CASES = fixture.reviewerDecisions as {
  verdict: "approve" | "reject" | "reject_and_revise";
  rejectCount: number;
  maxRejections: number;
  action: string;
  rejectCountAfter?: number;
}[];

describe("pinned fixture: subgraph step count", () => {
  for (const c of STEP_COUNTS) {
    it(`maxRejections=${c.maxRejections} → ${c.steps} steps`, () => {
      expect(subgraphStepCount(c.maxRejections)).toBe(c.steps);
    });
  }
});

describe("pinned fixture: budget exhaustion", () => {
  for (const c of BUDGET_CASES) {
    it(`tokens=${c.tokensUsed} subq=${c.subqueriesUsed} steps=${c.stepsUsed} → ${c.exhausted ? c.reasonKey : "active"}`, () => {
      const state = createBudget();
      const seeded = {
        ...state,
        subqueriesUsed: c.subqueriesUsed,
        tokensUsed: c.tokensUsed,
        stepsUsed: c.stepsUsed,
      };
      const out = checkBudget(seeded, {
        maxSubqueries: c.maxSubqueries,
        maxTokens: c.maxTokens,
        maxSteps: c.maxSteps,
        maxWallClockMs: 60_000,
      });
      expect(out.exhausted).toBe(c.exhausted);
      expect(out.exhaustedReason ?? null).toBe(c.reasonKey);
    });
  }
});

describe("pinned fixture: reviewer decisions", () => {
  for (const c of REVIEWER_CASES) {
    it(`${c.verdict} @rejectCount=${c.rejectCount} (max=${c.maxRejections}) → ${c.action}`, () => {
      const r = createReviewer(c.maxRejections);
      const out = r.apply({ verdict: c.verdict }, c.rejectCount);
      expect(out.action).toBe(c.action);
      if (c.rejectCountAfter !== undefined && out.action === "revise") {
        expect(out.rejectCount).toBe(c.rejectCountAfter);
      }
    });
  }
});
