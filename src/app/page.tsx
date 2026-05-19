import Link from "next/link";
import { ArrowRight, MapPin, TrendingDown, TrendingUp, Building2, Wheat } from "lucide-react";
import {
  getActiveStatesForDate,
  getCommoditySnapshot,
  getDailySummary,
  getLastIngestStatus,
  getLatestDate,
  getStateSnapshot,
  getStateTopCommodities,
} from "@/lib/queries";
import { INDIA_STATES, slugify } from "@/lib/constants";
import { LastUpdated } from "@/components/last-updated";
import { CommodityCard } from "@/components/commodity-card";
import { MspGapCard } from "@/components/msp-gap-card";
import { inr, num } from "@/lib/format";
import { detectUserState } from "@/lib/geo";
import { FOCUS_STATE } from "@/lib/focus";

export const revalidate = 600;
export const dynamic = "force-dynamic";

export default async function Home() {
  const date = await getLatestDate();
  const summary = date ? await getDailySummary(date) : null;
  const lastIngest = await getLastIngestStatus().catch(() => null);
  const { state: userState, source } = await detectUserState();

  // Focus mode: always lead with the focus state and hide multi-state UI.
  const activeStates = date && !FOCUS_STATE ? await getActiveStatesForDate(date) : [];
  const heroState =
    FOCUS_STATE ??
    userState ??
    (activeStates[0]?.state as (typeof INDIA_STATES)[number] | undefined) ??
    null;

  const [heroSnap, heroCommodities, mspSnaps] = await Promise.all([
    heroState && date ? getStateSnapshot(heroState, date) : Promise.resolve(null),
    heroState && date ? getStateTopCommodities(heroState, date, 6) : Promise.resolve([]),
    date
      ? Promise.all(
          ["Wheat", "Paddy", "Cotton", "Soyabean", "Mustard"].map((c) =>
            getCommoditySnapshot(c, date).then((s) => ({ commodity: c, snap: s })),
          ),
        )
      : Promise.resolve([]),
  ]);
  const mspCards = mspSnaps.filter((s) => s.snap?.national_modal != null);

  if (!date || !summary) {
    return <EmptyState />;
  }

  return (
    <div className="mx-auto max-w-[82rem] px-4 py-6 md:px-6 md:py-10">
      {/* HERO: user's state */}
      {heroState && heroSnap && (
        <section className="grad-brand relative overflow-hidden rounded-3xl border border-line p-6 md:p-10">
          <div className="absolute right-0 top-0 -mt-20 -mr-20 h-72 w-72 rounded-full bg-brand/10 blur-3xl" aria-hidden />
          <div className="relative flex flex-wrap items-center gap-2">
            <LastUpdated date={date} finishedAt={lastIngest?.finished_at} />
            {!FOCUS_STATE && <SourceBadge source={source} />}
          </div>
          <h1 className="hero-display mt-5 text-ink">
            {heroState} mandis today.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-soft md:text-lg">
            <span className="num font-semibold text-ink">{heroSnap.mandi_count}</span> markets
            in <span className="num font-semibold text-ink">{heroSnap.district_count}</span> districts
            reporting <span className="num font-semibold text-ink">{heroSnap.commodity_count}</span> commodities.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <HeroStat icon={<Building2 className="h-4 w-4" />} label="Mandis" value={heroSnap.mandi_count} />
            <HeroStat icon={<Wheat className="h-4 w-4" />} label="Commodities" value={heroSnap.commodity_count} />
            <HeroStat icon={<MapPin className="h-4 w-4" />} label="Districts" value={heroSnap.district_count} />
          </div>

          {/* State's top commodities */}
          {heroCommodities.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink">Most active commodities</h2>
                <Link
                  href={`/s/${slugify(heroState)}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                >
                  View {heroState} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {heroCommodities.map((c) => (
                  <Link
                    key={c.commodity}
                    href={`/c/${slugify(c.commodity)}`}
                    className="card-elev card-elev-hover flex items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink">{c.commodity}</div>
                      <div className="text-[11px] text-ink-muted">
                        {c.mandi_count} mandis
                      </div>
                    </div>
                    <div className="num shrink-0 text-base font-semibold text-ink">
                      {inr(c.modal_price)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* National stats strip */}
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Markets reporting" value={summary.total_markets} />
        <Stat label="Commodities" value={summary.total_commodities} />
        <Stat label="Total records" value={summary.total_records} />
      </section>

      {/* AI commentary */}
      {summary.ai_commentary && (
        <section className="card-elev mt-8 p-6 md:p-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-brand">
              Daily commentary
            </div>
            <div className="text-[11px] text-ink-muted">AI · informational only</div>
          </div>
          <div className="space-y-3 text-base leading-relaxed text-ink-soft">
            {summary.ai_commentary
              .split(/\n{2,}|\n/)
              .filter(Boolean)
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </div>
        </section>
      )}

      {/* All states grid (hidden in single-state focus mode) */}
      {!FOCUS_STATE && (
        <Section
          title="Browse by state"
          subtitle="Active mandis and commodity counts for every reporting state today."
        >
          <ActiveStatesGrid rows={activeStates} userState={userState} />
        </Section>
      )}

      {/* Top gainers */}
      <Section
        title="National top gainers"
        subtitle="Largest one-day price moves across states with ≥3 reporting mandis."
        icon={<TrendingUp className="h-4 w-4 text-up" />}
      >
        <MoverGrid
          movers={summary.top_gainers ?? []}
          fallback="Not enough reporting markets today for a gainer list. Top movers populate once 2+ days of data accumulate."
        />
      </Section>

      {/* Top losers */}
      <Section
        title="National top losers"
        subtitle="Where prices fell most since yesterday."
        icon={<TrendingDown className="h-4 w-4 text-down" />}
      >
        <MoverGrid
          movers={summary.top_losers ?? []}
          fallback="No qualifying decliners today."
        />
      </Section>

      {/* MSP watch */}
      {mspCards.length > 0 && (
        <Section
          title="MSP watch"
          subtitle="Average market modal price vs the announced Minimum Support Price."
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {mspCards.map(({ commodity, snap }) => (
              <MspGapCard
                key={commodity}
                commodity={commodity}
                marketPrice={snap!.national_modal}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="card-elev flex items-center gap-3 p-4">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="num text-xl font-semibold text-ink">{num(value)}</div>
        <div className="text-[11px] uppercase tracking-wider text-ink-muted">
          {label}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-elev p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </div>
      <div className="stat-big mt-1.5 text-ink">{num(value)}</div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-xl font-semibold text-ink">{title}</h2>
          </div>
          {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function MoverGrid({
  movers,
  fallback,
}: {
  movers: {
    commodity: string;
    state: string;
    pct_change: number;
    modal_price: number;
    prev_modal_price: number;
    sample_size: number;
  }[];
  fallback: string;
}) {
  if (!movers?.length) {
    return (
      <div className="card-elev p-6 text-sm text-ink-muted">{fallback}</div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {movers.slice(0, 6).map((m) => (
        <CommodityCard key={`${m.commodity}-${m.state}`} mover={m} />
      ))}
    </div>
  );
}

function ActiveStatesGrid({
  rows,
  userState,
}: {
  rows: { state: string; mandi_count: number; commodity_count: number }[];
  userState: string | null;
}) {
  if (!rows.length) {
    return (
      <div className="card-elev p-6 text-sm text-ink-muted">
        No states reporting today.
      </div>
    );
  }
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {rows.map((r) => {
        const isYou = userState === r.state;
        return (
          <Link
            key={r.state}
            href={`/s/${slugify(r.state)}`}
            className={`card-elev card-elev-hover flex flex-col gap-1 p-4 ${isYou ? "ring-2 ring-brand/30" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-ink">{r.state}</span>
              {isYou && (
                <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                  You
                </span>
              )}
            </div>
            <div className="text-[11px] text-ink-muted">
              <span className="num font-medium text-ink-soft">{r.mandi_count}</span> mandis
              <span className="mx-1.5">·</span>
              <span className="num font-medium text-ink-soft">{r.commodity_count}</span> commodities
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function SourceBadge({ source }: { source: "geo" | "cookie" | "none" }) {
  if (source === "none") return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-2.5 py-1 text-[11px] text-ink-muted">
      {source === "geo" ? (
        <>
          <MapPin className="h-3 w-3 text-up" /> Detected from location
        </>
      ) : (
        <>
          <MapPin className="h-3 w-3 text-brand" /> Pinned by you
        </>
      )}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-[82rem] px-4 py-16 md:px-6">
      <h1 className="hero-display text-ink">Mandi Mitra</h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        Daily wholesale mandi prices for thousands of markets across India. The
        data pipeline is set up but no records have been ingested yet. Run the
        ingest endpoint to populate.
      </p>
    </div>
  );
}
