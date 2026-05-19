import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { pct } from "@/lib/format";

export function ChangePill({
  change,
  size = "sm",
}: {
  change: number | null | undefined;
  size?: "sm" | "md";
}) {
  const padding = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";
  const text = size === "md" ? "text-sm" : "text-xs";
  const icon = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  if (change == null || !Number.isFinite(change)) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-secondary ${padding} ${text} text-ink-muted`}
      >
        <Minus className={icon} /> —
      </span>
    );
  }
  if (change >= 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-up-soft ${padding} ${text} font-semibold text-up tabular num`}
      >
        <ArrowUp className={icon} /> {pct(change)}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-down-soft ${padding} ${text} font-semibold text-down tabular num`}
    >
      <ArrowDown className={icon} /> {pct(change)}
    </span>
  );
}
