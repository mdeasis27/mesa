"use client";
import { useEffect, useId, useState } from "react";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import type { FlowTone } from "@/design-system/demo/flow-diagram";
import { StoryStage } from "@/design-system/demo/decision-lab";
import { useReducedMotion } from "@/design-system/demo/project-story";
import type { RunState } from "@/lib/mesa/types";
import { RELAY, relayFrame, revealedSteps } from "./relay-state";
import { STORY } from "./story";

// Track geometry in SVG units: four legs between five handoff points, the last one is the finish line.
const HANDOFF = [30, 195, 360, 525, 690];
const GROUND = 96;
const TONE_CLASS: Record<FlowTone, string> = { success: "text-success", danger: "text-danger", off: "text-muted-foreground/50", idle: "text-muted-foreground", active: "text-info" };
const TONE_MARK: Record<FlowTone, string> = { success: "✓", danger: "×", off: "–", idle: "·", active: "›" };
const MOVE = "transition-transform duration-700 ease-out motion-reduce:transition-none";

function Wedges({ total, left }: { total: number; left: number }) {
  const r = 46;
  const point = (i: number) => { const a = (i / total) * 2 * Math.PI - Math.PI / 2; return `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`; };
  return <>{Array.from({ length: total }, (_, i) => total === 1
    ? <circle key={i} r={r} className={`fill-warning transition-opacity duration-500 motion-reduce:transition-none ${i < left ? "opacity-90" : "opacity-10"}`} />
    : <path key={i} d={`M0 0 L${point(i)} A${r} ${r} 0 0 1 ${point(i + 1)} Z`} strokeWidth={2} className={`fill-warning stroke-surface transition-opacity duration-500 motion-reduce:transition-none ${i < left ? "opacity-90" : "opacity-10"}`} />)}</>;
}

export function MesaStoryScene({ frame, result, maxSteps, locale }: { frame: PlaybackFrame<TraceEvent>; result: RunState; maxSteps: number; locale: "en" | "es" }) {
  const copy = STORY[locale].scene;
  const reduced = useReducedMotion();
  const checker = useId();
  // Paint the start line first so the opening leg runs instead of appearing finished.
  const [started, setStarted] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => requestAnimationFrame(() => setStarted(true))); return () => cancelAnimationFrame(id); }, []);
  const live = started || reduced;
  const n = result.trace.steps.length;
  const view = relayFrame(result, live ? revealedSteps(frame, n, reduced) : 0, maxSteps);
  const complete = live && (reduced || frame.complete || frame.total === 0);
  const batonX = HANDOFF[view.baton] + (view.baton === 4 ? 0 : 14);
  const label = copy.trackLabel(view.finished, view.stepsLeft);

  return <StoryStage locale={locale} title={copy.title} caption={copy.caption} step={frame.visible} total={frame.total}>
    <div className="flex items-center gap-4 sm:gap-6">
      <svg viewBox="-60 -72 120 132" className="h-24 w-24 shrink-0" aria-hidden="true">
        <rect x={-9} y={-70} width={18} height={10} rx={3} className="fill-border" />
        <circle r={56} strokeWidth={4} className={`fill-background ${view.timeUp ? "stroke-danger" : "stroke-border"}`} />
        <Wedges total={maxSteps} left={view.stepsLeft} />
        <circle r={28} className="fill-background" />
        <text y={10} textAnchor="middle" fontSize={28} fontWeight={700} className="fill-foreground font-mono">{view.stepsLeft}</text>
      </svg>
      <div className="min-w-0">
        <p className={`font-mono text-xs uppercase tracking-wider ${view.timeUp ? "text-danger" : "text-muted-foreground"}`}>{view.timeUp ? copy.timeUp : copy.budgetOf(maxSteps)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.stepsLeft(view.stepsLeft)}</p>
      </div>
    </div>

    <svg viewBox="0 0 720 150" className="mt-6 block h-auto w-full" role="img" aria-label={label}>
      <defs>
        <pattern id={checker} width={8} height={8} patternUnits="userSpaceOnUse">
          <rect width={8} height={8} className="fill-foreground" /><rect width={4} height={4} className="fill-background" /><rect x={4} y={4} width={4} height={4} className="fill-background" />
        </pattern>
      </defs>
      <rect x={10} y={GROUND - 22} width={700} height={44} rx={22} className="fill-foreground/10" />
      <line x1={20} y1={GROUND} x2={700} y2={GROUND} strokeDasharray="6 8" className="stroke-border" />
      {HANDOFF.slice(1, 4).map(x => <line key={x} x1={x} y1={GROUND - 20} x2={x} y2={GROUND + 20} strokeWidth={2} className="stroke-border" />)}
      <rect x={HANDOFF[4] - 4} y={GROUND - 30} width={8} height={60} fill={`url(#${checker})`} />
      <text x={HANDOFF[4] + 8} y={GROUND + 48} textAnchor="end" fontSize={20} className="fill-muted-foreground">{copy.finish}</text>
      {RELAY.map((id, i) => {
        const tone = view.tones[id];
        const x = view.ran[id] ? HANDOFF[i + 1] - 34 : HANDOFF[i] + 34;
        return <g key={id} className={`${MOVE} ${TONE_CLASS[tone]}`} style={{ transform: `translate(${x}px, ${GROUND - 4}px)` }}>
          <g stroke="currentColor" strokeWidth={4} strokeLinecap="round" fill="none">
            <circle cy={-36} r={8} fill="currentColor" />
            <path d="M0 -28 L-3 -8 M-3 -8 L-12 6 M-3 -8 L6 6 M-1 -22 L-11 -14 M-1 -22 L10 -18" />
          </g>
          {tone === "danger" ? <path d="M-14 -50 L14 -22 M14 -50 L-14 -22" stroke="currentColor" strokeWidth={5} strokeLinecap="round" /> : null}
        </g>;
      })}
      <g className={MOVE} style={{ transform: `translate(${batonX}px, ${GROUND - 14}px)` }}>
        <g className="transition-transform delay-700 duration-500 ease-in motion-reduce:transition-none" style={{ transform: view.dropped ? "translate(0px, 30px) rotate(70deg)" : "none" }}>
          <rect x={-16} y={-6} width={32} height={12} rx={6} strokeWidth={3} className={view.dropped ? "fill-muted-foreground stroke-background" : "fill-warning stroke-background"} />
        </g>
      </g>
    </svg>

    <ol className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      {RELAY.map(id => {
        const tone = view.tones[id];
        return <li key={id} className="min-w-0 sm:text-center">
          <p className="text-sm font-semibold">{copy.nodes[id].name}</p>
          <p className={`text-xs leading-5 ${TONE_CLASS[tone]}`}><span aria-hidden="true" className="mr-1 font-mono">{TONE_MARK[tone]}</span>{copy.statusLabels[tone === "active" ? "idle" : tone]}</p>
        </li>;
      })}
    </ol>

    <p className="mt-6 font-mono text-2xl font-semibold tracking-tight">{copy.legsOf(view.finished)}</p>
    {complete ? <p className={`mt-1 text-sm ${view.dropped ? "text-danger" : "text-success"}`}>{view.dropped ? copy.dropped : copy.delivered}</p> : null}
  </StoryStage>;
}
