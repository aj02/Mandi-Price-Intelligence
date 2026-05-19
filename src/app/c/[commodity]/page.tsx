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
    <div className="mx-auto max-w-[82rem] px-4 py-6 md:px-6 md:py-10">
      <section className="grad-brand relative overflow-hidden rounded-3xl border border-line p-6 md:p-10">
        <div className="absolute right-0 top-0 -mt-20 -mr-20 h-72 w-72 rounded-full bg-brand/10 blur-3xl" aria-hidden />
        <div className="relative">
          <LastUpdated date={date} />
          <h1 className="hero-display mt-5 text-ink">{commodity}</h1>
          <p className="mt-3 max-w-2xl text-base text-ink-soft md:text-lg">
            Wholesale prices from{" "}
            <span className="num font-semibold text-ink">{snap?.mandi_count ?? 0}</span> mandis
            across <span className="num font-semibold text-ink">{snap?.state_count ?? 0}</span> states.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatTile label="National min" value={snap?.national_min} />
            <StatTile label="Avg modal" value={snap?.national_modal} highlight />
            <StatTile label="National max" value={snap?.national_max} />
          </div>
        </div>
      </section>

      {msp && snap?.national_modal != null && (
        <div className="mt-6 max-w-xl">
          <MspGapCard commodity={commodity} marketPrice={snap.national_modal} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold text-ink">30-day trend</h2>
        <TrendChart data={trend} />
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="mb-3 text-xl font-semibold text-ink">
            Mandis reporting today
          </h2>
          <MandiTable
            rows={rows}
            emptyMessage="No mandis reported this commodity today."
          />
        </div>
        <div>
          <h2 className="mb-3 text-xl font-semibold text-ink">By state</h2>
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
    <div
      className={`card-elev p-4 ${highlight ? "ring-2 ring-brand/25" : ""}`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </div>
      <div className="stat-big mt-1.5 text-ink">
        {value == null ? "—" : inr(value)}
      </div>
      <div className="text-[11px] text-ink-muted">per quintal</div>
    </div>
  );
}

export async function generateStaticParams() {
  return [];
}
