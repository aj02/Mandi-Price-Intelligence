import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid max-w-[82rem] gap-8 px-4 py-10 text-sm text-ink-soft md:grid-cols-3 md:px-6">
        <div className="space-y-2">
          <div className="text-base font-semibold text-ink">Mandi Mitra</div>
          <p className="max-w-sm leading-relaxed text-ink-muted">
            Open-source dashboard for India&apos;s wholesale mandi prices.
            Built on the AGMARKNET feed from data.gov.in.
          </p>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Explore
          </div>
          <ul className="space-y-1.5">
            <li><Link href="/" className="hover:text-ink">Daily pulse</Link></li>
            <li><Link href="/search" className="hover:text-ink">Search</Link></li>
            <li><Link href="/about" className="hover:text-ink">About &amp; method</Link></li>
          </ul>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Disclaimer
          </div>
          <p className="leading-relaxed text-ink-muted">
            Prices sourced from AGMARKNET (Govt of India). Mandi Mitra is an
            independent project. Verify before commercial decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
