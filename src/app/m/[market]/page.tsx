import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { slugify, unslugify } from "@/lib/constants";
import {
  getAllMandis,
  getLatestDate,
  getMandiContext,
  getMandiRows,
} from "@/lib/queries";
import { LastUpdated } from "@/components/last-updated";
import { MandiTable } from "@/components/mandi-table";
import { num } from "@/lib/format";

export const revalidate = 600;
export const dynamic = "force-dynamic";

async function resolveMarket(
  slug: string,
): Promise<{ market: string; state: string } | null> {
  const all = await getAllMandis();
  const target = all.find((m) => slugify(m.market) === slug);
  if (target) return target;
  const guess = unslugify(slug);
  return (
    all.find((m) => m.market.toLowerCase() === guess.toLowerCase()) ?? null
  );
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
    <div className="mx-auto max-w-[82rem] px-4 py-6 md:px-6 md:py-10">
      <section className="grad-brand relative overflow-hidden rounded-3xl border border-line p-6 md:p-10">
        <div className="absolute right-0 top-0 -mt-20 -mr-20 h-72 w-72 rounded-full bg-brand/10 blur-3xl" aria-hidden />
        <div className="relative">
          <LastUpdated date={date} />
          <h1 className="hero-display mt-5 text-ink">{ctx.market}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-base text-ink-soft md:text-lg">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-brand" />
              {ctx.district || "—"}
            </span>
            <span className="text-ink-muted">·</span>
            <Link
              href={`/s/${slugify(ctx.state)}`}
              className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-brand"
            >
              <MapPin className="h-4 w-4 text-brand" />
              {ctx.state}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3">
            <span className="num text-2xl font-semibold text-ink">{num(rows.length)}</span>
            <span className="text-xs uppercase tracking-wider text-ink-muted">
              commodities reporting today
            </span>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold text-ink">Today&apos;s commodities</h2>
        <MandiTable
          rows={rows}
          showCommodity
          emptyMessage="No commodities reported at this mandi today."
        />
      </section>
    </div>
  );
}

export async function generateStaticParams() {
  return [];
}
