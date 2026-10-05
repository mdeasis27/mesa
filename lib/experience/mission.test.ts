import { describe, expect, it } from "vitest";
import { runMission } from "./mission";
const input = { task: "Assess identity risk controls", maxSteps: 1, maxTokens: 10000, maxRejections: 1 };
describe("workflow mission", () => {
  it("changes only the step budget for the same task", async () => {
    const run = await runMission(input, new AbortController().signal, () => {});
    expect(run.input).toEqual(input);
    expect(run.result.comparison.selected.budget.exhausted).toBe(true);
    expect(run.result.comparison.reference.budget.exhausted).toBe(false);
    expect(run.result.comparison.reference.draft.length).toBeGreaterThan(0);
    expect(run.result.comparison.selected.task).toBe(run.result.comparison.reference.task);
  });
  it("does not promise completion when tokens block both choices", async () => {
    const run = await runMission({ ...input, maxTokens: 1 }, new AbortController().signal, () => {});
    expect(run.result.comparison.selected.budget.exhausted).toBe(true);
    expect(run.result.comparison.reference.budget.exhausted).toBe(true);
  });
  it("preserves equal budget outcomes without comparing random IDs", async () => {
    const run = await runMission({ ...input, maxSteps: 12 }, new AbortController().signal, () => {});
    expect(run.result.comparison.selected.draft).toBe(run.result.comparison.reference.draft);
    expect(run.result.comparison.selected.budget.stepsUsed).toBe(run.result.comparison.reference.budget.stepsUsed);
  });
  it("stops publishing after callback cancellation", async () => {
    const controller = new AbortController(); const ids: string[] = [];
    await expect(runMission(input, controller.signal, event => { ids.push(event.id); controller.abort(); })).rejects.toMatchObject({ name: "AbortError" });
    expect(ids).toHaveLength(1);
  });
  it("rejects empty tasks", async () => {
    await expect(runMission({ ...input, task: " " }, new AbortController().signal, () => {})).rejects.toThrow(/task/);
  });
  it("rejects invalid numeric budgets", async () => {
    for (const maxSteps of [NaN, Infinity, 1.5]) {
      await expect(runMission({ ...input, maxSteps }, new AbortController().signal, () => {})).rejects.toThrow(/integer/);
    }
    await expect(runMission({ ...input, maxTokens: NaN }, new AbortController().signal, () => {})).rejects.toThrow(/integer/);
    await expect(runMission({ ...input, maxRejections: 0.5 }, new AbortController().signal, () => {})).rejects.toThrow(/integer/);
  });
});
