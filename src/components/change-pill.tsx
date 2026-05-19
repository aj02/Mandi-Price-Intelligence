import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { pct } from "@/lib/format";

export function ChangePill({ change }: { change: number | null | undefined }) {
  if (change == null || !Number.isFinite(change)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-ink-muted">
        <Minus className="h-3 w-3" /> —
      </span>
    );
  }
  if (change >= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-up-soft px-2 py-0.5 text-xs font-medium text-up tabular num">
        <ArrowUpRight className="h-3 w-3" /> {pct(change)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-down-soft px-2 py-0.5 text-xs font-medium text-down tabular num">
      <ArrowDownRight className="h-3 w-3" /> {pct(change)}
    </span>
  );
}
