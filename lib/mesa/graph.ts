// lib/mesa/graph.ts
// The Mesa orchestrator. Runs a fixed DAG of typed handoffs through the four
// agents (supervisor → planner → researcher → writer ⇄ reviewer) with budget
// enforcement and step tracing. Handlers are injected so the same graph runs
// with deterministic demo agents or with real LLM agents in live mode.

import type {
  BudgetConfig,
  BudgetState,
  MessagePayload,
  PlanSection,
  ResearchItem,
  ReviewResult,
  RunState,
  Trace,
} from "./types";

import { checkBudget, createBudget, spendStep, spendSubquery } from "./budget";
import { createTrace, finishTrace, recordStep } from "./trace";
import { createReviewer } from "./reviewer";
import { PLAN_TO_RESEARCH, validateHandoff } from "./schemas";

export type HandlerResult<T> = {
  value: T;
  tokensUsed: number;
  latencyMs: number;
};

export type PlannerHandler = (task: string, maxSections: number) => HandlerResult<PlanSection[]>;
export type ResearcherHandler = (queries: string[]) => HandlerResult<ResearchItem[]>;
export type WriterHandler = (input: {
  plan: PlanSection[];
  findings: ResearchItem[];
  feedback?: string;
}) => HandlerResult<string>;
export type ReviewerHandler = (input: {
  draft: string;
  topic: string;
  rejectCount: number;
}) => HandlerResult<ReviewResult>;

export type MesaHandlers = {
  planner: PlannerHandler;
  researcher: ResearcherHandler;
  writer: WriterHandler;
  reviewer: ReviewerHandler;
};

export type MesaRunConfig = {
  budget: BudgetConfig;
  maxSections: number;
  maxRejections: number;
};

const DEFAULT_RUN_CONFIG: MesaRunConfig = {
  budget: {
    maxSubqueries: 6,
    maxTokens: 10_000,
    maxSteps: 12,
    maxWallClockMs: 120_000,
  },
  maxSections: 4,
  maxRejections: 1,
};

function msg(content: string, metadata?: Record<string, unknown>): MessagePayload {
  return { content, metadata };
}

