"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/design-system/components/card";
import { MetricCard } from "@/design-system/components/metric-card";
import { StatusBadge } from "@/design-system/components/status-badge";
import { DEMO_TASKS, DEFAULT_BUDGET, getDemoSummary, runDemo } from "@/lib/mesa/demo";
import type { BudgetConfig } from "@/lib/mesa/types";

type Summary = ReturnType<typeof getDemoSummary>;

export default function AppPage() {
  const [taskId, setTaskId] = useState(DEMO_TASKS[0].id);
  const [customTask, setCustomTask] = useState("");
  const [maxSteps, setMaxSteps] = useState(DEFAULT_BUDGET.maxSteps);
  const [maxSubqueries, setMaxSubqueries] = useState(DEFAULT_BUDGET.maxSubqueries);
  const [summary, setSummary] = useState<Summary>(() =>
    getDemoSummary(runDemo(DEMO_TASKS[0].task)),
  );

  const approved = summary.verdict === "approve";
  const customMode = taskId === "custom";
  const effectiveTask = customMode
    ? customTask.trim()
    : (DEMO_TASKS.find((t) => t.id === taskId)?.task ?? DEMO_TASKS[0].task);

  function run() {
    if (!effectiveTask) return;
    const budget: BudgetConfig = { ...DEFAULT_BUDGET, maxSteps, maxSubqueries };
    setSummary(getDemoSummary(runDemo(effectiveTask, budget)));
  }

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
        {/* ── SUMMARY BAR ─────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Agentes" value={4} hint="supervisor + 3 especialistas" />
          <MetricCard label="Pasos" value={summary.trace.stepCount} />
          <MetricCard label="Tokens" value={summary.trace.totalTokens} />
          <MetricCard
            label="Veredicto"
            value={approved ? "Aprobado" : "Rechazado"}
            tone={approved ? "success" : "danger"}
          />
        </div>

        {/* ── PLAYGROUND ──────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Orquestación en vivo</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Elige una tarea de la demo o escribe la tuya, ajusta el presupuesto y ejecuta el grafo
            supervisor → planner → researcher → writer ⇄ reviewer.
          </p>

          <Card className="p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-sm text-foreground">Tarea</span>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
              >
                {DEMO_TASKS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
                <option value="custom">Tarea personalizada…</option>
              </select>
            </div>

            {customMode && (
              <div className="space-y-1">
                <span className="text-sm text-foreground">Describe tu tarea</span>
                <textarea
                  value={customTask}
                  onChange={(e) => setCustomTask(e.target.value)}
                  placeholder="Ej. Investigar cómo funciona el fraude con tarjetas y qué controles lo mitigan."
                  rows={3}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Pasos máximos</span>
                <span className="font-mono text-sm tabular-nums text-foreground">{maxSteps}</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={maxSteps}
                onChange={(e) => setMaxSteps(Number(e.target.value))}
                className="w-full accent-foreground"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Sub-queries máximas</span>
                <span className="font-mono text-sm tabular-nums text-foreground">{maxSubqueries}</span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={maxSubqueries}
                onChange={(e) => setMaxSubqueries(Number(e.target.value))}
                className="w-full accent-foreground"
              />
            </div>

            <button
              onClick={run}
              disabled={customMode && !customTask.trim()}
              className="w-full rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-medium text-[#ffffff] hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              Ejecutar orquestación
            </button>
          </Card>

          <Card className="mt-4 p-5 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone={approved ? "success" : "danger"} dot>
                {approved ? "APPROVE" : "REJECT"}
              </StatusBadge>
              <span className="text-sm text-muted-foreground truncate">{summary.task}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Secciones</p>
                <p className="font-semibold text-foreground">{summary.sections}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Findings</p>
                <p className="font-semibold text-foreground">{summary.findingsCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Pasos</p>
                <p className="font-semibold text-foreground">{summary.trace.stepCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Tokens</p>
                <p className="font-semibold text-foreground">{summary.budget.tokensUsed}</p>
              </div>
            </div>

            {summary.budget.exhausted && (
              <div className="rounded-[var(--radius-md)] border border-warning/25 bg-warning/10 p-3 text-sm text-foreground">
                Presupuesto agotado: se cruzó el límite de <strong>{summary.budget.exhaustedReason}</strong>.
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Plan</p>
              <ul className="space-y-1.5">
                {summary.plan.map((section) => (
                  <li key={section.id} className="text-sm text-foreground">
                    <span className="text-muted-foreground">•</span> {section.title}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Findings</p>
              <ul className="space-y-1.5">
                {summary.findings.map((finding, i) => (
                  <li key={i} className="text-sm text-foreground">
                    <span className="text-muted-foreground">•</span> {finding}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Borrador</p>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-background p-4 text-sm text-foreground whitespace-pre-wrap">
                {summary.draft}
              </div>
            </div>
          </Card>
        </section>

        <footer className="pt-8 border-t border-[var(--border)] flex items-center justify-between text-xs text-muted-foreground">
          <span>Mesa · Multi-agent orchestration · Demo mode</span>
          <a href="https://github.com/mdeasis27/mesa" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-mono">GitHub</a>
        </footer>
      </div>
    </div>
  );
}
