import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { OutcomeBlock, StoryStage } from "@/design-system/demo/decision-lab";
import type { ExperienceInput, ExperienceResult } from "./adapter";

function translatedReason(reason: string): string {
  const labels: Record<string, string> = {
    approved: "aprobado", rejected: "rechazado",
    "budget exhausted: steps": "límite de pasos alcanzado",
    "budget exhausted: tokens": "límite de tokens alcanzado",
    "budget exhausted: subqueries": "límite de subconsultas alcanzado",
    "budget exhausted: wallclock": "límite de tiempo alcanzado",
  };
  return labels[reason] ?? "detenido para revisión";
}

export function MesaScene({ frame, input, result, locale }: {
  frame: PlaybackFrame<TraceEvent>; input: ExperienceInput;
  result: ExperienceResult; locale: "en" | "es";
}) {
  const es = locale === "es";
  const steps = result.trace.steps.slice(0, frame.visible);
  const reason = result.trace.terminationReason ?? "approved";
  const labels: Record<string, string> = { planner: "plan", researcher: "investiga", writer: "redacta", reviewer: "revisa" };
  const height = Math.max(180, Math.ceil(steps.length / 4) * 100 + 20);
  const position = (index: number) => ({ x: 45 + index % 4 * 105, y: 55 + Math.floor(index / 4) * 100 });
  return <StoryStage locale={locale} title={es ? "Transferencias calculadas" : "Computed handoffs"}
    caption={es ? "Cada nodo aparece al llegar a su evento. La latencia de proxy es simulada." : "Each node appears at its event. Proxy latency is simulated."}
    step={frame.visible} total={frame.total}>
    <svg role="img" aria-label={es ? "Secuencia de agentes y transferencias" : "Agent and handoff sequence"}
      viewBox={`0 0 440 ${height}`} className="w-full">
      {steps.map((step, index) => {
        const point = position(index);
        const previous = position(index - 1);
        return <g key={`${step.agentId}-${index}`}>
          {index > 0 && <path d={`M${previous.x} ${previous.y}L${point.x} ${point.y}`} className="stroke-accent" strokeWidth="2" />}
          <circle cx={point.x} cy={point.y} r="27" className="fill-background stroke-accent" />
          <text x={point.x} y={point.y + 4} textAnchor="middle" className="fill-foreground text-[10px]">{es ? labels[step.agentId] ?? step.agentId : step.agentId}</text>
          <text x={point.x} y={point.y + 43} textAnchor="middle" className="fill-muted-foreground text-[10px]">{index + 1}</text>
        </g>;
      })}
    </svg>
    <p className="text-xs text-muted-foreground">{es ? `Límite: ${input.maxSteps} pasos · ${input.maxTokens} tokens · ${input.maxRejections} revisiones.` : `Budget: ${input.maxSteps} steps · ${input.maxTokens} tokens · ${input.maxRejections} revisions.`}</p>
    {frame.complete && <OutcomeBlock tone={reason === "approved" ? "success" : "warning"}
      title={es ? `Terminación: ${translatedReason(reason)}` : `Termination: ${reason}`}
      explanation={es ? `La latencia de proxy simulada es ${result.trace.totalLatencyMs} ms; la reproducción no mide un modelo en vivo.` : `Simulated proxy latency is ${result.trace.totalLatencyMs} ms; playback does not measure a live model.`} />}
  </StoryStage>;
}
