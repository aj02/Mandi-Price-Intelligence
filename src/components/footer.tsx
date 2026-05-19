import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-background">
      <div className="mx-auto grid max-w-[78rem] gap-6 px-4 py-10 text-sm text-ink-soft md:grid-cols-3 md:px-6">
        <div className="space-y-2">
          <div className="font-[var(--font-heading)] text-base font-semibold text-ink">
            Mandi Mitra
          </div>
          <p className="max-w-sm leading-relaxed">
            An independent, free dashboard for India&apos;s wholesale mandi prices,
            built on AGMARKNET data published by the Govt of India.
          </p>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wider text-ink-muted">Explore</div>
          <ul className="space-y-1">
            <li><Link href="/" className="hover:text-ink">Daily pulse</Link></li>
            <li><Link href="/search" className="hover:text-ink">Search commodities &amp; mandis</Link></li>
            <li><Link href="/about" className="hover:text-ink">About &amp; method</Link></li>
          </ul>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wider text-ink-muted">Notice</div>
          <p className="leading-relaxed">
            Prices sourced from AGMARKNET via data.gov.in. Mandi Mitra is an independent
            project and is not affiliated with any government body. Verify before
            commercial decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
