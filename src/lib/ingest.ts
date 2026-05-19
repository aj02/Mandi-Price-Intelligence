import { fetchDay, type ParsedRecord } from "./agmarknet";
import { sql } from "./db";
import { invalidatePrefix } from "./ratelimit";
import { buildDailySummary } from "./aggregate";
import { FOCUS_STATE } from "./focus";

const BATCH = 1000;

export type IngestResult = {
  date: string;
  actual_dates: string[];
  focus_state: string | null;
  fetched: number;
  dropped_by_focus: number;
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

/**
 * NOTE on `target`: the AGMARKNET "current daily price" resource is a single
 * snapshot — its `filters[arrival_date]` parameter is silently ignored and
 * the response always carries the most recent reporting day. We pass `target`
 * through to honor any future filter support, but the canonical
 * `arrival_date` of each row is the date the data.gov.in record itself
 * reports. We then build daily summaries for every distinct date that
 * actually landed.
 */
export async function ingestDate(target: Date): Promise<IngestResult> {
  const started = Date.now();
  const requestedIso = target.toISOString().slice(0, 10);

  const [run] = await sql<{ id: number }[]>`
    insert into ingest_runs (arrival_date, status) values (${requestedIso}, 'running')
    returning id
  `;

  try {
    const { valid, skipped } = await fetchDay(target);
    const focused = FOCUS_STATE
      ? valid.filter((r) => r.state === FOCUS_STATE)
      : valid;
    const droppedByFocus = valid.length - focused.length;
    const inserted = await bulkUpsert(focused);

    const datesSeen = Array.from(new Set(focused.map((r) => r.iso_date)));
    for (const d of datesSeen) await buildDailySummary(d);
    await invalidatePrefix("mm:cache:");

    const durationMs = Date.now() - started;
    await sql`
      update ingest_runs
      set finished_at = now(), fetched = ${focused.length}, inserted = ${inserted}, skipped = ${skipped + droppedByFocus}, status = 'ok'
      where id = ${run.id}
    `;

    return {
      date: requestedIso,
      actual_dates: datesSeen,
      focus_state: FOCUS_STATE,
      fetched: focused.length,
      dropped_by_focus: droppedByFocus,
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
