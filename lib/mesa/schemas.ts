// lib/mesa/schemas.ts
// Typed schemas for inter-agent handoffs. These are structural contracts —
// not "personas" — validated at runtime in the orchestrator.

import type { HandoffSchema } from "./types";

export const PLAN_TO_RESEARCH: HandoffSchema = {
  from: "planner",
  to: "researcher",
  payloadSchema: {
    queries: { type: "string[]" },
    context: { type: "string" },
  },
};

export const RESEARCH_TO_WRITER: HandoffSchema = {
  from: "researcher",
  to: "writer",
  payloadSchema: {
    findings: { type: "string[]" },
    citations: { type: "string[]" },
    topic: { type: "string" },
  },
};

export const WRITER_TO_REVIEWER: HandoffSchema = {
  from: "writer",
  to: "reviewer",
  payloadSchema: {
    draft: { type: "string" },
    wordCount: { type: "number" },
    topic: { type: "string" },
  },
};

export const REVIEWER_TO_WRITER: HandoffSchema = {
  from: "reviewer",
  to: "writer",
  payloadSchema: {
    feedback: { type: "string" },
    issues: { type: "string[]" },
  },
};

export const SUPERVISOR_TO_PLANNER: HandoffSchema = {
  from: "supervisor",
  to: "planner",
  payloadSchema: {
    task: { type: "string" },
    maxSections: { type: "number" },
  },
};

export const ALL_HANDOFF_SCHEMAS: HandoffSchema[] = [
  SUPERVISOR_TO_PLANNER,
  PLAN_TO_RESEARCH,
  RESEARCH_TO_WRITER,
  WRITER_TO_REVIEWER,
  REVIEWER_TO_WRITER,
];

export function validateHandoff(
  schema: HandoffSchema,
  payload: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const [key, spec] of Object.entries(schema.payloadSchema)) {
    if (!(key in payload)) {
      errors.push(`missing key: ${key}`);
      continue;
    }
    const value = payload[key];
    const actualType = Array.isArray(value) ? "string[]" : typeof value;
    if (actualType !== spec.type) {
      errors.push(`key ${key}: expected ${spec.type}, got ${actualType}`);
    }
  }
  for (const key of Object.keys(payload)) {
    if (!(key in schema.payloadSchema)) {
      errors.push(`unexpected key: ${key}`);
    }
  }
  return { valid: errors.length === 0, errors };
}
