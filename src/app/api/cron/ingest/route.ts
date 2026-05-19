import type { NextRequest } from "next/server";
import { ingestDate } from "@/lib/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const hdr = req.headers.get("authorization");
  if (hdr === `Bearer ${secret}`) return true;
  // Vercel Cron sends an x-vercel-cron-signature internally; fallback to query param for local backfill.
  const qsSecret = req.nextUrl.searchParams.get("secret");
  return qsSecret === secret;
}

function parseDate(s: string | null): Date {
  if (!s) return new Date();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`bad date ?date=${s}, expected YYYY-MM-DD`);
  return new Date(`${s}T00:00:00Z`);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const target = parseDate(req.nextUrl.searchParams.get("date"));
    const result = await ingestDate(target);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/ingest]", msg);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}

export const POST = GET;
