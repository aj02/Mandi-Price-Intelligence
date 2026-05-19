import { sql, type DailySummary, type PriceRow, type TopMover } from "./db";
import { cacheJson } from "./ratelimit";

const CACHE_TTL = 60 * 30; // 30 minutes

export async function getLatestDate(): Promise<string | null> {
  const rows = await sql<{ arrival_date: string }[]>`
    select arrival_date from prices order by arrival_date desc limit 1
  `;
  return rows[0]?.arrival_date ?? null;
}

export async function getDailySummary(date: string): Promise<DailySummary | null> {
  return cacheJson(`mm:cache:summary:${date}`, CACHE_TTL, async () => {
    const rows = await sql<DailySummary[]>`
      select arrival_date, total_records, total_markets, total_commodities,
             top_gainers, top_losers, most_arrivals, ai_commentary, generated_at
      from daily_summary where arrival_date = ${date}
    `;
    return rows[0] ?? null;
  });
}

export type CommoditySnapshot = {
  commodity: string;
  national_min: number | null;
  national_modal: number | null;
  national_max: number | null;
  mandi_count: number;
  state_count: number;
};

export async function getCommoditySnapshot(
  commodity: string,
  date: string,
): Promise<CommoditySnapshot | null> {
  return cacheJson(
    `mm:cache:commodity:${commodity}:${date}`,
    CACHE_TTL,
    async () => {
      const rows = await sql<
        {
          national_min: number | null;
          national_modal: number | null;
          national_max: number | null;
          mandi_count: number;
          state_count: number;
        }[]
      >`
        select min(min_price)::float as national_min,
               avg(modal_price)::float as national_modal,
               max(max_price)::float as national_max,
               count(distinct market)::int as mandi_count,
               count(distinct state)::int as state_count
        from prices
        where commodity = ${commodity} and arrival_date = ${date}
      `;
      if (!rows[0] || rows[0].mandi_count === 0) return null;
      return { commodity, ...rows[0] };
    },
  );
}

export async function getCommodityMandiRows(
  commodity: string,
  date: string,
  limit = 200,
): Promise<PriceRow[]> {
  return sql<PriceRow[]>`
    select id, arrival_date, state, district, market, commodity, variety, grade,
           min_price::float, max_price::float, modal_price::float
    from prices
    where commodity = ${commodity} and arrival_date = ${date}
    order by modal_price desc nulls last
    limit ${limit}
  `;
}

export async function getCommodityTrend(
  commodity: string,
  days: number,
): Promise<{ date: string; avg_modal: number; sample: number }[]> {
  return cacheJson(
    `mm:cache:trend:${commodity}:${days}`,
    CACHE_TTL,
    async () => {
      const rows = await sql<{ date: string; avg_modal: number; sample: number }[]>`
        select arrival_date::text as date,
               avg(modal_price)::float as avg_modal,
               count(*)::int as sample
        from prices
        where commodity = ${commodity}
          and arrival_date >= current_date - ${days}::int
          and modal_price between 50 and 200000
        group by arrival_date
        order by arrival_date asc
      `;
      return rows;
    },
  );
}

export async function getCommodityStateHeatmap(
  commodity: string,
  date: string,
): Promise<{ state: string; modal_price: number; mandi_count: number }[]> {
  return sql<{ state: string; modal_price: number; mandi_count: number }[]>`
    select state,
           avg(modal_price)::float as modal_price,
           count(distinct market)::int as mandi_count
    from prices
    where commodity = ${commodity} and arrival_date = ${date}
      and modal_price between 50 and 200000
    group by state
    order by modal_price desc
  `;
}

export async function getMandiRows(
  market: string,
  date: string,
): Promise<PriceRow[]> {
  return sql<PriceRow[]>`
    select id, arrival_date, state, district, market, commodity, variety, grade,
           min_price::float, max_price::float, modal_price::float
    from prices
    where market = ${market} and arrival_date = ${date}
    order by commodity asc
  `;
}

export async function getMandiContext(market: string): Promise<{
  market: string;
  district: string;
  state: string;
} | null> {
  const rows = await sql<{ market: string; district: string; state: string }[]>`
    select market, district, state from prices
    where market = ${market}
    order by arrival_date desc
    limit 1
  `;
  return rows[0] ?? null;
}

