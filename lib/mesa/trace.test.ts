import { describe, expect, it } from "vitest";

import { createTrace, finishTrace, getRunStats, recordStep, traceSnapshot } from "./trace";

describe("trace recording", () => {
  it("records steps with tokens and latency", () => {
    let trace = createTrace("task");
    trace = recordStep(trace, "planner", { content: "in" }, { content: "out" }, 42, 100);
    expect(trace.steps).toHaveLength(1);
    expect(trace.totalTokens).toBe(42);
    expect(trace.totalLatencyMs).toBe(100);
  });

  it("finishes with a reason and marks terminated", () => {
    const trace = finishTrace(createTrace("task"), "approved");
    expect(trace.terminated).toBe(true);
    expect(trace.terminationReason).toBe("approved");
  });

  it("aggregates stats per agent", () => {
    let trace = createTrace("task");
    trace = recordStep(trace, "planner", { content: "a" }, { content: "b" }, 10, 5);
    trace = recordStep(trace, "writer", { content: "a" }, { content: "b" }, 20, 7);
    trace = recordStep(trace, "writer", { content: "a" }, { content: "b" }, 30, 3);
    const stats = getRunStats(trace);
    expect(stats.tokensByAgent.writer).toBe(50);
    expect(stats.callCountByAgent.writer).toBe(2);
    expect(stats.latencyByAgent.planner).toBe(5);
  });

  it("produces a serializable snapshot", () => {
    let trace = createTrace("task");
    trace = recordStep(trace, "planner", { content: "a" }, { content: "b" }, 10, 5);
    const snap = traceSnapshot(trace);
    expect(snap.stepCount).toBe(1);
    expect(snap.steps).toBeInstanceOf(Array);
  });
});
