# Mandi Mitra

A public dashboard for India's wholesale mandi prices. Daily ingestion of the
AGMARKNET feed (Govt of India, via `data.gov.in`), stored in Postgres, surfaced
through a Next.js 16 / App Router UI. Mobile-first, bilingual-ready, free to use.

> Target user: a farmer with 1–2 hectares deciding where to sell tomorrow's harvest.
> Secondary: small-scale traders, journalists tracking food inflation, FPOs, researchers.

---

## Stack

| Concern             | Choice                                          |
| ------------------- | ----------------------------------------------- |
| Framework           | Next.js 16 (App Router, server components)      |
| UI                  | Tailwind CSS v4 + shadcn/ui                     |
| Database            | Supabase Postgres (free tier)                   |
| Cache + rate limit  | Upstash Redis (free tier)                       |
| Charts              | Recharts                                        |
| Fuzzy search        | Fuse.js                                         |
| Schema validation   | Zod                                             |
| Daily commentary    | DeepInfra (Llama 3.3 70B Instruct) — one call/day |
| Cron                | Vercel Cron                                     |
| Hosting             | Vercel                                          |
| Fonts               | Bricolage Grotesque, Geist, JetBrains Mono     |

---

## Setup

```bash
npm install
cp .env.example .env.local
# fill in the values (see Env section below)
npm run dev
```

Open <http://localhost:3000>. The home page will show an empty-state until the
database has been seeded — see Ingestion below.

---

## Env vars

See `.env.example` for the canonical list. Highlights:

| Variable                    | Purpose                                                 |
| --------------------------- | ------------------------------------------------------- |
| `DATA_GOV_IN_API_KEY`       | data.gov.in API key (free, instant signup)              |
| `DATA_GOV_IN_RESOURCE_ID`   | Optional override of the AGMARKNET resource UUID        |
| `DATABASE_URL`              | Postgres connection string (Supabase pooled)            |
| `DIRECT_URL`                | Optional direct connection — for migrations             |
| `UPSTASH_REDIS_REST_URL`    | Upstash REST URL (optional, but recommended)            |
| `UPSTASH_REDIS_REST_TOKEN`  | Upstash REST token                                      |
| `CRON_SECRET`               | Bearer token required by `/api/cron/*` endpoints        |
| `DEEPINFRA_API_KEY`         | DeepInfra key for daily commentary (optional)           |
| `NEXT_PUBLIC_SITE_URL`      | Canonical site URL (used by sitemap + OG image)         |

Generate a `CRON_SECRET`:

```bash
openssl rand -hex 32
```

---

## Database schema

SQL migrations live in `src/db/migrations/`. Run them once against Supabase
(SQL editor → paste, execute):

1. `001_init.sql` — creates `prices`, `daily_summary`, `ingest_runs`.
2. `002_indexes.sql` — read-path indexes.

Storage projection: ~10K rows/day × 365 = ~3.6M rows/year × ~250 bytes ≈
900 MB/year. Above Supabase free tier after roughly one year — when that hits,
either archive rows older than 18 months or downsample old data to weekly
aggregates.

---

## Ingestion

`src/lib/agmarknet.ts` paginates the AGMARKNET API:

```
GET https://api.data.gov.in/resource/{RESOURCE_ID}
    ?api-key=...&format=json&limit=10000&offset=0
    &filters[arrival_date]=DD/MM/YYYY
```

