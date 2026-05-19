import Link from "next/link";
import { Wheat } from "lucide-react";
import { SearchBar } from "./search-bar";
import { StatePicker } from "./state-picker";
import { detectUserState } from "@/lib/geo";

export async function Header() {
  const { state, source } = await detectUserState();
  const hint =
    source === "geo" ? "Your area" : source === "cookie" ? "Pinned" : "State";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-[82rem] items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="Mandi Mitra home"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-primary-foreground shadow-sm">
            <Wheat className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <span className="hidden text-base font-semibold tracking-tight text-ink sm:inline">
            Mandi Mitra
          </span>
        </Link>

        <nav className="hidden gap-1 text-sm text-ink-soft lg:flex">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 hover:bg-secondary hover:text-ink"
          >
            Pulse
          </Link>
          <Link
            href="/search"
            className="rounded-full px-3 py-1.5 hover:bg-secondary hover:text-ink"
          >
            Search
          </Link>
          <Link
            href="/about"
            className="rounded-full px-3 py-1.5 hover:bg-secondary hover:text-ink"
          >
            About
          </Link>
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2 md:gap-3">
          <div className="hidden flex-1 md:block md:max-w-sm">
            <SearchBar />
          </div>
          <StatePicker current={state} hint={hint} />
        </div>
      </div>
      <div className="border-t border-line/60 px-4 py-2 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
