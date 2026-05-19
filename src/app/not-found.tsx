import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center md:px-6">
      <div className="text-xs font-medium uppercase tracking-wider text-accent">404</div>
      <h1 className="hero-display mt-2 text-highlight">Not found.</h1>
      <p className="mt-3 text-ink-soft">
        We couldn&apos;t find that commodity, mandi or state. Try the search or head home.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded-full bg-highlight px-4 py-2 text-sm font-medium text-background">
          Daily pulse
        </Link>
        <Link href="/search" className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink">
          Search
        </Link>
      </div>
    </div>
  );
}
