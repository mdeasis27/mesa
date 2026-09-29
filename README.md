# Mesa

**Multi-agent orchestration with typed handoffs, code-enforced budgets and a
terminating reviewer subgraph.** A supervisor delegates to three specialists
(planner / researcher / writer) through validated schemas; every step is
traced, and the graph is guaranteed to finish — measured, not assumed.

> **Result:** Across **36 runs** (3 tasks × 4 rejection caps × 3 budget limits)
> with an **adversarial reviewer that always demands a revision**, **36/36 runs
> terminate** and **36/36 stay within budget**. The step count never exceeds the
> hard bound `4 + 2·maxRejections`.

---

## Result

### Termination + budget sweep (n = 36)

| Guarantee | Result |
|---|---|
| Runs that terminate | **36/36 (100%)** |
| Runs that stay within budget | **36/36 (100%)** |
| Step bound respected | **36/36 (100%)** |

The worst-case reviewer — one that returns `reject_and_revise` on every pass —
is exactly the case that would loop forever in a naive agent. Here the rejection
counter is strictly increasing and capped, so even the pathological input
converges. The sweep varies the cap (`maxRejections` 0–5) and the budget
(`maxSteps` 3, 8, 50) to confirm the bound holds across configurations, not just
for one happy path.

### Budget, enforced in code (not in the prompt)

Every step checks four limits before executing: sub-queries, tokens, steps and
wall-clock. Crossing any limit halts the graph deterministically with a
`BudgetExhaustedError` — no unhandled exceptions, no token burn, no "please stop"
in a system prompt.

| Limit | Default |
|---|---|
| max sub-queries | 6 |
| max tokens | 10,000 |
| max steps | 12 |
| max wall-clock | 120,000 ms |

### Step trace (durable state)

Each step records what agent received what, what it produced, tokens and
latency. `traceSnapshot()` serializes the run so it can be resumed after a crash
— the trace is the source of truth, not a log line.

---

## Architecture

```
lib/mesa/             # core orchestrator (TypeScript, tested)
  graph.ts            #   runs the typed-handoff DAG, enforces budget, traces
  schemas.ts          #   structural handoff contracts (validated at runtime)
  budget.ts           #   subquery/token/step/wall-clock limits + exhaustion
  reviewer.ts         #   rejection counter that guarantees termination
  trace.ts            #   step recording + per-agent aggregation + snapshot
  rng.ts              #   deterministic seeded PRNG (no Math.random in core)
  demo-agents.ts      #   deterministic offline agents over committed knowledge
  demo.ts             #   wires the demo tasks → run → summary
  eval.ts             #   termination + budget sweep (the headline number)
  data/knowledge.json #   committed local facts (demo corpus)
backend/              # same math in Python + pytest (authoritative)
  src/mesa/
  tests/              #   pinned to tests/fixtures/orchestration.json
app/                  # Next.js landing + demo dashboard (Vercel, demo mode)
```

The graph is a fixed DAG: `supervisor → planner → researcher → writer ⇄ reviewer`.
Handlers are injected, so the same graph runs with the deterministic demo agents
or, in live mode, with LLM-backed handlers behind the identical interface.

## Design decisions & tradeoffs

1. **The budget lives in code, not the prompt.** Prompted budget limits are
   advisory; a model can (and does) ignore them. Checking the limit *before*
   each step makes exhaustion a deterministic outcome. The cost is that handlers
   must report their token/latency honestly — a contract the interface enforces.
2. **Termination is a counter, not a hope.** The reviewer subgraph is the one
   place an agent loop can spin forever. Capping `reject_and_revise` with a
   strictly-increasing counter is a structural guarantee — provable by the sweep
   above — rather than a behavioural one.
3. **Handoffs are schemas, not personas.** Agents pass typed payloads
   (`{ queries, context }`, `{ findings, citations, topic }`) validated at
   runtime. This is what makes the orchestration debuggable: a broken handoff
   fails loudly at the edge, not silently downstream.

## What did not work

- **A supervisor that "re-plans" mid-run was cut.** Looping the supervisor back
  into planning reintroduces a cycle whose termination you can only argue for,
  not guarantee. The fixed DAG loses some adaptivity but keeps the termination
  argument watertight — a deliberate trade against "flexibility" narrative.
- **Token accounting is an estimate in demo mode.** The deterministic agents
  report a character-based token estimate (`len/4`), not a real tokenizer. The
  budget *mechanism* is real; the absolute numbers are meant to be replaced by
  real tokenizer counts in live mode (same interface).

## Run it

```bash
# frontend demo + TS tests
pnpm install && pnpm dev      # http://localhost:3000
pnpm test                     # 39 vitest tests

# backend (authoritative math) — Python 3.12+
cd backend && uv sync --extra dev && uv run pytest   # 5 tests, pinned fixture
```

## Stack

Next.js 16 · TypeScript · Vitest · Tailwind v4 · Python 3.13 · pytest
