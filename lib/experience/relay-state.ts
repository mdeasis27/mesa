import type { FlowTone } from "@/design-system/demo/flow-diagram";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import type { RunState } from "@/lib/mesa/types";

export const RELAY = ["planner", "researcher", "writer", "reviewer"] as const;
export type RelayAgent = (typeof RELAY)[number];

/** Delivered means the reviewer approved a draft before the budget ran out. */
export function delivered(run: RunState): boolean {
  return !run.budget.exhausted && run.reviewerPassed && Boolean(run.draft);
}

/** Done agents are green; once every step is shown, the first agent the budget never reached is the stop and the rest are off. */
export function relayState(run: RunState, revealed: number): Record<RelayAgent, FlowTone> {
  const steps = run.trace.steps;
  const shown = new Set(steps.slice(0, revealed).map(s => s.agentId));
  const all = revealed >= steps.length;
  const stop = run.budget.exhausted ? RELAY.find(a => !steps.some(s => s.agentId === a)) : undefined;
  return Object.fromEntries(RELAY.map(a => [a, shown.has(a) ? "success" : !all ? "idle" : a === stop ? "danger" : "off"])) as Record<RelayAgent, FlowTone>;
}

export type RelayFrame = {
  tones: Record<RelayAgent, FlowTone>;
  /** Runners that already ran their leg in the revealed steps. */
  ran: Record<RelayAgent, boolean>;
  /** Handoff point the baton sits at: 0 is the start line, 4 is the finish line. */
  baton: number;
  dropped: boolean;
  timeUp: boolean;
  stepsLeft: number;
  finished: number;
};

/** What the relay looks like after `revealed` steps; once every step is shown the clock reads the real steps spent. */
export function relayFrame(run: RunState, revealed: number, maxSteps: number): RelayFrame {
  const steps = run.trace.steps;
  const shown = Math.min(revealed, steps.length);
  const all = shown >= steps.length;
  const tones = relayState(run, revealed);
  const ranIds = new Set(steps.slice(0, shown).map(s => s.agentId));
  const last = shown > 0 ? RELAY.indexOf(steps[shown - 1].agentId as RelayAgent) : -1;
  return {
    tones,
    ran: Object.fromEntries(RELAY.map(a => [a, ranIds.has(a)])) as Record<RelayAgent, boolean>,
    baton: last + 1,
    dropped: all && !delivered(run),
    timeUp: all && run.budget.exhausted,
    stepsLeft: Math.max(0, maxSteps - (all ? run.budget.stepsUsed : shown)),
    finished: Object.values(tones).filter(t => t === "success").length,
  };
}

export function revealedSteps(frame: { visible: number; total: number; complete: boolean }, n: number, reducedMotion: boolean): number {
  if (reducedMotion || frame.complete || frame.total === 0) return n;
  return Math.min(n, frame.visible);
}

export const COMPLETE_FRAME: PlaybackFrame<TraceEvent> = { visible: 0, total: 0, event: undefined, complete: true };
