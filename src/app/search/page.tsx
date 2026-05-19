import type { Metadata } from "next";
import Link from "next/link";
import Fuse from "fuse.js";
import {
  getAllCommodities,
  getAllMandis,
} from "@/lib/queries";
import { INDIA_STATES, slugify } from "@/lib/constants";
import { resolveAlias } from "@/lib/commodity-aliases";

export const revalidate = 600;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Search commodities, mandis and states across India.",
};

type Hit =
  | { kind: "commodity"; value: string; score: number }
  | { kind: "mandi"; value: string; state: string; score: number }
  | { kind: "state"; value: string; score: number };

async function runSearch(q: string): Promise<{ aliased: string | null; hits: Hit[] }> {
  const aliased = resolveAlias(q);
  const terms = aliased ? [aliased, q] : [q];

  const [commodities, mandis] = await Promise.all([getAllCommodities(), getAllMandis()]);
  const fc = new Fuse(commodities, { includeScore: true, threshold: 0.4 });
  const fm = new Fuse(mandis, {
    keys: ["market", "state"],
    includeScore: true,
    threshold: 0.4,
  });
  const states: string[] = [...INDIA_STATES];
  const fs = new Fuse(states, { includeScore: true, threshold: 0.4 });

  const out: Hit[] = [];
  for (const t of terms) {
    for (const r of fc.search(t, { limit: 25 }))
      out.push({ kind: "commodity", value: r.item, score: r.score ?? 1 });
    for (const r of fm.search(t, { limit: 25 }))
      out.push({
        kind: "mandi",
        value: r.item.market,
        state: r.item.state,
        score: r.score ?? 1,
      });
    for (const r of fs.search(t, { limit: 10 }))
      out.push({ kind: "state", value: r.item, score: r.score ?? 1 });
  }

  const dedup = new Map<string, Hit>();
  for (const h of out) {
    const k = `${h.kind}:${h.value}`;
    const prev = dedup.get(k);
    if (!prev || h.score < prev.score) dedup.set(k, h);
  }
  return {
    aliased,
    hits: Array.from(dedup.values()).sort((a, b) => a.score - b.score).slice(0, 60),
  };
}

export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams;
  const raw = sp?.q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  if (!q) {
    return (
      <div className="mx-auto max-w-[78rem] px-4 py-12 md:px-6">
        <h1 className="hero-display text-highlight">Search</h1>
        <p className="mt-3 text-ink-soft">
          Use the bar at the top to find a commodity (e.g. <em>tomato</em>, <em>tamatar</em>),
          a mandi (<em>Nashik</em>), or a state (<em>Punjab</em>).
        </p>
      </div>
    );
  }

  const { aliased, hits } = await runSearch(q);
  const commodities = hits.filter((h) => h.kind === "commodity");
  const mandis = hits.filter((h) => h.kind === "mandi");
  const states = hits.filter((h) => h.kind === "state");

  return (
    <div className="mx-auto max-w-[78rem] px-4 py-12 md:px-6">
      <h1 className="hero-display text-highlight">
        Results for <span className="text-ink">&ldquo;{q}&rdquo;</span>
      </h1>
      {aliased && (
        <p className="mt-2 text-sm text-ink-muted">
          Interpreted as <span className="font-medium text-ink">{aliased}</span>.
        </p>
      )}

      <Bucket title="Commodities" hits={commodities} hrefBase="/c" />
      <Bucket title="Mandis" hits={mandis} hrefBase="/m" />
      <Bucket title="States" hits={states} hrefBase="/s" />

      {hits.length === 0 && (
        <p className="mt-8 text-ink-muted">No matches. Try a shorter or different term.</p>
      )}
    </div>
  );
}

function Bucket({
  title,
  hits,
  hrefBase,
}: {
  title: string;
  hits: Hit[];
  hrefBase: "/c" | "/m" | "/s";
}) {
  if (!hits.length) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-[var(--font-heading)] text-xl font-semibold text-ink">
        {title}
      </h2>
      <div className="flex flex-wrap gap-2">
        {hits.map((h) => (
          <Link
            key={`${h.kind}-${h.value}`}
            href={`${hrefBase}/${slugify(h.value)}`}
            className="rounded-full border border-line bg-card px-3 py-1 text-sm text-ink-soft hover:border-accent/40 hover:text-ink"
          >
            {h.value}
            {h.kind === "mandi" && (
              <span className="ml-1 text-xs text-ink-muted">· {h.state}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