export function runGraph(
  task: string,
  handlers: MesaHandlers,
  run: MesaRunConfig = DEFAULT_RUN_CONFIG,
): RunState {
  let trace: Trace = createTrace(task);
  let budget: BudgetState = createBudget();
  const reviewer = createReviewer(run.maxRejections);

  const guard = (state: BudgetState): BudgetState => {
    const next = checkBudget(state, run.budget);
    if (next.exhausted) {
      throw new BudgetExhaustedError(next.exhaustedReason ?? "budget exhausted");
    }
    return next;
  };

  try {
    // 1. supervisor → planner
    budget = guard(budget);
    const planInput = msg(task, { maxSections: run.maxSections });
    const planResult = handlers.planner(task, run.maxSections);
    budget = spendStep(budget, planResult.tokensUsed);
    trace = recordStep(trace, "planner", planInput, msg(`plan: ${planResult.value.length} sections`), planResult.tokensUsed, planResult.latencyMs, {
      timestamp: Date.now(),
      from: "supervisor",
      to: "planner",
      payload: { task, maxSections: run.maxSections },
    });

    const plan: PlanSection[] = planResult.value;
    const queries = plan.filter((p) => p.researchNeeded).map((p) => p.assignedQuery ?? p.title);

    // 2. planner → researcher (handoff payload is validated)
    budget = guard(budget);
    const researchPayload = { queries, context: task };
    const handoffCheck = validateHandoff(PLAN_TO_RESEARCH, researchPayload);
    if (!handoffCheck.valid) {
      throw new Error(`invalid plan→researcher handoff: ${handoffCheck.errors.join(", ")}`);
    }
    const researchResult = handlers.researcher(queries);
    budget = spendStep(budget, researchResult.tokensUsed);
    budget = spendSubquery(budget);
    budget = guard(budget);
    trace = recordStep(trace, "researcher", msg(queries.join(" | ")), msg(`${researchResult.value.length} findings`), researchResult.tokensUsed, researchResult.latencyMs, {
      timestamp: Date.now(),
      from: "planner",
      to: "researcher",
      payload: researchPayload,
    });

    const findings: ResearchItem[] = researchResult.value;

    // 3. researcher → writer
    budget = guard(budget);
    const writeInput = { plan, findings };
    const draftResult = handlers.writer(writeInput);
    budget = spendStep(budget, draftResult.tokensUsed);
    trace = recordStep(trace, "writer", msg(`write ${plan.length} sections`), msg(`draft: ${draftResult.value.length} chars`), draftResult.tokensUsed, draftResult.latencyMs, {
      timestamp: Date.now(),
      from: "researcher",
      to: "writer",
      payload: { findings: findings.map((f) => f.result), citations: findings.map((f) => f.id), topic: task },
    });

    let draft = draftResult.value;
    let finalOutput = draft;
    let reviewerPassed = false;
    let reviewerUsed = false;
    let rejectCount = 0;

    // 4. writer ⇄ reviewer loop — bounded by maxRejections, always terminates.
    while (true) {
      budget = guard(budget);
      reviewerUsed = true;
      const reviewInput = { draft, topic: task, rejectCount };
      const reviewResult = handlers.reviewer(reviewInput);
      budget = spendStep(budget, reviewResult.tokensUsed);
      trace = recordStep(trace, "reviewer", msg(`review (rejectCount=${rejectCount})`), msg(`verdict: ${reviewResult.value.verdict}`), reviewResult.tokensUsed, reviewResult.latencyMs, {
        timestamp: Date.now(),
        from: "writer",
        to: "reviewer",
        payload: { draft, wordCount: draft.split(/\s+/).length, topic: task },
      });

      const decision = reviewer.apply(reviewResult.value, rejectCount);

      if (decision.action === "approve") {
        reviewerPassed = true;
        break;
      }
      if (decision.action === "reject") {
        break;
      }

      // decision.action === "revise" — bounded by maxRejections, always terminates.
      rejectCount = decision.rejectCount;
      budget = guard(budget);
      const reviseResult = handlers.writer({ plan, findings, feedback: reviewResult.value.feedback });
      budget = spendStep(budget, reviseResult.tokensUsed);
      trace = recordStep(trace, "writer", msg(`revise: ${reviewResult.value.feedback ?? "feedback"}`), msg(`draft: ${reviseResult.value.length} chars`), reviseResult.tokensUsed, reviseResult.latencyMs, {
        timestamp: Date.now(),
        from: "reviewer",
        to: "writer",
        payload: { feedback: reviewResult.value.feedback ?? "", issues: [] },
      });
      draft = reviseResult.value;
      finalOutput = draft;
    }

    trace = finishTrace(trace, reviewerPassed ? "approved" : "rejected");
    trace = {
      ...trace,
      totalTokens: budget.tokensUsed,
      totalLatencyMs: trace.steps.reduce((s, st) => s + st.latencyMs, 0),
    };

    return {
      runId: trace.runId,
      task,
      researchResults: findings,
      plan,
      draft,
      finalOutput,
      phase: "done",
      budget,
      trace,
      reviewerPassed,
      reviewerUsed,
    };
  } catch (err) {
    if (err instanceof BudgetExhaustedError) {
      trace = finishTrace(trace, err.message);
      return {
        runId: trace.runId,
        task,
        researchResults: [],
        plan: [],
        draft: "",
        finalOutput: "",
        phase: "done",
        budget: { ...budget, exhausted: true, exhaustedReason: err.message },
        trace,
        reviewerPassed: false,
        reviewerUsed: false,
      };
    }
    throw err;
  }
}

export class BudgetExhaustedError extends Error {
  constructor(reason: string) {
    super(`budget exhausted: ${reason}`);
    this.name = "BudgetExhaustedError";
  }
}

export { createReviewer, subgraphStepCount } from "./reviewer";
