"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/design-system/components/card";
import { MetricCard } from "@/design-system/components/metric-card";
import { StatusBadge } from "@/design-system/components/status-badge";
import { DEMO_TASKS, DEFAULT_BUDGET } from "@/lib/mesa/demo";

interface RunSummary {
  runId: string;
  task: string;
  verdict: "approve" | "reject";
  sections: number;
  findingsCount: number;
  draftChars: number;
  trace: { stepCount: number; totalTokens: number; totalLatencyMs: number };
  budget: {
    tokensUsed: number;
    stepsUsed: number;
    exhausted: boolean;
    exhaustedReason: string | null;
  };
  plan: { id: string; title: string }[];
  findings: string[];
  draft: string;
}

interface RunHistoryItem {
  id: number;
  task: string;
  verdict: string;
  sections: number;
  findings: number;
  steps: number;
  tokens: number;
  created_at: string;
}

export default function AppPage() {
  const [taskId, setTaskId] = useState(DEMO_TASKS[0].id);
  const [maxSteps, setMaxSteps] = useState(DEFAULT_BUDGET.maxSteps);
  const [maxSubqueries, setMaxSubqueries] = useState(DEFAULT_BUDGET.maxSubqueries);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RunHistoryItem[]>([]);

  const task = DEMO_TASKS.find((t) => t.id === taskId)?.task ?? DEMO_TASKS[0].task;

  async function run() {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, maxSteps, maxSubqueries }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error ejecutando la orquestación");
      } else {
        setSummary(data);
        loadHistory();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.runs ?? []);
      }
    } catch {
      /* history is best-effort */
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const approved = summary?.verdict === "approve";

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
            <StatusBadge tone="success" dot className="px-3 py-1">Postgres en vivo</StatusBadge>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* ── SUMMARY BAR ─────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Agentes" value={4} hint="supervisor + 3 especialistas" />
          <MetricCard label="Pasos" value={summary ? summary.trace.stepCount : "—"} />
          <MetricCard label="Tokens" value={summary ? summary.trace.totalTokens : "—"} />
          <MetricCard
            label="Veredicto"
            value={summary ? (approved ? "Aprobado" : "Rechazado") : "—"}
            tone={summary ? (approved ? "success" : "danger") : "neutral"}
          />
        </div>

        {/* ── PLAYGROUND ──────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Orquestación en vivo</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Elige una tarea de la demo, ajusta el presupuesto y ejecuta el grafo
            supervisor → planner → researcher → writer ⇄ reviewer en el backend. Cada
            corrida queda persistida en Postgres.
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
              </select>
            </div>

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
              disabled={loading}
              className="w-full rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-medium text-[#ffffff] hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Ejecutando…" : "Ejecutar orquestación"}
            </button>
          </Card>

          {error && (
            <div className="mt-4 rounded-[var(--radius-md)] border border-danger/25 bg-danger/10 p-4 text-sm text-foreground">
              {error}
            </div>
          )}

          {summary && (
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
          )}
        </section>

        {/* ── HISTORY ─────────────────────────── */}
        {history.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Historial de corridas (persistido en Postgres)</h3>
            <div className="overflow-x-auto rounded-[var(--radius-md)] shadow-[var(--shadow-card)] bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tarea</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Veredicto</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Secciones</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Findings</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pasos</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tokens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="px-4 py-2.5 text-foreground max-w-xs truncate">{h.task}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge tone={h.verdict === "approve" ? "success" : "danger"}>
                          {h.verdict}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{h.sections}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{h.findings}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{h.steps}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{h.tokens}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <footer className="pt-8 border-t border-[var(--border)] flex items-center justify-between text-xs text-muted-foreground">
          <span>Mesa · Multi-agent orchestration · Backend + Postgres</span>
          <a href="https://github.com/mdeasis27/mesa" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-mono">GitHub</a>
        </footer>
      </div>
    </div>
  );
}
