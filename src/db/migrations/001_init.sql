-- Mandi Mitra schema — initial.
-- Denormalized for v1: AGMARKNET data is already flat and analytics queries stay simple.

create table if not exists prices (
  id bigserial primary key,
  arrival_date date not null,
  state text not null,
  district text not null,
  market text not null,
  commodity text not null,
  variety text,
  grade text,
  min_price numeric(10,2),
  max_price numeric(10,2),
  modal_price numeric(10,2),
  ingested_at timestamptz not null default now(),
  unique (arrival_date, state, district, market, commodity, variety, grade)
);

create table if not exists daily_summary (
  arrival_date date primary key,
  total_records int,
  total_markets int,
  total_commodities int,
  top_gainers jsonb,
  top_losers jsonb,
  most_arrivals jsonb,
  ai_commentary text,
  generated_at timestamptz not null default now()
);

create table if not exists ingest_runs (
  id bigserial primary key,
  arrival_date date not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched int default 0,
  inserted int default 0,
  skipped int default 0,
  status text not null default 'running',
  error text
);
