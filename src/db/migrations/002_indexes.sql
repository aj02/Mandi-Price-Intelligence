-- Indexes for the dashboard's hot read paths.
create index if not exists idx_prices_commodity_date on prices (commodity, arrival_date desc);
create index if not exists idx_prices_state_date on prices (state, arrival_date desc);
create index if not exists idx_prices_market_date on prices (market, arrival_date desc);
create index if not exists idx_prices_date on prices (arrival_date desc);
create index if not exists idx_prices_commodity_state_date on prices (commodity, state, arrival_date desc);
create index if not exists idx_ingest_runs_date on ingest_runs (arrival_date desc, started_at desc);
