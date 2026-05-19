import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Mandi Mitra — an independent dashboard for India's wholesale mandi prices, built on AGMARKNET data.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="hero-display text-ink">About Mandi Mitra</h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-soft">
        <p>
          Mandi Mitra is an independent, free dashboard for wholesale mandi
          prices in India. We pull the daily AGMARKNET feed published by the
          Directorate of Marketing &amp; Inspection on data.gov.in, store it,
          and present it in a format that&apos;s actually usable on a phone.
        </p>
        <p>
          The official AGMARKNET portal works, but it isn&apos;t mobile-friendly
          and doesn&apos;t do trend analysis or cross-mandi comparisons. Most
          farmers have no easy way to know what their crop fetched at the next
          district&apos;s mandi yesterday, let alone a week ago. This site
          tries to close that gap.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-ink">Method</h2>
        <p>
          A scheduled job (11:00 IST daily) fetches all records published for
          the most recent reporting day, validates them with Zod, deduplicates
          against existing rows, and writes them into a Postgres database.
          A summary aggregator computes top movers, totals, and writes a
          short plain-language commentary using an open-source LLM. Everything
          you see is derived from those daily snapshots.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-ink">Caveats</h2>
        <ul className="list-inside list-disc space-y-1.5">
          <li>
            The data.gov.in AGMARKNET API is a single-day snapshot. Historical
            data on this site accumulates forward from launch — one new day
            of data per actual calendar day.
          </li>
          <li>
            AGMARKNET coverage varies by state. Some mandis report
            inconsistently; occasional rows have obvious typos (₹1 modal_price).
            We filter the most extreme values out of summary stats but keep
            raw rows intact.
          </li>
          <li>
            Prices are in ₹/quintal (1 quintal = 100 kg) as published.
          </li>
          <li>
            The AI commentary is informational only. Not financial advice.
            Verify any price before commercial decisions.
          </li>
        </ul>
        <h2 className="pt-2 text-xl font-semibold text-ink">Privacy</h2>
        <p>
          We use Vercel&apos;s server-side geolocation headers (no JavaScript
          geolocation, no permission prompt) to suggest a default state. You
          can override it at any time with the state picker in the header.
          The choice is stored in a first-party cookie. No accounts,
          no tracking, no third-party analytics by default.
        </p>
      </div>
    </div>
  );
}
