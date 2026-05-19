import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center md:px-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-brand">404</div>
      <h1 className="hero-display mt-2 text-ink">Not found.</h1>
      <p className="mt-3 text-ink-soft">
        That commodity, mandi or state isn&apos;t in our records. Try the
        search or jump back to the daily pulse.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          Daily pulse <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink hover:border-brand/40"
        >
          Search
        </Link>
      </div>
    </div>
  );
}
