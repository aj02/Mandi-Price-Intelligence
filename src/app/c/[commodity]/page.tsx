import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { slugify, unslugify } from "@/lib/constants";
import {
  getCommodityMandiRows,
  getCommoditySnapshot,
  getCommodityStateHeatmap,
  getCommodityTrend,
  getLatestDate,
  getAllCommodities,
} from "@/lib/queries";
import { LastUpdated } from "@/components/last-updated";
import { TrendChart } from "@/components/trend-chart";
import { StateHeatmap } from "@/components/state-heatmap";
import { MandiTable } from "@/components/mandi-table";
import { MspGapCard } from "@/components/msp-gap-card";
import { inr } from "@/lib/format";
import { findMsp } from "@/lib/msp";

export const revalidate = 600;
export const dynamic = "force-dynamic";

async function resolveCommodity(slug: string): Promise<string | null> {
  const all = await getAllCommodities();
  const candidate = unslugify(slug);
  const lc = candidate.toLowerCase();
  return (
    all.find((c) => slugify(c) === slug) ||
    all.find((c) => c.toLowerCase() === lc) ||
    all.find((c) => c.toLowerCase().includes(lc)) ||
    null
  );
}

export async function generateMetadata(
  props: PageProps<"/c/[commodity]">,
): Promise<Metadata> {
  const { commodity: slug } = await props.params;
  const commodity = (await resolveCommodity(slug)) ?? unslugify(slug);
  return {
    title: `${commodity} mandi prices today`,
    description: `Today's wholesale ${commodity.toLowerCase()} prices across Indian mandis, with 30-day trend and state breakdown.`,
  };
}

export default async function CommodityPage(
  props: PageProps<"/c/[commodity]">,
) {
  const { commodity: slug } = await props.params;
  const commodity = await resolveCommodity(slug);
  if (!commodity) notFound();

  const date = await getLatestDate();
  if (!date) notFound();

  const [snap, rows, trend, heatmap] = await Promise.all([
    getCommoditySnapshot(commodity, date),
    getCommodityMandiRows(commodity, date),
    getCommodityTrend(commodity, 30),
    getCommodityStateHeatmap(commodity, date),
  ]);

  const msp = findMsp(commodity);

  return (
    <div className="mx-auto max-w-[78rem] px-4 py-8 md:px-6 md:py-12">
      <div className="mb-3">
        <LastUpdated date={date} />
      </div>
      <h1 className="hero-display text-highlight">{commodity}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Wholesale prices from {snap?.mandi_count ?? 0} mandis across{" "}
        {snap?.state_count ?? 0} states today.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatTile label="National min" value={snap?.national_min} />
        <StatTile label="Avg modal" value={snap?.national_modal} highlight />
        <StatTile label="National max" value={snap?.national_max} />
      </div>

      {msp && snap?.national_modal != null && (
        <div className="mt-6 max-w-xl">
          <MspGapCard commodity={commodity} marketPrice={snap.national_modal} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-3 font-[var(--font-heading)] text-xl font-semibold text-ink">
          30-day trend
        </h2>
        <TrendChart data={trend} />
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="mb-3 font-[var(--font-heading)] text-xl font-semibold text-ink">
            Mandis reporting today
          </h2>
          <MandiTable rows={rows} />
          {rows.length === 0 && (
            <p className="mt-3 text-sm text-ink-muted">
              No mandis reported this commodity today. Try yesterday.
            </p>
          )}
        </div>
        <div>
          <h2 className="mb-3 font-[var(--font-heading)] text-xl font-semibold text-ink">
            By state
          </h2>
          <StateHeatmap data={heatmap} label={`${commodity} · today`} />
        </div>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-card px-4 py-4 ${highlight ? "border-accent/40" : "border-line"}`}>
      <div className="text-xs uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="stat-big mt-1 text-ink">{value == null ? "—" : inr(value)}</div>
      <div className="text-xs text-ink-muted">per quintal</div>
    </div>
  );
}

export async function generateStaticParams() {
  return [];
}
