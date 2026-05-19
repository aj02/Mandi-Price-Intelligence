import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Wheat } from "lucide-react";
import { INDIA_STATES, slugify, unslugify } from "@/lib/constants";
import {
  getLatestDate,
  getStateRows,
  getStateSnapshot,
  getStateTopCommodities,
} from "@/lib/queries";
import { LastUpdated } from "@/components/last-updated";
import { MandiTable } from "@/components/mandi-table";
import { inr, num } from "@/lib/format";
import { detectUserState } from "@/lib/geo";
import { FOCUS_STATE } from "@/lib/focus";

export const revalidate = 600;
export const dynamic = "force-dynamic";

function resolveState(slug: string): string | null {
  const guess = unslugify(slug).toLowerCase();
  const found =
    INDIA_STATES.find((s) => slugify(s) === slug) ??
    INDIA_STATES.find((s) => s.toLowerCase() === guess) ??
    null;
  if (!found) return null;
  // Focus mode: only the focus state is accessible — every other state 404s.
  if (FOCUS_STATE && found !== FOCUS_STATE) return null;
  return found;
}

export async function generateMetadata(
  props: PageProps<"/s/[state]">,
): Promise<Metadata> {
  const { state: slug } = await props.params;
  const state = resolveState(slug) ?? unslugify(slug);
  return {
    title: `${state} mandi prices today`,
    description: `Today's wholesale mandi prices and top commodities for ${state}.`,
  };
}

export default async function StatePage(props: PageProps<"/s/[state]">) {
  const { state: slug } = await props.params;
  const state = resolveState(slug);
  if (!state) notFound();

  const date = await getLatestDate();
  if (!date) notFound();

  const [snap, topCommodities, rows, userGeo] = await Promise.all([
    getStateSnapshot(state, date),
    getStateTopCommodities(state, date, 24),
    getStateRows(state, date),
    detectUserState(),
  ]);

  const isYours = userGeo.state === state;
  const mandis = Array.from(new Set(rows.map((r) => r.market)));
  const districts = Array.from(new Set(rows.map((r) => r.district)));

  return (
    <div className="mx-auto max-w-[82rem] px-4 py-6 md:px-6 md:py-10">
      {/* Hero */}
      <section className="grad-brand relative overflow-hidden rounded-3xl border border-line p-6 md:p-10">
        <div className="absolute right-0 top-0 -mt-24 -mr-24 h-80 w-80 rounded-full bg-brand/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-center gap-2">
          <LastUpdated date={date} />
          {isYours && (
            <span className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-medium text-brand">
              <MapPin className="h-3 w-3" /> Your state
            </span>
          )}
        </div>
        <h1 className="hero-display mt-5 text-ink">{state}</h1>
        {snap && (
          <p className="mt-3 max-w-2xl text-base text-ink-soft md:text-lg">
            <span className="num font-semibold text-ink">{snap.mandi_count}</span> markets
            in <span className="num font-semibold text-ink">{snap.district_count}</span> districts
            reporting <span className="num font-semibold text-ink">{snap.commodity_count}</span> commodities.
          </p>
        )}
        {snap && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <HeroStat icon={<Building2 className="h-4 w-4" />} label="Active mandis" value={snap.mandi_count} />
            <HeroStat icon={<Wheat className="h-4 w-4" />} label="Commodities" value={snap.commodity_count} />
            <HeroStat icon={<MapPin className="h-4 w-4" />} label="Districts" value={snap.district_count} />
          </div>
        )}
      </section>

      {/* Top commodities */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold text-ink">Top commodities in {state}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {topCommodities.map((c) => (
            <Link
              key={c.commodity}
              href={`/c/${slugify(c.commodity)}`}
              className="card-elev card-elev-hover p-4"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                {c.mandi_count} mandis
              </div>
              <div className="mt-1 truncate text-base font-semibold text-ink">
                {c.commodity}
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="num text-lg font-semibold text-ink">{inr(c.modal_price)}</span>
                <span className="text-[11px] text-ink-muted">/quintal</span>
              </div>
            </Link>
          ))}
          {!topCommodities.length && (
            <div className="card-elev p-6 text-sm text-ink-muted sm:col-span-2 lg:col-span-3 xl:col-span-4">
              No commodities reported in {state} today.
            </div>
          )}
        </div>
      </section>

      {/* Active mandis */}
      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">Active mandis</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {mandis.length} markets across {districts.length} districts.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {mandis.slice(0, 120).map((m) => (
            <Link
              key={m}
              href={`/m/${slugify(m)}`}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-3 py-1.5 text-sm text-ink-soft shadow-sm transition-colors hover:border-brand/40 hover:text-ink"
            >
              {m}
              <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
          {mandis.length > 120 && (
            <span className="rounded-full bg-secondary px-3 py-1.5 text-sm text-ink-muted">
              +{num(mandis.length - 120)} more
            </span>
          )}
        </div>
      </section>

      {/* All rows */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold text-ink">All reporting rows today</h2>
        <MandiTable
          rows={rows.slice(0, 250)}
          showCommodity
          emptyMessage={`No mandi rows for ${state} today.`}
        />
        {rows.length > 250 && (
          <p className="mt-2 text-xs text-ink-muted">
            Showing the first 250 of {num(rows.length)} rows. Use a commodity page for full detail.
          </p>
        )}
      </section>
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
        <div className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</div>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  const states = FOCUS_STATE ? [FOCUS_STATE] : INDIA_STATES;
  return states.map((s) => ({ state: slugify(s) }));
}
