import { lastSuccessfulIngest } from "@/lib/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const last = await lastSuccessfulIngest();
    return Response.json({ ok: true, last });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
