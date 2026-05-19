import type { NextRequest } from "next/server";
import Fuse from "fuse.js";
import { getAllCommodities, getAllMandis } from "@/lib/queries";
import { INDIA_STATES } from "@/lib/constants";
import { resolveAlias } from "@/lib/commodity-aliases";
import { publicLimiter } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const revalidate = 600;

type CommodityHit = { kind: "commodity"; value: string; score: number };
type MandiHit = {
  kind: "mandi";
  value: string;
  state: string;
  score: number;
};
type StateHit = { kind: "state"; value: string; score: number };
type Hit = CommodityHit | MandiHit | StateHit;

let _fuseCommodity: Fuse<string> | null = null;
let _fuseMandi: Fuse<{ market: string; state: string }> | null = null;
let _fuseState: Fuse<string> | null = null;
let _builtAt = 0;

async function ensureIndices() {
  if (_fuseCommodity && _fuseMandi && _fuseState && Date.now() - _builtAt < 30 * 60_000) {
    return;
  }
  const [commodities, mandis] = await Promise.all([getAllCommodities(), getAllMandis()]);
  _fuseCommodity = new Fuse(commodities, { includeScore: true, threshold: 0.4 });
  _fuseMandi = new Fuse(mandis, {
    keys: ["market", "state"],
    includeScore: true,
    threshold: 0.4,
  });
  const states: string[] = [...INDIA_STATES];
  _fuseState = new Fuse(states, { includeScore: true, threshold: 0.4 });
  _builtAt = Date.now();
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return Response.json({ hits: [] });

  const limiter = publicLimiter();
  if (limiter) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    const { success } = await limiter.limit(`search:${ip}`);
    if (!success) return Response.json({ error: "rate limited" }, { status: 429 });
  }

  await ensureIndices();
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "20"), 50);

  const aliased = resolveAlias(q);
  const queries = aliased ? [aliased, q] : [q];

  const hits: Hit[] = [];
  for (const term of queries) {
    for (const r of _fuseCommodity!.search(term, { limit })) {
      hits.push({ kind: "commodity", value: r.item, score: r.score ?? 1 });
    }
    for (const r of _fuseMandi!.search(term, { limit })) {
      hits.push({
        kind: "mandi",
        value: r.item.market,
        state: r.item.state,
        score: r.score ?? 1,
      });
    }
    for (const r of _fuseState!.search(term, { limit })) {
      hits.push({ kind: "state", value: r.item, score: r.score ?? 1 });
    }
  }

  // Dedupe by kind+value, keep best score.
  const map = new Map<string, Hit>();
  for (const h of hits) {
    const k = `${h.kind}:${h.value}`;
    const prev = map.get(k);
    if (!prev || h.score < prev.score) map.set(k, h);
  }

  const out = Array.from(map.values())
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
  return Response.json({ q, aliased, hits: out });
}
