import {
  AgmarkRecordSchema,
  AgmarkResponseSchema,
  ddmmyyyy,
  parseAgmarkDate,
  type AgmarkRecord,
} from "./schema";

// AGMARKNET dataset: "Current Daily Price of Various Commodities from Various Markets (Mandi)".
// Resource ID rotates rarely but has changed historically — verify against data.gov.in at setup.
// Current known ID: 9ef84268-d588-465a-a308-a864a43d0070
const DEFAULT_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const BASE = "https://api.data.gov.in/resource";
const PAGE_SIZE = 10000;

export type ParsedRecord = AgmarkRecord & { iso_date: string };

function getKey() {
  const k = process.env.DATA_GOV_IN_API_KEY;
  if (!k) throw new Error("DATA_GOV_IN_API_KEY not set");
  return k;
}

function getResourceId() {
  return process.env.DATA_GOV_IN_RESOURCE_ID || DEFAULT_RESOURCE_ID;
}

async function fetchPage(
  date: Date,
  offset: number,
  signal?: AbortSignal,
): Promise<{ records: unknown[]; total: number }> {
  const url = new URL(`${BASE}/${getResourceId()}`);
  url.searchParams.set("api-key", getKey());
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("filters[arrival_date]", ddmmyyyy(date));

  const res = await fetch(url.toString(), { signal, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`AGMARKNET ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const json = await res.json();
  const parsed = AgmarkResponseSchema.parse(json);
  const total = Number(parsed.total ?? parsed.count ?? 0) || 0;
  return { records: parsed.records, total };
}

export async function fetchDay(
  date: Date,
  opts: { signal?: AbortSignal; onPage?: (offset: number, count: number) => void } = {},
): Promise<{ valid: ParsedRecord[]; skipped: number; total: number }> {
  let offset = 0;
  let skipped = 0;
  const valid: ParsedRecord[] = [];

  // AGMARKNET's `total`/`count` fields are unreliable across response shapes
  // (sometimes global, sometimes per-page). Rely on a short final page to terminate.
  for (;;) {
    const { records } = await fetchPage(date, offset, opts.signal);
    if (!records.length) break;
    opts.onPage?.(offset, records.length);

    for (const raw of records) {
      const parsed = AgmarkRecordSchema.safeParse(raw);
      if (!parsed.success) {
        skipped++;
        continue;
      }
      const iso = parseAgmarkDate(parsed.data.arrival_date);
      if (!iso) {
        skipped++;
        continue;
      }
      valid.push({ ...parsed.data, iso_date: iso });
    }

    offset += records.length;
    if (records.length < PAGE_SIZE) break;
    if (offset > 500_000) break; // hard safety cap
  }

  return { valid, skipped, total: valid.length };
}

// Sanity bounds for daily-summary aggregation. Raw rows still stored.
export const SANITY_MIN_MODAL = 50;
export const SANITY_MAX_MODAL = 200000;

export function isSane(modal: number | null | undefined): boolean {
  if (modal == null || !Number.isFinite(modal)) return false;
  return modal >= SANITY_MIN_MODAL && modal <= SANITY_MAX_MODAL;
}
