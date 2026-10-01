// scripts/seed.mjs
// Creates the mesa schema + table and seeds a couple of demo runs.
// Run: node scripts/seed.mjs  (requires DATABASE_URL in env or .env.local)

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.trim().match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* no .env.local */
  }
}

loadEnv();

const sql = neon(process.env.DATABASE_URL);

const RUNS = [
  ["Investigar cómo los burós de crédito calculan un score de riesgo.", "approve", 4, 3, 8, 3420],
  ["Analizar las técnicas de robo de identidad sintética.", "reject", 3, 2, 6, 2150],
  ["Explicar la calibración de modelos de riesgo.", "approve", 4, 4, 9, 4010],
];

async function main() {
  await sql`CREATE SCHEMA IF NOT EXISTS mesa`;
  await sql`DROP TABLE IF EXISTS mesa.runs`;

  await sql`
    CREATE TABLE mesa.runs (
      id serial PRIMARY KEY,
      task text NOT NULL,
      verdict text NOT NULL,
      sections integer NOT NULL,
      findings integer NOT NULL,
      steps integer NOT NULL,
      tokens integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;

  for (const [task, verdict, sections, findings, steps, tokens] of RUNS) {
    await sql`INSERT INTO mesa.runs (task, verdict, sections, findings, steps, tokens) VALUES (${task}, ${verdict}, ${sections}, ${findings}, ${steps}, ${tokens})`;
  }

  const [{ c }] = await sql`SELECT count(*)::int AS c FROM mesa.runs`;
  console.log(`Seeded mesa schema: ${c} runs`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
