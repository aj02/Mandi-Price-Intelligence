import { CalendarClock } from "lucide-react";
import { fmtDate, fmtTimeIST } from "@/lib/format";

export function LastUpdated({
  date,
  finishedAt,
}: {
  date: string | null | undefined;
  finishedAt?: string | null;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs text-ink-soft">
      <CalendarClock className="h-3.5 w-3.5 text-accent" aria-hidden />
      <span className="font-medium text-ink">{fmtDate(date)}</span>
      {finishedAt && (
        <>
          <span className="text-ink-muted">·</span>
          <span className="num">{fmtTimeIST(finishedAt)}</span>
        </>
      )}
    </div>
  );
}
