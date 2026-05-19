#!/usr/bin/env node
/**
 * Apply SQL migrations in src/db/migrations against DIRECT_URL.
 * Idempotent — uses `create table if not exists` / `create index if not exists`.
 *
 * Usage: node scripts/migrate.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migDir = path.resolve(__dirname, "../src/db/migrations");

function loadEnv() {
  try {
    const txt = readFileSync(path.resolve(__dirname, "../.env.local"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const [, k, raw] = m;
      if (process.env[k]) continue;
      const v = raw.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      process.env[k] = v;
    }
  } catch {
    // fine — env might be supplied externally
  }
}

loadEnv();

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL/DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1, idle_timeout: 5, prepare: false });

async function main() {
  console.log("Probing connection…");
  const [v] = await sql`select version()`;
  console.log("  →", v.version);

  const files = readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const body = readFileSync(path.join(migDir, f), "utf8");
    console.log(`Applying ${f} (${body.length} bytes)…`);
    await sql.unsafe(body);
    console.log("  → ok");
  }

  const [{ count: priceCount }] = await sql`select count(*)::int as count from prices`;
  const [{ count: sumCount }] = await sql`select count(*)::int as count from daily_summary`;
  console.log(`Tables ready. prices=${priceCount} daily_summary=${sumCount}`);
}

main()
  .then(() => sql.end({ timeout: 2 }))
  .catch(async (err) => {
    console.error("FAIL:", err.message);
    await sql.end({ timeout: 2 }).catch(() => {});
    process.exit(1);
  });
