import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { slugify, unslugify } from "@/lib/constants";
import {
  getAllMandis,
  getLatestDate,
  getMandiContext,
  getMandiRows,
} from "@/lib/queries";
import { LastUpdated } from "@/components/last-updated";
import { MandiTable } from "@/components/mandi-table";

export const revalidate = 600;
export const dynamic = "force-dynamic";

async function resolveMarket(slug: string): Promise<{ market: string; state: string } | null> {
  const all = await getAllMandis();
  const target = all.find((m) => slugify(m.market) === slug);
  if (target) return target;
  const guess = unslugify(slug);
  return all.find((m) => m.market.toLowerCase() === guess.toLowerCase()) ?? null;
}

export async function generateMetadata(
  props: PageProps<"/m/[market]">,
): Promise<Metadata> {
  const { market: slug } = await props.params;
  const resolved = await resolveMarket(slug);
  const name = resolved?.market ?? unslugify(slug);
  return {
    title: `${name} mandi prices today`,
    description: `Today's wholesale prices for all commodities reporting at ${name} mandi.`,
  };
}

export default async function MandiPage(props: PageProps<"/m/[market]">) {
  const { market: slug } = await props.params;
  const resolved = await resolveMarket(slug);
  if (!resolved) notFound();

  const ctx =
    (await getMandiContext(resolved.market)) ??
    { market: resolved.market, district: "", state: resolved.state };
  const date = await getLatestDate();
  if (!date) notFound();

  const rows = await getMandiRows(resolved.market, date);

  return (
    <div className="mx-auto max-w-[78rem] px-4 py-8 md:px-6 md:py-12">
      <div className="mb-3">
        <LastUpdated date={date} />
      </div>
      <h1 className="hero-display text-highlight">{ctx.market}</h1>
      <p className="mt-2 text-ink-soft">
        {ctx.district}
        <span className="mx-2 text-ink-muted">·</span>
        <Link href={`/s/${slugify(ctx.state)}`} className="hover:text-ink">
          {ctx.state}
        </Link>
      </p>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-[var(--font-heading)] text-xl font-semibold text-ink">
            Today&apos;s commodities
          </h2>
          <div className="text-sm text-ink-muted">{rows.length} reporting</div>
        </div>
        <MandiTable rows={rows} showCommodity />
        {rows.length === 0 && (
          <p className="mt-3 text-sm text-ink-muted">
            No commodities reported at this mandi today.
          </p>
        )}
      </section>
    </div>
  );
}

export async function generateStaticParams() {
  return [];
}
