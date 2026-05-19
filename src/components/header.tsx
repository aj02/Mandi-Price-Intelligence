import Link from "next/link";
import { Sprout } from "lucide-react";
import { SearchBar } from "./search-bar";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex max-w-[78rem] items-center gap-4 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-highlight"
          aria-label="Mandi Mitra home"
        >
          <span className="grid h-8 w-8 place-items-center rounded-md bg-highlight text-background">
            <Sprout className="h-4 w-4" />
          </span>
          <span className="font-[var(--font-heading)] text-lg font-semibold tracking-tight">
            Mandi Mitra
          </span>
        </Link>
        <nav className="hidden gap-4 text-sm text-ink-soft md:flex">
          <Link href="/" className="hover:text-ink">Pulse</Link>
          <Link href="/search" className="hover:text-ink">Search</Link>
          <Link href="/about" className="hover:text-ink">About</Link>
        </nav>
        <div className="ml-auto w-full max-w-md">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
