"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Alert } from "@/design-system/components/alert";
import { buttonVariants } from "@/design-system/components/button";
import { Card } from "@/design-system/components/card";
import { MetricCard } from "@/design-system/components/metric-card";
import { Meter } from "@/design-system/components/meter";
import { StatusBadge } from "@/design-system/components/status-badge";
import { Stepper } from "@/design-system/components/stepper";
import { cn } from "@/design-system/utils";
import { DEMO_TASKS, getDemoSummary, runDemo } from "@/lib/mesa/demo";

const PHASES = ["Planner", "Researcher", "Writer", "Reviewer"];

export default function AppPage() {
  const [taskId, setTaskId] = useState(DEMO_TASKS[0].id);

  const summary = useMemo(() => {
    const task = DEMO_TASKS.find((t) => t.id === taskId) ?? DEMO_TASKS[0];
    return getDemoSummary(runDemo(task.task));
  }, [taskId]);

  const revisionCount = summary.steps.filter(
    (s) => s.agent === "writer" && s.input.startsWith("revise"),
  ).length;

  const approved = summary.verdict === "approve";
  const budget = summary.budget as {
    subqueriesUsed: number;
    subqueriesMax: number;
    tokensUsed: number;
    tokensMax: number;
    stepsUsed: number;
    stepsMax: number;
    wallClockMs: number;
    wallClockMax: number;
    exhausted: boolean;
    exhaustedReason: string | null;
  };

  const agentOrder = ["planner", "researcher", "writer", "reviewer"];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Inicio
            </Link>
            <div className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <svg className="h-4 w-4 text-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground leading-tight">Mesa</h1>
                <p className="text-xs text-muted-foreground">Multi-agent orchestration</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="info" dot className="px-3 py-1">
              Demo mode
            </StatusBadge>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* ── TASK SELECTOR ───────────────────── */}
        <section className="flex flex-wrap items-center gap-2">
          {DEMO_TASKS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTaskId(t.id)}
              className={cn(
                buttonVariants({ variant: t.id === taskId ? "default" : "outline", size: "sm" }),
              )}
            >
              {t.label}
            </button>
          ))}
        </section>

        {/* ── SUMMARY BAR ─────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Agentes" value={4} hint="supervisor + 3 especialistas" />
          <MetricCard label="Pasos" value={summary.steps.length} />
          <MetricCard label="Tokens" value={summary.trace.totalTokens} />
          <MetricCard
            label="Veredicto"
            value={approved ? "Aprobado" : "Rechazado"}
            tone={approved ? "success" : "danger"}
            hint={revisionCount > 0 ? `${revisionCount} revisión(es)` : "sin revisiones"}
          />
        </div>

        {/* ── GRAPH + PHASE FLOW ──────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Grafo de handoffs tipados</h2>
          <p className="text-sm text-muted-foreground mb-5">
            supervisor → planner → researcher → writer ⇄ reviewer. Cada handoff valida un
            schema estructural (queries, findings, draft, feedback), no una &quot;persona&quot;.
          </p>
          <Stepper steps={PHASES} current={PHASES.length} />
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {agentOrder.map((agent, i) => (
              <span key={agent} className="flex items-center gap-2">
                <span className="font-mono text-foreground">{agent}</span>
                {i < agentOrder.length - 1 && (
                  <span className="text-muted-foreground">
                    {agent === "writer" && i === 2 ? "⇄" : "→"}
                  </span>
                )}
              </span>
            ))}
          </div>
        </section>

        {/* ── BUDGET ENFORCEMENT ──────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Presupuesto (enforced en código)</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Sub-queries, tokens, pasos y wall-clock se chequean en cada paso. Si un límite
            se cruza, el grafo se detiene determinísticamente — no se le pide al prompt.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Card className="p-5 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Sub-queries</span>
                  <span className="tabular-nums">{budget.subqueriesUsed}/{budget.subqueriesMax}</span>
                </div>
                <Meter value={budget.subqueriesUsed} max={budget.subqueriesMax} tone={budget.subqueriesUsed >= budget.subqueriesMax ? "danger" : "info"} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tokens</span>
                  <span className="tabular-nums">{budget.tokensUsed}/{budget.tokensMax}</span>
                </div>
                <Meter value={budget.tokensUsed} max={budget.tokensMax} tone={budget.tokensUsed >= budget.tokensMax ? "danger" : "info"} />
              </div>
            </Card>
            <Card className="p-5 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Pasos</span>
                  <span className="tabular-nums">{budget.stepsUsed}/{budget.stepsMax}</span>
                </div>
                <Meter value={budget.stepsUsed} max={budget.stepsMax} tone={budget.stepsUsed >= budget.stepsMax ? "danger" : "info"} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Wall-clock</span>
                  <span className="tabular-nums">{budget.wallClockMs}ms / {budget.wallClockMax}ms</span>
                </div>
                <Meter value={budget.wallClockMs} max={budget.wallClockMax} tone={budget.wallClockMs >= budget.wallClockMax ? "danger" : "info"} />
              </div>
            </Card>
          </div>
          {budget.exhausted && (
            <Alert tone="warning" title="Presupuesto agotado" className="mt-4">
              El grafo terminó porque se cruzó el límite de <strong>{budget.exhaustedReason}</strong>. Sin
              excepciones sin manejar, sin bucles infinitos.
            </Alert>
          )}
        </section>

        {/* ── REVIEWER SUBGRAPH ──────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Revisor que termina</h2>
          <p className="text-sm text-muted-foreground mb-5">
            El revisor puede devolver el trabajo exactamente una vez. El contador de rechazos
            es estrictamente creciente y acotado, así que el grafo siempre converge.
          </p>
          <div className="flex items-center gap-3">
            <StatusBadge tone={approved ? "success" : "danger"}>
              {approved ? "APPROVE" : "REJECT"}
            </StatusBadge>
            <span className="text-sm text-muted-foreground">
              {revisionCount > 0
                ? `El primer borrador fue devuelto (reject_and_revise) y se revisó ${revisionCount} vez/veces antes del veredicto final.`
                : "El borrador fue aprobado en la primera pasada."}
            </span>
          </div>
        </section>

        {/* ── STEP TRACE ──────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Trace paso a paso</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Qué agente, qué recibió, qué produjo, cuántos tokens y cuánta latencia. El trace es
            duradero: puedes resumir la run desde un snapshot.
          </p>
          <div className="overflow-x-auto rounded-[var(--radius-md)] shadow-[var(--shadow-card)] bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agente</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Input</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tokens</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {summary.steps.map((step, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 font-mono text-xs text-foreground">{step.agent}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[220px] truncate">{step.input}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[220px] truncate">{step.output}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{step.tokens}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{step.latencyMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="pt-8 border-t border-[var(--border)] flex items-center justify-between text-xs text-muted-foreground">
          <span>Mesa · Multi-agent orchestration · Demo mode</span>
          <a href="https://github.com/mdeasis27/mesa" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-mono">GitHub</a>
        </footer>
      </div>
    </div>
  );
}
