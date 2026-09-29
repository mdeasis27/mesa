// lib/mesa/demo-agents.ts
// Deterministic demo handlers for the four agents. They implement the same
// interface as a live LLM-backed handler would, but operate on committed local
// knowledge + a seeded PRNG, so the whole graph runs offline with zero keys.
// The token/latency numbers are real accounting values (each handler reports a
// deterministic estimate), not fabricated "LLM" outputs.

import type { MesaHandlers, HandlerResult } from "./graph";
import type { PlanSection, ResearchItem, ReviewResult } from "./types";
import { hashString, mulberry32, pickWeighted } from "./rng";

import knowledge from "./data/knowledge.json";

type TopicKey = keyof typeof knowledge.topics;
type SectionKey = keyof typeof knowledge.sectionTemplates;

const TOPICS: TopicKey[] = ["credit", "identity", "risk"];
const SECTIONS: SectionKey[] = ["contexto", "evidencia", "riesgos", "recomendacion"];

function detectTopic(task: string): TopicKey {
  const lower = task.toLowerCase();
  const score: Record<TopicKey, number> = { credit: 0, identity: 0, risk: 0 };
  if (/(credito|crédito|score|buro|buró|prestamo|préstamo|deuda)/.test(lower)) score.credit += 2;
  if (/(identidad|kyc|biometria|biometría|fraude|documento)/.test(lower)) score.identity += 2;
  if (/(riesgo|default|calibracion|calibración|modelo|cutoff)/.test(lower)) score.risk += 2;
  if (/(credito|crédito|score)/.test(lower)) score.credit += 1;
  if (/(riesgo|default)/.test(lower)) score.risk += 1;
  const entries = Object.entries(score) as [TopicKey, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][1] > 0 ? entries[0][0] : pickWeighted(mulberry32(hashString(task)), TOPICS.map((t) => [t, 1] as [TopicKey, number]));
}

function tokensFor(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function latencyFor(text: string, rng: () => number): number {
  return Math.round((text.length / 4) * 8 + rng() * 20);
}

export function createDemoHandlers(task: string): MesaHandlers {
  const seed = hashString(task);
  const topic = detectTopic(task);

  return {
    planner(taskText: string, maxSections: number): HandlerResult<PlanSection[]> {
      const rng = mulberry32(seed + 1);
      const chosen = SECTIONS.slice(0, Math.min(maxSections, SECTIONS.length));
      const sections: PlanSection[] = chosen.map((key, i) => {
        const needsResearch = i < 3;
        return {
          id: `${key}-${i}`,
          title: knowledge.sectionTemplates[key],
          description: `Sección ${i + 1} para ${topic}`,
          researchNeeded: needsResearch,
          assignedQuery: needsResearch ? `${taskText} — ${knowledge.sectionTemplates[key]}` : undefined,
        };
      });
      const summary = sections.map((s) => s.title).join(" → ");
      return { value: sections, tokensUsed: tokensFor(summary), latencyMs: latencyFor(summary, rng) };
    },

    researcher(queries: string[]): HandlerResult<ResearchItem[]> {
      const rng = mulberry32(seed + 2);
      const facts = knowledge.topics[topic];
      const items: ResearchItem[] = queries.map((query, i) => {
        const fact = facts[i % facts.length];
        return {
          id: `r${i}-${hashString(query).toString(16).slice(0, 4)}`,
          query,
          result: fact,
          tokensUsed: tokensFor(fact),
          latencyMs: latencyFor(fact, rng),
        };
      });
      const totalTokens = items.reduce((s, it) => s + it.tokensUsed, 0);
      const totalLatency = items.reduce((s, it) => s + it.latencyMs, 0);
      return { value: items, tokensUsed: totalTokens, latencyMs: totalLatency };
    },

    writer(input: { plan: PlanSection[]; findings: ResearchItem[]; feedback?: string }): HandlerResult<string> {
      const rng = mulberry32(seed + 3);
      const facts = input.findings.length > 0
        ? input.findings.map((f) => f.result)
        : knowledge.topics[topic];
      const paragraphs = input.plan.map((section, i) => {
        const fact = facts[i % facts.length] ?? knowledge.topics[topic][0];
        const feedbackNote = input.feedback ? ` (revisado: ${input.feedback})` : "";
        return `${section.title}: ${fact}${feedbackNote}`;
      });
      const draft = paragraphs.join("\n\n");
      return { value: draft, tokensUsed: tokensFor(draft), latencyMs: latencyFor(draft, rng) };
    },

    reviewer(input: { draft: string; topic: string; rejectCount: number }): HandlerResult<ReviewResult> {
      const rng = mulberry32(seed + 4);
      const issues: string[] = [];
      const hasSource = input.draft.split("\n").length >= 3;
      const hasLength = input.draft.length > 60;
      if (!hasSource) issues.push("Draft demasiado corto o sin fuentes.");
      if (!hasLength) issues.push("Draft no cubre todas las secciones.");

      // Deterministic: a seed-dependent subset of runs start with a single
      // "reject_and_revise" to demonstrate the revision loop terminating.
      const startWithRevision = rng() < 0.5 && input.rejectCount === 0;

      let verdict: ReviewResult["verdict"];
      if (issues.length === 0) {
        verdict = "approve";
      } else if (startWithRevision) {
        verdict = "reject_and_revise";
      } else if (input.rejectCount >= 1) {
        verdict = "reject";
      } else {
        verdict = "reject_and_revise";
      }

      const result: ReviewResult = {
        verdict,
        feedback: issues.length > 0 ? issues.join(" ") : "Sin observaciones.",
        issue: issues.length > 0 ? issues[0] : undefined,
      };
      return {
        value: result,
        tokensUsed: tokensFor(input.draft) / 4,
        latencyMs: latencyFor(input.draft, rng) / 2,
      };
    },
  };
}
