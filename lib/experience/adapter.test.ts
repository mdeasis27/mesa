import { describe, expect, it } from "vitest";
import { runExperience } from "./adapter";
describe("Mesa experience", () => { it("terminates with a tight bounded budget", async () => { const result = await runExperience({ task: "Assess identity risk", maxSteps: 1, maxTokens: 10000, maxRejections: 3 }, new AbortController().signal, () => undefined); expect(result.result.trace.terminated).toBe(true); expect(result.result.budget.exhausted).toBe(true); }); });
