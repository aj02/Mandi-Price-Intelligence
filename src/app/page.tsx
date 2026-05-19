import Link from "next/link";
import {
  getCommoditySnapshot,
  getDailySummary,
  getLastIngestStatus,
  getLatestDate,
} from "@/lib/queries";
import { INDIA_STATES, slugify } from "@/lib/constants";
import { LastUpdated } from "@/components/last-updated";
import { CommodityCard } from "@/components/commodity-card";
import { MspGapCard } from "@/components/msp-gap-card";
import { inr, num } from "@/lib/format";
import { ALL_MSP } from "@/lib/msp";

export const revalidate = 600;
export const dynamic = "force-dynamic";

export default async function Home() {
  const date = await getLatestDate();
  const summary = date ? await getDailySummary(date) : null;
  const lastIngest = await getLastIngestStatus().catch(() => null);

  // Pick a handful of MSP commodities to show market-vs-MSP cards for.
  const mspPicks = ["Wheat", "Paddy", "Cotton", "Soyabean", "Mustard"];
  const mspSnaps = date
    ? await Promise.all(
        mspPicks.map((c) =>
          getCommoditySnapshot(c, date).then((s) => ({ commodity: c, snap: s })),
        ),
      )
    : [];
  const mspCards = mspSnaps.filter((s) => s.snap?.national_modal != null);

  if (!date || !summary) {
    return (
      <div className="mx-auto max-w-[78rem] px-4 py-16 md:px-6">
        <h1 className="hero-display text-highlight">Mandi Mitra</h1>
        <p className="mt-4 max-w-xl text-ink-soft">
          Daily wholesale mandi prices for thousands of markets across India. The
          data pipeline is set up but no records have been ingested yet. Run the
          backfill cron, then refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[78rem] px-4 py-8 md:px-6 md:py-12">
      {/* Hero */}
      <section className="flex flex-col gap-4 border-b border-line pb-8">
        <LastUpdated date={date} finishedAt={lastIngest?.finished_at} />
        <h1 className="hero-display text-highlight">
          Today&apos;s mandi pulse.
        </h1>
        <p className="max-w-2xl text-base text-ink-soft md:text-lg">
          Wholesale prices from <span className="num font-medium text-ink">{num(summary.total_markets)}</span>{" "}
          markets across <span className="num font-medium text-ink">{num(summary.total_commodities)}</span>{" "}
          commodities — refreshed daily from AGMARKNET.
        </p>
        <div className="grid grid-cols-3 gap-3 text-center md:max-w-xl">
          <Stat label="Markets" value={summary.total_markets} />
          <Stat label="Commodities" value={summary.total_commodities} />
          <Stat label="Records" value={summary.total_records} />
        </div>
      </section>

      {/* AI commentary */}
      {summary.ai_commentary && (
        <section className="mt-10 rounded-2xl border border-line bg-card p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-accent">
              Daily commentary
            </div>
            <div className="text-xs text-ink-muted">AI-generated · informational</div>
          </div>
          <div className="mt-3 space-y-3 text-base leading-relaxed text-ink-soft md:text-[1.05rem]">
            {summary.ai_commentary.split(/\n{2,}|\n/).filter(Boolean).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}

      {/* Top gainers */}
      <Section title="Top gainers" subtitle="Largest one-day price moves across states with ≥3 reporting mandis.">
        <MoverGrid movers={summary.top_gainers ?? []} fallback="Not enough reporting markets today for a gainer list." />
      </Section>

      {/* Top losers */}
      <Section title="Top losers" subtitle="Where prices fell most since yesterday.">
        <MoverGrid movers={summary.top_losers ?? []} fallback="No qualifying decliners today." />
      </Section>

      {/* MSP watch */}
      {mspCards.length > 0 && (
        <Section title="MSP watch" subtitle="Today's average market modal price vs the announced Minimum Support Price.">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {mspCards.map(({ commodity, snap }) => (
              <MspGapCard
                key={commodity}
                commodity={commodity}
                marketPrice={snap!.national_modal}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            MSP table covers {ALL_MSP.length} crop varieties for current Kharif and Rabi seasons.
          </p>
        </Section>
      )}

      {/* By state */}
      <Section title="Browse by state" subtitle="Daily snapshot of every state with reporting mandis.">
        <div className="flex flex-wrap gap-2">
          {INDIA_STATES.map((s) => (
            <Link
              key={s}
              href={`/s/${slugify(s)}`}
              className="rounded-full border border-line bg-card px-3 py-1 text-sm text-ink-soft hover:border-accent/40 hover:text-ink"
            >
              {s}
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4">
        <h2 className="font-[var(--font-heading)] text-2xl font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-3">
      <div className="stat-big text-ink">{inr(value).replace("₹", "")}</div>
      <div className="text-xs uppercase tracking-wider text-ink-muted">{label}</div>
    </div>
  );
}

function MoverGrid({
  movers,
  fallback,
}: {
  movers: { commodity: string; state: string; pct_change: number; modal_price: number; prev_modal_price: number; sample_size: number }[];
  fallback: string;
}) {
  if (!movers?.length) {
    return (
      <div className="rounded-xl border border-line bg-card p-6 text-sm text-ink-muted">
        {fallback}
      </div>
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
