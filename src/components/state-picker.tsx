"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MapPin } from "lucide-react";
import { INDIA_STATES, slugify } from "@/lib/constants";

export function StatePicker({
  current,
  hint,
}: {
  current: string | null;
  hint?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (!next) return;
    document.cookie = `mm_state=${encodeURIComponent(next)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    start(() => {
      router.push(`/s/${slugify(next)}`);
      router.refresh();
    });
  }

  return (
    <label className="group inline-flex items-center gap-2 rounded-full border border-line bg-card pl-3 pr-1 py-1 text-sm shadow-sm transition-colors hover:border-brand/40">
      <MapPin className="h-3.5 w-3.5 text-brand" aria-hidden />
      <span className="text-xs uppercase tracking-wider text-ink-muted">
        {hint ?? "State"}
      </span>
      <select
        value={current ?? ""}
        onChange={onChange}
        disabled={pending}
        className="cursor-pointer appearance-none bg-transparent pl-1 pr-6 text-sm font-medium text-ink outline-none disabled:opacity-50"
        aria-label="Pick your state"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2358606e' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.5rem center",
        }}
      >
        <option value="" disabled>
          Choose…
        </option>
        {INDIA_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </label>
  );
}
