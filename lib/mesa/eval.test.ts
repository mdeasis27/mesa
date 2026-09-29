import { describe, expect, it } from "vitest";

import { getTerminationEval } from "./eval";

describe("termination eval", () => {
  it("every run terminates even with an adversarial reviewer", () => {
    const result = getTerminationEval();
    expect(result.totalRuns).toBeGreaterThan(0);
    expect(result.terminatedRuns).toBe(result.totalRuns);
  });

  it("never exceeds the subgraph step bound", () => {
    for (const row of getTerminationEval().rows) {
      expect(row.steps).toBeLessThanOrEqual(row.stepBound);
    }
  });

  it("respects the budget in every run", () => {
    const result = getTerminationEval();
    expect(result.budgetRespectedRuns).toBe(result.totalRuns);
  });
});
