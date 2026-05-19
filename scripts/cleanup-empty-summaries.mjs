#!/usr/bin/env node
/**
 * Removes daily_summary rows for dates that have zero matching prices.
 * Useful after a backfill attempt against the AGMARKNET current-snapshot
 * dataset, which silently ignores the date filter and produces stub
 * summary rows for non-existent dates.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const txt = readFileSync(path.resolve(__dirname, "../.env.local"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const [, k, raw] = m;
      if (process.env[k]) continue;
      process.env[k] = raw.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    }
  } catch {}
}
loadEnv();

const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL, {
  max: 1,
  prepare: false,
});

try {
  const res = await sql`
    delete from daily_summary
    where arrival_date not in (select distinct arrival_date from prices)
  `;
  console.log("deleted", res.count, "stub summary rows");

  const stale = await sql`
    delete from ingest_runs
    where arrival_date not in (select distinct arrival_date from prices)
      and finished_at < now() - interval '5 minutes'
  `;
  console.log("deleted", stale.count, "stale ingest_run rows");
} finally {
  await sql.end({ timeout: 2 });
}
