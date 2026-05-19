#!/usr/bin/env node
/**
 * Backfill ingestion for the last N days against a running deployment
 * or against a local dev server.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 CRON_SECRET=... node scripts/backfill.mjs 30
 *   BASE_URL=https://mandi-mitra.vercel.app CRON_SECRET=... node scripts/backfill.mjs 30
 */

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const secret = process.env.CRON_SECRET;
if (!secret) {
  console.error("CRON_SECRET not set");
  process.exit(1);
}

const days = Number(process.argv[2] ?? 30);
if (!Number.isFinite(days) || days <= 0) {
  console.error(`Bad day count: ${process.argv[2]}`);
  process.exit(1);
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

async function ingest(date) {
  const url = `${baseUrl}/api/cron/ingest?date=${date}`;
  const t0 = Date.now();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.json().catch(() => ({}));
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[${date}] ${res.status} (${dt}s)`, JSON.stringify(body));
  if (!res.ok) throw new Error(`status ${res.status}`);
  return body;
}

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  let failures = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    try {
      await ingest(iso(d));
    } catch (err) {
      failures++;
      console.error(`  → ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`Done. ${failures} failures of ${days} days.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
