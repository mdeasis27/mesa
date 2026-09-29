// lib/mesa/budget.ts
// Runtime budget enforcement. Every step, handoff and sub-query checks
// against the configured limits. The budget is enforced in code, not in a
// prompt — it halts the graph deterministically.

import type { BudgetConfig, BudgetState } from "./types";

export function createBudget(): BudgetState {
  return {
    subqueriesUsed: 0,
    tokensUsed: 0,
    stepsUsed: 0,
    startedAt: Date.now(),
    exhausted: false,
  };
}

export function checkBudget(state: BudgetState, config: BudgetConfig): BudgetState {
  if (state.exhausted) return state;

  const elapsedMs = Date.now() - state.startedAt;

  if (state.subqueriesUsed >= config.maxSubqueries) {
    return { ...state, exhausted: true, exhaustedReason: "subqueries" };
  }
  if (state.tokensUsed >= config.maxTokens) {
    return { ...state, exhausted: true, exhaustedReason: "tokens" };
  }
  if (state.stepsUsed >= config.maxSteps) {
    return { ...state, exhausted: true, exhaustedReason: "steps" };
  }
  if (elapsedMs >= config.maxWallClockMs) {
    return { ...state, exhausted: true, exhaustedReason: "wallclock" };
  }

  return state;
}

export function spendSubquery(state: BudgetState): BudgetState {
  return { ...state, subqueriesUsed: state.subqueriesUsed + 1 };
}

export function spendTokens(state: BudgetState, tokens: number): BudgetState {
  return { ...state, tokensUsed: state.tokensUsed + tokens };
}

export function spendStep(state: BudgetState, tokens: number): BudgetState {
  return {
    ...state,
    stepsUsed: state.stepsUsed + 1,
    tokensUsed: state.tokensUsed + tokens,
  };
}

export function budgetSummary(state: BudgetState, config: BudgetConfig): string {
  const elapsedMs = Date.now() - state.startedAt;
  return [
    `subqueries: ${state.subqueriesUsed}/${config.maxSubqueries}`,
    `tokens: ${state.tokensUsed}/${config.maxTokens}`,
    `steps: ${state.stepsUsed}/${config.maxSteps}`,
    `wall-clock: ${elapsedMs}ms/${config.maxWallClockMs}ms`,
    state.exhausted ? `EXHAUSTED: ${state.exhaustedReason}` : "active",
  ].join(" · ");
}

export function snapshotState(
  state: BudgetState,
  config: BudgetConfig,
): Record<string, unknown> {
  const elapsedMs = Date.now() - state.startedAt;
  return {
    subqueriesUsed: state.subqueriesUsed,
    subqueriesMax: config.maxSubqueries,
    tokensUsed: state.tokensUsed,
    tokensMax: config.maxTokens,
    stepsUsed: state.stepsUsed,
    stepsMax: config.maxSteps,
    wallClockMs: elapsedMs,
    wallClockMax: config.maxWallClockMs,
    exhausted: state.exhausted,
    exhaustedReason: state.exhaustedReason ?? null,
  };
}
