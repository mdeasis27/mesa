// lib/mesa/types.ts
// Core types for Mesa — multi-agent orchestration with typed handoffs,
// budget enforcement, step-by-step tracing and reviewer subgraph.

export type AgentId = string;
export type RunId = string;

export type AgentRole = "supervisor" | "planner" | "researcher" | "writer";

export type AgentDefinition = {
  id: AgentId;
  role: AgentRole;
  description: string;
};

export type MessagePayload = {
  content: string;
  metadata?: Record<string, unknown>;
};

export type HandoffSchema = {
  from: AgentId;
  to: AgentId;
  payloadSchema: Record<string, { type: "string" | "number" | "boolean" | "string[]" }>;
};

export type Handoff = {
  timestamp: number;
  from: AgentId;
  to: AgentId;
  payload: Record<string, unknown>;
};

export type StepResult = {
  agentId: AgentId;
  input: MessagePayload;
  output: MessagePayload;
  tokensUsed: number;
  latencyMs: number;
  handoff?: Handoff;
};

export type Trace = {
  runId: RunId;
  task: string;
  startedAt: string;
  finishedAt?: string;
  steps: StepResult[];
  totalTokens: number;
  totalLatencyMs: number;
  terminated: boolean;
  terminationReason?: string;
};

export type BudgetConfig = {
  maxSubqueries: number;
  maxTokens: number;
  maxSteps: number;
  maxWallClockMs: number;
};

export type BudgetState = {
  subqueriesUsed: number;
  tokensUsed: number;
  stepsUsed: number;
  startedAt: number;
  exhausted: boolean;
  exhaustedReason?: string;
};

export type ReviewVerdict = "approve" | "reject" | "reject_and_revise";

export type ReviewResult = {
  verdict: ReviewVerdict;
  feedback?: string;
  issue?: string;
};

export type GraphEdge = {
  from: AgentId;
  to: AgentId;
  condition?: (state: RunState) => boolean;
};

export type RunState = {
  runId: RunId;
  task: string;
  researchResults: ResearchItem[];
  plan: PlanSection[];
  draft: string;
  finalOutput: string;
  phase: "planning" | "researching" | "writing" | "reviewing" | "done";
  budget: BudgetState;
  trace: Trace;
  reviewerPassed: boolean;
  reviewerUsed: boolean;
};

export type ResearchItem = {
  id: string;
  query: string;
  result: string;
  tokensUsed: number;
  latencyMs: number;
};

export type PlanSection = {
  id: string;
  title: string;
  description: string;
  researchNeeded: boolean;
  assignedQuery?: string;
};

export type MesaConfig = {
  agents: AgentDefinition[];
  handoffSchemas: HandoffSchema[];
  budget: BudgetConfig;
  graph: GraphEdge[];
};