export async function getStateRows(state: string, date: string): Promise<PriceRow[]> {
  return sql<PriceRow[]>`
    select id, arrival_date, state, district, market, commodity, variety, grade,
           min_price::float, max_price::float, modal_price::float
    from prices
    where state = ${state} and arrival_date = ${date}
    order by commodity asc, market asc
  `;
}

export async function getStateTopCommodities(
  state: string,
  date: string,
  limit = 12,
): Promise<{ commodity: string; modal_price: number; mandi_count: number }[]> {
  return sql<{ commodity: string; modal_price: number; mandi_count: number }[]>`
    select commodity,
           avg(modal_price)::float as modal_price,
           count(distinct market)::int as mandi_count
    from prices
    where state = ${state} and arrival_date = ${date}
      and modal_price between 50 and 200000
    group by commodity
    order by mandi_count desc, commodity asc
    limit ${limit}
  `;
}

export async function getStateActiveMandiCount(state: string, date: string): Promise<number> {
  const rows = await sql<{ c: number }[]>`
    select count(distinct market)::int as c from prices
    where state = ${state} and arrival_date = ${date}
  `;
  return rows[0]?.c ?? 0;
}

export async function getTopCommoditiesByCount(date: string, limit = 200): Promise<string[]> {
  const rows = await sql<{ commodity: string }[]>`
    select commodity
    from prices
    where arrival_date = ${date}
    group by commodity
    order by count(*) desc
    limit ${limit}
  `;
  return rows.map((r) => r.commodity);
}

export async function getTopMandisByCount(date: string, limit = 200): Promise<string[]> {
  const rows = await sql<{ market: string }[]>`
    select market
    from prices
    where arrival_date = ${date}
    group by market
    order by count(*) desc
    limit ${limit}
  `;
  return rows.map((r) => r.market);
}

export async function getAllCommodities(): Promise<string[]> {
  return cacheJson("mm:cache:all-commodities", CACHE_TTL * 2, async () => {
    const rows = await sql<{ commodity: string }[]>`
      select distinct commodity from prices order by commodity
    `;
    return rows.map((r) => r.commodity);
  });
}

export async function getAllMandis(): Promise<{ market: string; state: string }[]> {
  return cacheJson("mm:cache:all-mandis", CACHE_TTL * 2, async () => {
    const rows = await sql<{ market: string; state: string }[]>`
      select market, state from (
        select market, state, row_number() over (partition by market order by max(arrival_date) desc) rn
        from prices group by market, state
      ) t where rn = 1 order by market
    `;
    return rows;
  });
}

export async function getPreviousDayModalForCommodityAtMandi(
  commodity: string,
  market: string,
  beforeDate: string,
): Promise<number | null> {
  const rows = await sql<{ modal_price: number }[]>`
    select modal_price::float from prices
    where commodity = ${commodity} and market = ${market}
      and arrival_date < ${beforeDate} and modal_price is not null
    order by arrival_date desc limit 1
  `;
  return rows[0]?.modal_price ?? null;
}

export async function getYesterdayAveragesForCommodities(
  commodities: string[],
  date: string,
): Promise<Map<string, number>> {
  if (!commodities.length) return new Map();
  const prevDate = new Date(`${date}T00:00:00Z`);
  prevDate.setUTCDate(prevDate.getUTCDate() - 1);
  const prev = prevDate.toISOString().slice(0, 10);
  const rows = await sql<{ commodity: string; avg_modal: number }[]>`
    select commodity, avg(modal_price)::float as avg_modal
    from prices
    where arrival_date = ${prev} and commodity in ${sql(commodities)}
      and modal_price between 50 and 200000
    group by commodity
  `;
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.commodity, r.avg_modal);
  return m;
}

export type LastIngestStatus = {
  date: string;
  finished_at: string;
  status: string;
  inserted: number;
};

export async function getLastIngestStatus(): Promise<LastIngestStatus | null> {
  const rows = await sql<LastIngestStatus[]>`
    select arrival_date as date, finished_at, status, inserted
    from ingest_runs
    order by finished_at desc nulls last, started_at desc
    limit 1
  `;
  return rows[0] ?? null;
}

export { TopMover };