Default resource ID is hardcoded but can be overridden with
`DATA_GOV_IN_RESOURCE_ID`. The resource ID has changed historically — verify
on data.gov.in before deploying ("Current Daily Price of Various Commodities
from Various Markets (Mandi)").

`src/lib/ingest.ts` orchestrates one day at a time:

1. Logs a row in `ingest_runs` (status `running`).
2. Paginates AGMARKNET for the target date.
3. Validates each row with Zod, skipping malformed records.
4. Bulk upserts into `prices` using the unique constraint
   `(arrival_date, state, district, market, commodity, variety, grade)` —
   safe to re-run on the same day.
5. Computes daily summary (`buildDailySummary`).
6. Invalidates Redis cache for that date.
7. Updates the `ingest_runs` row with counts and status `ok` (or `error`).

### Triggering an ingest

```bash
# today
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/ingest

# a specific date
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/ingest?date=2026-05-19"
```

### Backfilling the last N days

```bash
BASE_URL=http://localhost:3000 CRON_SECRET=... node scripts/backfill.mjs 30
```

Run this once at launch to seed the database. For a production deploy, point
`BASE_URL` at the live URL so Vercel's longer function timeout applies.

### Scheduled runs (Vercel Cron)

`vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/ingest",     "schedule": "30 5 * * *" },
    { "path": "/api/cron/commentary", "schedule": "0 6 * * *"  }
  ]
}
```

- 05:30 UTC = 11:00 IST. AGMARKNET typically publishes the day's data
  through the morning; this gives reporters until late morning.
- 06:00 UTC = 11:30 IST. Commentary runs 30 minutes after ingest.

---

## AI commentary

`/api/cron/commentary` reads today's `daily_summary` plus a 7-day context
table and asks Llama 3.3 70B for two short paragraphs:

- Paragraph 1: what moved today, where, by how much.
- Paragraph 2: 2–3 *possible* drivers — seasonal, weather, festival demand,
  transport, policy. Framed as possibilities, never confirmed fact.

Cost: ~₹1/day at current DeepInfra pricing. The dashboard renders fine if
commentary generation fails — the card just hides.

---

## Project layout

```
src/
  app/
    page.tsx                 # Daily Pulse (home)
    c/[commodity]/page.tsx   # Commodity detail
    m/[market]/page.tsx      # Mandi detail
    s/[state]/page.tsx       # State view
    search/page.tsx          # Combined search
    about/page.tsx
    sitemap.ts robots.ts opengraph-image.tsx not-found.tsx loading.tsx
    api/
      cron/ingest/route.ts
      cron/commentary/route.ts
      cron/status/route.ts
      search/route.ts
  components/
    header.tsx footer.tsx search-bar.tsx
    commodity-card.tsx mandi-table.tsx state-heatmap.tsx
    trend-chart.tsx price-sparkline.tsx
    change-pill.tsx last-updated.tsx msp-gap-card.tsx
    ui/                      # shadcn primitives
  lib/
    db.ts                    # lazy postgres.js client
    agmarknet.ts             # data.gov.in fetcher + sanity bounds
    ingest.ts                # daily pipeline
    aggregate.ts             # daily summary builder
    queries.ts               # page-data queries (Redis-cached)
    ratelimit.ts             # Upstash helpers
    schema.ts                # Zod schemas + date parsers
    msp.ts                   # Minimum Support Price table
    commodity-aliases.ts     # tamatar → Tomato etc.
    i18n.ts constants.ts format.ts
  db/migrations/
    001_init.sql 002_indexes.sql
scripts/
  backfill.mjs               # last-N-days ingestion driver
public/
vercel.json                  # cron config
```

---

## Going live

1. Push to GitHub.
2. Create a Supabase project; run both SQL migrations.
3. Get a `DATA_GOV_IN_API_KEY` from data.gov.in.
4. Verify the AGMARKNET resource ID (search for the dataset). Override via
   `DATA_GOV_IN_RESOURCE_ID` if the default has drifted.
5. Create an Upstash Redis instance (free tier).
6. Generate `CRON_SECRET` with `openssl rand -hex 32`.
7. Import the repo in Vercel; add all env vars under Production + Preview.
8. Deploy. Vercel will pick up `vercel.json` automatically.
9. Trigger a backfill against the live URL:
   ```bash
   BASE_URL=https://your-domain.vercel.app CRON_SECRET=... \
     node scripts/backfill.mjs 30
   ```
10. Verify the home page renders, then watch the next morning's cron in Vercel logs.
11. Submit `/sitemap.xml` to Google Search Console.

### Cost projection (10k daily users)

| Service       | Cost                                          |
| ------------- | --------------------------------------------- |
| Vercel        | Free (under 100 GB bandwidth)                 |
| Supabase      | Free until DB > 500 MB (~9 months in)         |
| Upstash       | Free (10k commands/day)                       |
| DeepInfra     | ~₹30/month for one commentary call/day        |
| data.gov.in   | Free                                          |

---

## Definition of done (v1)

- [x] `npm run dev` boots cleanly.
- [x] Database schema + migrations.
- [x] AGMARKNET ingestion working with idempotent upserts.
- [x] Daily-summary aggregator with sanity-bound filtering.
- [x] Commentary cron with graceful failure.
- [x] Home page (Daily Pulse) with movers, MSP watch, state grid.
- [x] Commodity, mandi, state detail pages.
- [x] Fuzzy search with Hindi alias resolution (`tamatar` → `Tomato`).
- [x] Sitemap + robots + Open Graph image.
- [x] Skeleton loading + not-found states.
- [x] Mobile responsive (360px and up).
- [x] Public disclaimer in footer.
- [ ] Seeded DB (run backfill at deploy time).
- [ ] Vercel cron verified in production logs.
- [ ] Custom domain (optional).

---

## Things deliberately not in v1

- User accounts / favorites / alerts. Zero friction is the point.
- Auto-detected location. Privacy + accuracy headaches.
- Hindi UI. Plumbing exists (`src/lib/i18n.ts`); strings ship next.
- WhatsApp / Telegram delivery — high-value but separate channel work.
- Best-mandi calculator (needs mandi coordinates).
- Forecast widget.
- Archival of >18-month-old data.

---

## Disclaimer

Prices are sourced from AGMARKNET (Govt of India). Mandi Mitra is an
independent project and is not affiliated with any government body. Verify
before commercial decisions.
