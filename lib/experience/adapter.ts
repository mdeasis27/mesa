import { createDemoHandlers } from "@/lib/mesa/demo-agents";
import { runGraph } from "@/lib/mesa/graph";
import type { DemoAdapter, TraceEvent } from "./types";
export type ExperienceInput = { task: string; maxSteps: number; maxTokens: number; maxRejections: number };
export type ExperienceResult = ReturnType<typeof runGraph>;
export const runExperience: DemoAdapter<ExperienceInput, ExperienceResult> = async (input, signal, onEvent) => {
  if (![input.maxSteps,input.maxTokens,input.maxRejections].every(Number.isSafeInteger)) throw new Error("Budgets must be safe integers."); if (!input.task.trim()) throw new Error("A task is required."); if (input.maxSteps < 1 || input.maxTokens < 1 || input.maxRejections < 0) throw new Error("Budgets must be valid positive values."); if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const startedAt = performance.now();
  const result = runGraph(input.task, createDemoHandlers(input.task), { budget: { maxSubqueries: 6, maxTokens: input.maxTokens, maxSteps: input.maxSteps, maxWallClockMs: 120000 }, maxSections: 4, maxRejections: input.maxRejections });
  const trace: TraceEvent[] = result.trace.steps.map((step, index) => ({ id: `${step.agentId}-${index}`, step: index + 1, kind: "handoff", messageKey: step.agentId, timestampMs: performance.now() - startedAt, evidenceIds: step.handoff ? [step.handoff.from, step.handoff.to] : undefined })); for (const event of trace) { if (signal.aborted) throw new DOMException("Aborted", "AbortError"); onEvent(event); if (signal.aborted) throw new DOMException("Aborted", "AbortError"); }
  return { input, result, trace, executionMs: performance.now() - startedAt, mode: "simulation" };
};
