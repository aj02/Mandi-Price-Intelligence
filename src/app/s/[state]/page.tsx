import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { INDIA_STATES, slugify, unslugify } from "@/lib/constants";
import {
  getLatestDate,
  getStateActiveMandiCount,
  getStateRows,
  getStateTopCommodities,
} from "@/lib/queries";
import { LastUpdated } from "@/components/last-updated";
import { MandiTable } from "@/components/mandi-table";
import { inr } from "@/lib/format";

export const revalidate = 600;
export const dynamic = "force-dynamic";

function resolveState(slug: string): string | null {
  const guess = unslugify(slug).toLowerCase();
  return (
    INDIA_STATES.find((s) => slugify(s) === slug) ??
    INDIA_STATES.find((s) => s.toLowerCase() === guess) ??
    null
  );
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

  const [mandiCount, topCommodities, rows] = await Promise.all([
    getStateActiveMandiCount(state, date),
    getStateTopCommodities(state, date, 16),
    getStateRows(state, date),
  ]);

  const mandis = Array.from(new Set(rows.map((r) => r.market))).slice(0, 80);

  return (
    <div className="mx-auto max-w-[78rem] px-4 py-8 md:px-6 md:py-12">
      <div className="mb-3">
        <LastUpdated date={date} />
      </div>
      <h1 className="hero-display text-highlight">{state}</h1>
      <p className="mt-2 text-ink-soft">
        <span className="num font-medium text-ink">{mandiCount}</span> active mandis reporting today.
      </p>

      <section className="mt-8">
        <h2 className="mb-3 font-[var(--font-heading)] text-xl font-semibold text-ink">
          Top commodities
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topCommodities.map((c) => (
            <Link
              key={c.commodity}
              href={`/c/${slugify(c.commodity)}`}
              className="rounded-xl border border-line bg-card p-4 hover:border-accent/40"
            >
              <div className="text-xs uppercase tracking-wider text-ink-muted">
                {c.mandi_count} mandis
              </div>
              <div className="mt-0.5 font-[var(--font-heading)] text-base font-semibold text-ink">
                {c.commodity}
              </div>
              <div className="num mt-2 text-lg font-medium text-ink">{inr(c.modal_price)}</div>
            </Link>
          ))}
          {!topCommodities.length && (
            <p className="text-sm text-ink-muted">No commodities reported today.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-[var(--font-heading)] text-xl font-semibold text-ink">
          Active mandis
        </h2>
        <div className="flex flex-wrap gap-2">
          {mandis.map((m) => (
            <Link
              key={m}
              href={`/m/${slugify(m)}`}
              className="rounded-full border border-line bg-card px-3 py-1 text-sm text-ink-soft hover:border-accent/40 hover:text-ink"
            >
              {m}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-[var(--font-heading)] text-xl font-semibold text-ink">
          All reporting rows
        </h2>
        <MandiTable rows={rows.slice(0, 250)} showCommodity />
        {rows.length > 250 && (
          <p className="mt-2 text-xs text-ink-muted">
            Showing the first 250 of {rows.length} rows. Use commodity pages for full detail.
          </p>
        )}
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return INDIA_STATES.map((s) => ({ state: slugify(s) }));
}
