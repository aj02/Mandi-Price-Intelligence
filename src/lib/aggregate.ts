import { sql } from "./db";
import { SANITY_MAX_MODAL, SANITY_MIN_MODAL } from "./agmarknet";
import type { TopMover } from "./db";

type DayCommodityRow = {
  commodity: string;
  state: string;
  avg_modal: number;
  sample_size: number;
};

async function pricesGroupedByCommodityState(
  date: string,
  minSample: number,
): Promise<DayCommodityRow[]> {
  return sql<DayCommodityRow[]>`
    select commodity,
           state,
           avg(modal_price)::float as avg_modal,
           count(*)::int as sample_size
    from prices
    where arrival_date = ${date}
      and modal_price between ${SANITY_MIN_MODAL} and ${SANITY_MAX_MODAL}
    group by commodity, state
    having count(*) >= ${minSample}
  `;
}

function previousBusinessDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function buildDailySummary(date: string): Promise<void> {
  const today = await pricesGroupedByCommodityState(date, 3);
  if (!today.length) {
    await sql`
      insert into daily_summary (arrival_date, total_records, total_markets, total_commodities, top_gainers, top_losers, most_arrivals, generated_at)
      values (${date}, 0, 0, 0, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, now())
      on conflict (arrival_date) do update set
        total_records = 0, total_markets = 0, total_commodities = 0,
        top_gainers = '[]'::jsonb, top_losers = '[]'::jsonb, most_arrivals = '[]'::jsonb,
        generated_at = now()
    `;
    return;
  }

  const prev = previousBusinessDate(date);
  const yesterday = await pricesGroupedByCommodityState(prev, 1);
  const prevMap = new Map<string, number>();
  for (const r of yesterday) prevMap.set(`${r.commodity}|${r.state}`, r.avg_modal);

  const movers: TopMover[] = [];
  for (const r of today) {
    const prevAvg = prevMap.get(`${r.commodity}|${r.state}`);
    if (!prevAvg || prevAvg <= 0) continue;
    const pct = ((r.avg_modal - prevAvg) / prevAvg) * 100;
    if (!Number.isFinite(pct)) continue;
    movers.push({
      commodity: r.commodity,
      state: r.state,
      pct_change: Number(pct.toFixed(2)),
      modal_price: Number(r.avg_modal.toFixed(2)),
      prev_modal_price: Number(prevAvg.toFixed(2)),
      sample_size: r.sample_size,
    });
  }

  // Clamp extreme % moves — likely data noise.
  const sane = movers.filter((m) => Math.abs(m.pct_change) <= 200);

  const gainers = [...sane]
    .sort((a, b) => b.pct_change - a.pct_change)
    .slice(0, 10);
  const losers = [...sane]
    .sort((a, b) => a.pct_change - b.pct_change)
    .slice(0, 10);

  const [meta] = await sql<
    { total_records: number; total_markets: number; total_commodities: number }[]
  >`
    select count(*)::int as total_records,
           count(distinct market)::int as total_markets,
           count(distinct commodity)::int as total_commodities
    from prices
    where arrival_date = ${date}
  `;

  await sql`
    insert into daily_summary (arrival_date, total_records, total_markets, total_commodities, top_gainers, top_losers, most_arrivals, generated_at)
    values (
      ${date},
      ${meta.total_records},
      ${meta.total_markets},
      ${meta.total_commodities},
      ${sql.json(gainers)}::jsonb,
      ${sql.json(losers)}::jsonb,
      '[]'::jsonb,
      now()
    )
    on conflict (arrival_date) do update set
      total_records = excluded.total_records,
      total_markets = excluded.total_markets,
      total_commodities = excluded.total_commodities,
      top_gainers = excluded.top_gainers,
      top_losers = excluded.top_losers,
      generated_at = now()
  `;
}
