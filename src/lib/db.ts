import postgres from "postgres";

type SqlClient = ReturnType<typeof postgres>;

declare global {
  var __mandi_sql: SqlClient | undefined;
}

function makeClient(): SqlClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return postgres(url, {
    max: 5,
    idle_timeout: 20,
    prepare: false,
  });
}

function getClient(): SqlClient {
  if (globalThis.__mandi_sql) return globalThis.__mandi_sql;
  const c = makeClient();
  if (process.env.NODE_ENV !== "production") globalThis.__mandi_sql = c;
  return c;
}

/**
 * Tag-template proxy. Calls into the real postgres.js client lazily so that
 * importing this module never throws — only running an actual query does.
 */
export const sql = new Proxy(function () {} as unknown as SqlClient, {
  apply(_t, _this, args: unknown[]) {
    const client = getClient() as unknown as (
      ...a: unknown[]
    ) => unknown;
    return client(...args);
  },
  get(_t, prop: string | symbol) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const v = client[prop];
    return typeof v === "function"
      ? (v as (...a: unknown[]) => unknown).bind(client)
      : v;
  },
}) as SqlClient;

export type PriceRow = {
  id: number;
  arrival_date: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string | null;
  grade: string | null;
  min_price: number | null;
  max_price: number | null;
  modal_price: number | null;
};

export type DailySummary = {
  arrival_date: string;
  total_records: number;
  total_markets: number;
  total_commodities: number;
  top_gainers: TopMover[];
  top_losers: TopMover[];
  most_arrivals: unknown;
  ai_commentary: string | null;
  generated_at: string;
};

export type TopMover = {
  commodity: string;
  state: string;
  pct_change: number;
  modal_price: number;
  prev_modal_price: number;
  sample_size: number;
};
