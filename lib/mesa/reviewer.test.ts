import { describe, expect, it } from "vitest";

import { createReviewer, subgraphStepCount } from "./reviewer";

describe("reviewer subgraph terminates", () => {
  it("approves immediately on approve verdict", () => {
    const r = createReviewer(1);
    const out = r.apply({ verdict: "approve" }, 0);
    expect(out.action).toBe("approve");
  });

  it("rejects immediately on hard reject", () => {
    const r = createReviewer(1);
    const out = r.apply({ verdict: "reject" }, 0);
    expect(out.action).toBe("reject");
  });

  it("allows exactly maxRejections revisions then forces reject", () => {
    const r = createReviewer(2);
    // first revision consumed
    const out = r.apply({ verdict: "reject_and_revise" }, 0);
    expect(out.action).toBe("revise");
    if (out.action === "revise") {
      expect(out.rejectCount).toBe(1);
    }
    // second revision consumed
    const out2 = r.apply({ verdict: "reject_and_revise" }, 1);
    expect(out2.action).toBe("revise");
    if (out2.action === "revise") {
      expect(out2.rejectCount).toBe(2);
    }
    // third would exceed cap → hard reject
    const out3 = r.apply({ verdict: "reject_and_revise" }, 2);
    expect(out3.action).toBe("reject");
  });

  it("bounds the subgraph step count", () => {
    expect(subgraphStepCount(1)).toBe(6);
    expect(subgraphStepCount(2)).toBe(8);
  });
});
