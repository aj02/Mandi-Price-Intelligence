#!/usr/bin/env node
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
  const [tot] = await sql`
    select count(*)::int n,
           count(distinct arrival_date)::int days,
           count(distinct market)::int markets,
           count(distinct commodity)::int commodities,
           count(distinct state)::int states,
           min(arrival_date)::text mn,
           max(arrival_date)::text mx
    from prices
  `;
  const [sum] = await sql`select count(*)::int n from daily_summary`;
  const movers = await sql`
    select arrival_date::text d,
           jsonb_array_length(top_gainers) gainers,
           jsonb_array_length(top_losers) losers
    from daily_summary order by arrival_date desc limit 5
  `;
  console.log("prices:", tot);
  console.log("daily_summary rows:", sum.n);
  console.log("last 5 days movers:");
  for (const r of movers) console.log("  ", r.d, "gainers=" + r.gainers, "losers=" + r.losers);
} finally {
  await sql.end({ timeout: 2 });
}
