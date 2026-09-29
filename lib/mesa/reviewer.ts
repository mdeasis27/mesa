// lib/mesa/reviewer.ts
// A reviewer that can send work back a bounded number of times. The review
// subgraph is a two-node loop (writer → reviewer → writer) whose rejection
// counter is strictly increasing and capped, so the graph always terminates.
// This is the core termination argument for the whole orchestrator.

import type { ReviewResult } from "./types";

export type ReviewDecision =
  | { action: "approve" }
  | { action: "reject" }
  | { action: "revise"; rejectCount: number };

export type Reviewer = (input: {
  draft: string;
  topic: string;
  rejectCount: number;
}) => ReviewResult;

export const DEFAULT_MAX_REJECTIONS = 1;

export function createReviewer(maxRejections: number = DEFAULT_MAX_REJECTIONS) {
  return {
    maxRejections,
    /**
     * Maps a reviewer verdict + current rejection count to a decision. The
     * count is strictly increasing and bounded by `maxRejections`, so a graph
     * that consumes these decisions terminates by construction.
     */
    apply(result: ReviewResult, rejectCount: number): ReviewDecision {
      if (result.verdict === "approve") return { action: "approve" };
      if (result.verdict === "reject") return { action: "reject" };
      if (rejectCount < maxRejections) {
        return { action: "revise", rejectCount: rejectCount + 1 };
      }
      return { action: "reject" };
    },
  };
}

export function subgraphStepCount(maxRejections: number): number {
  // planner + researcher + writer + reviewer, plus (writer + reviewer) per revision.
  return 4 + maxRejections * 2;
}
