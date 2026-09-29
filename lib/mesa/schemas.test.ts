import { describe, expect, it } from "vitest";

import { PLAN_TO_RESEARCH, RESEARCH_TO_WRITER, validateHandoff } from "./schemas";

describe("handoff schema validation", () => {
  it("accepts a well-formed plan→researcher handoff", () => {
    const result = validateHandoff(PLAN_TO_RESEARCH, {
      queries: ["a", "b"],
      context: "task",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects a missing key", () => {
    const result = validateHandoff(PLAN_TO_RESEARCH, { queries: ["a"] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("context"))).toBe(true);
  });

  it("rejects a wrong type", () => {
    const result = validateHandoff(PLAN_TO_RESEARCH, {
      queries: "not-an-array",
      context: "task",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("queries"))).toBe(true);
  });

  it("rejects unexpected keys", () => {
    const result = validateHandoff(RESEARCH_TO_WRITER, {
      findings: ["x"],
      citations: [],
      topic: "t",
      extra: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("extra"))).toBe(true);
  });
});
