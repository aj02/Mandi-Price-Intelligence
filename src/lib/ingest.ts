import { fetchDay, type ParsedRecord } from "./agmarknet";
import { sql } from "./db";
import { invalidatePrefix } from "./ratelimit";
import { buildDailySummary } from "./aggregate";

const BATCH = 1000;

export type IngestResult = {
  date: string;
  fetched: number;
  inserted: number;
  skipped: number;
  durationMs: number;
};

async function bulkUpsert(rows: ParsedRecord[]): Promise<number> {
  if (!rows.length) return 0;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const values = slice.map((r) => ({
      arrival_date: r.iso_date,
      state: r.state,
      district: r.district,
      market: r.market,
      commodity: r.commodity,
      variety: r.variety ?? null,
      grade: r.grade ?? null,
      min_price: r.min_price,
      max_price: r.max_price,
      modal_price: r.modal_price,
    }));
    const res = await sql`
      insert into prices ${sql(values, "arrival_date", "state", "district", "market", "commodity", "variety", "grade", "min_price", "max_price", "modal_price")}
      on conflict (arrival_date, state, district, market, commodity, variety, grade)
      do update set
        min_price = excluded.min_price,
        max_price = excluded.max_price,
        modal_price = excluded.modal_price,
        ingested_at = now()
    `;
    inserted += res.count ?? slice.length;
  }
  return inserted;
}

export async function ingestDate(target: Date): Promise<IngestResult> {
  const started = Date.now();
  const iso = target.toISOString().slice(0, 10);

  const [run] = await sql<{ id: number }[]>`
    insert into ingest_runs (arrival_date, status) values (${iso}, 'running')
    returning id
  `;

  try {
    const { valid, skipped } = await fetchDay(target);
    const inserted = await bulkUpsert(valid);
    await buildDailySummary(iso);
    await invalidatePrefix("mm:cache:");

    const durationMs = Date.now() - started;
    await sql`
      update ingest_runs
      set finished_at = now(), fetched = ${valid.length}, inserted = ${inserted}, skipped = ${skipped}, status = 'ok'
      where id = ${run.id}
    `;

    return {
      date: iso,
      fetched: valid.length,
      inserted,
      skipped,
      durationMs,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await sql`
      update ingest_runs
      set finished_at = now(), status = 'error', error = ${msg}
      where id = ${run.id}
    `;
    throw err;
  }
}

export async function lastSuccessfulIngest(): Promise<{
  date: string;
  finished_at: string;
  inserted: number;
} | null> {
  const rows = await sql<
    { arrival_date: string; finished_at: string; inserted: number }[]
  >`
    select arrival_date, finished_at, inserted
    from ingest_runs
    where status = 'ok'
    order by finished_at desc
    limit 1
  `;
  if (!rows.length) return null;
  return {
    date: rows[0].arrival_date,
    finished_at: rows[0].finished_at,
    inserted: rows[0].inserted,
  };
}
