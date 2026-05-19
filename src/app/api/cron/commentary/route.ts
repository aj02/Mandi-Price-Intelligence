import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getDailySummary, getLatestDate } from "@/lib/queries";
import { invalidatePrefix } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COMMENTARY_PROMPT = `You are an agricultural market analyst writing a daily commentary for Indian farmers and small traders.

Given today's top moving commodities and 7-day context, write exactly 2 short paragraphs (max 70 words each):

Paragraph 1: Describe what moved — name the commodities, the states/regions where they moved most, the rough percentage change. Use plain English a small farmer can read. Mention rupee prices when notable.

Paragraph 2: Suggest 2-3 LIKELY explanations from common drivers — seasonal harvest cycles, monsoon/weather impact, festival demand, transport disruption, or recent policy news. Frame these as "possible reasons" — never as confirmed fact.

STRICT: No financial advice. No "you should buy/sell." Output is informational. Plain prose. No headers, no bullet points, no markdown.`;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const hdr = req.headers.get("authorization");
  return hdr === `Bearer ${secret}` || req.nextUrl.searchParams.get("secret") === secret;
}

async function get7DayContext(date: string) {
  return sql<{ date: string; commodity: string; avg_modal: number }[]>`
    select arrival_date::text as date, commodity, avg(modal_price)::float as avg_modal
    from prices
    where arrival_date between (${date}::date - 7) and ${date}::date
      and modal_price between 50 and 200000
    group by arrival_date, commodity
    having count(*) >= 5
    order by arrival_date asc, commodity asc
    limit 200
  `;
}

async function generateCommentary(payload: unknown): Promise<string | null> {
  const key = process.env.DEEPINFRA_API_KEY;
  if (!key) {
    console.warn("[commentary] DEEPINFRA_API_KEY missing — skipping");
    return null;
  }
  const res = await fetch(
    "https://api.deepinfra.com/v1/openai/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.3-70B-Instruct",
        messages: [
          { role: "system", content: COMMENTARY_PROMPT },
          { role: "user", content: JSON.stringify(payload).slice(0, 12000) },
        ],
        temperature: 0.4,
        max_tokens: 600,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`DeepInfra ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() || null;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const dateParam = req.nextUrl.searchParams.get("date");
    const date = dateParam ?? (await getLatestDate());
    if (!date) {
      return Response.json({ ok: false, error: "no data yet" }, { status: 404 });
    }
    const summary = await getDailySummary(date);
    if (!summary) {
      return Response.json({ ok: false, error: "no summary" }, { status: 404 });
    }
    const ctx = await get7DayContext(date);
    const payload = {
      date,
      totals: {
        records: summary.total_records,
        markets: summary.total_markets,
        commodities: summary.total_commodities,
      },
      top_gainers: summary.top_gainers,
      top_losers: summary.top_losers,
      seven_day_context: ctx,
    };
    const commentary = await generateCommentary(payload);
    if (!commentary) {
      return Response.json({ ok: false, error: "no commentary generated" });
    }
    await sql`update daily_summary set ai_commentary = ${commentary} where arrival_date = ${date}`;
    await invalidatePrefix(`mm:cache:summary:${date}`);
    return Response.json({ ok: true, date, length: commentary.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/commentary]", msg);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}

export const POST = GET;
