import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";
import { runDemo, getDemoSummary, DEFAULT_BUDGET } from "@/lib/mesa/demo";

export async function POST(request: Request) {
  let body: { task?: unknown; maxSteps?: unknown; maxSubqueries?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  const task = typeof body.task === "string" ? body.task.trim() : "";
  if (!task) {
    return NextResponse.json({ error: "Escribe una tarea" }, { status: 400 });
  }

  const maxSteps =
    typeof body.maxSteps === "number" && Number.isFinite(body.maxSteps)
      ? Math.max(1, Math.floor(body.maxSteps))
      : DEFAULT_BUDGET.maxSteps;
  const maxSubqueries =
    typeof body.maxSubqueries === "number" && Number.isFinite(body.maxSubqueries)
      ? Math.max(1, Math.floor(body.maxSubqueries))
      : DEFAULT_BUDGET.maxSubqueries;

  try {
    const state = runDemo(task, { ...DEFAULT_BUDGET, maxSteps, maxSubqueries });
    const summary = getDemoSummary(state);

    const db = getSql();
    await db`INSERT INTO mesa.runs (task, verdict, sections, findings, steps, tokens) VALUES (${summary.task}, ${summary.verdict}, ${summary.sections}, ${summary.findingsCount}, ${summary.trace.stepCount}, ${summary.trace.totalTokens})`;

    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error ejecutando la orquestación" },
      { status: 500 },
    );
  }
}
