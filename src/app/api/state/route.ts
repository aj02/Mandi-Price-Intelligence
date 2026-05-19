import type { NextRequest } from "next/server";
import { STATE_COOKIE } from "@/lib/geo";
import { INDIA_STATES } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const state = (form?.get("state") ?? req.nextUrl.searchParams.get("state"))?.toString().trim();
  const back = (form?.get("back") ?? req.nextUrl.searchParams.get("back"))?.toString() || "/";

  if (!state || !(INDIA_STATES as readonly string[]).includes(state)) {
    return new Response("invalid state", { status: 400 });
  }

  const url = new URL(back, req.nextUrl.origin);
  const res = Response.redirect(url, 303);
  res.headers.set(
    "set-cookie",
    `${STATE_COOKIE}=${encodeURIComponent(state)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`,
  );
  return res;
}

export async function DELETE() {
  const res = new Response(null, { status: 204 });
  res.headers.set("set-cookie", `${STATE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  return res;
}
