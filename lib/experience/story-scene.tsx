"use client";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { StoryStage } from "@/design-system/demo/decision-lab";
import { useReducedMotion } from "@/design-system/demo/project-story";
import { FlowDiagram } from "@/design-system/demo/flow-diagram";
import type { RunState } from "@/lib/mesa/types";
import { RELAY, relayState, revealedSteps } from "./relay-state";
import { STORY } from "./story";

export function MesaStoryScene({ frame, result, locale }: { frame: PlaybackFrame<TraceEvent>; result: RunState; locale: "en" | "es" }) {
  const copy = STORY[locale].scene;
  const reduced = useReducedMotion();
  const tones = relayState(result, revealedSteps(frame, result.trace.steps.length, reduced));
  const done = Object.values(tones).filter(t => t === "success").length;
  const nodes = RELAY.map((id, i) => ({ id, x: 10 + i * 160, y: 15, ...copy.nodes[id], tone: tones[id] }));
  const edges = RELAY.slice(1).map((to, i) => ({ from: RELAY[i], to, tone: tones[to] === "idle" ? undefined : tones[to] }));
  return <StoryStage locale={locale} title={copy.title} caption={copy.caption} step={frame.visible} total={frame.total}>
    <FlowDiagram nodes={nodes} edges={edges} width={650} height={100} ariaLabel={copy.legsOf(done)} statusLabels={copy.statusLabels} />
    <p className="mt-6 font-mono text-2xl font-semibold tracking-tight">{copy.legsOf(done)}</p>
  </StoryStage>;
}
