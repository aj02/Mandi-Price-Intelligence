#!/usr/bin/env node
/**
 * Calls the ingest endpoint N times. Originally intended for historical
 * backfill, but the AGMARKNET "current daily price" data.gov.in resource
 * silently ignores its `filters[arrival_date]` parameter and always returns
 * the most recent reporting day — so the same data is fetched N times and
 * only one date ends up in the database. History accumulates forward by
 * running ingest once a day (Vercel Cron handles this in production).
 *
 * Usage (one-shot warmup or stress-test):
 *   BASE_URL=http://localhost:3000 CRON_SECRET=... node scripts/backfill.mjs 1
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
