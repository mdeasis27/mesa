import { describe, expect, it } from "vitest";

import {
  checkBudget,
  createBudget,
  spendStep,
  spendSubquery,
  spendTokens,
} from "./budget";

const CONFIG = {
  maxSubqueries: 3,
  maxTokens: 100,
  maxSteps: 5,
  maxWallClockMs: 60_000,
};

describe("budget enforcement", () => {
  it("starts active with zero usage", () => {
    const b = createBudget();
    expect(b.exhausted).toBe(false);
    expect(b.tokensUsed).toBe(0);
  });

  it("exhausts on max tokens", () => {
    let b = createBudget();
    b = spendTokens(b, 101);
    const next = checkBudget(b, CONFIG);
    expect(next.exhausted).toBe(true);
    expect(next.exhaustedReason).toContain("tokens");
  });

  it("exhausts on max subqueries", () => {
    let b = createBudget();
    b = spendSubquery(b);
    b = spendSubquery(b);
    b = spendSubquery(b);
    expect(checkBudget(b, CONFIG).exhausted).toBe(true);
  });

  it("exhausts on max steps", () => {
    let b = createBudget();
    for (let i = 0; i < 5; i += 1) b = spendStep(b, 1);
    expect(checkBudget(b, CONFIG).exhausted).toBe(true);
  });

  it("does not double-count after exhaustion", () => {
    let b = createBudget();
    b = spendTokens(b, 101);
    const once = checkBudget(b, CONFIG);
    const twice = checkBudget(once, CONFIG);
    expect(twice.exhaustedReason).toBe(once.exhaustedReason);
  });
});
