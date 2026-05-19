import Link from "next/link";
import { inr } from "@/lib/format";
import { slugify } from "@/lib/constants";

type Row = { state: string; modal_price: number; mandi_count: number };

export function StateHeatmap({ data, label }: { data: Row[]; label: string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((r) => r.modal_price));
  const min = Math.min(...data.map((r) => r.modal_price));
  const range = Math.max(1, max - min);

  return (
    <div className="card-elev p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-ink">{label}</div>
        <div className="text-xs text-ink-muted">
          <span className="num">{inr(min)}</span> – <span className="num">{inr(max)}</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((r) => {
          const intensity = (r.modal_price - min) / range;
          return (
            <Link
              key={r.state}
              href={`/s/${slugify(r.state)}`}
              className="group flex items-center justify-between rounded-xl border border-line bg-card px-3 py-2 text-sm transition-colors hover:border-brand/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="h-6 w-1.5 shrink-0 rounded-full"
                  style={{
                    background: `linear-gradient(180deg, oklch(${0.62 - intensity * 0.1} ${0.16 + intensity * 0.04} 152) 0%, oklch(${0.5 - intensity * 0.1} 0.2 264) 100%)`,
                  }}
                />
                <span className="truncate text-ink">{r.state}</span>
                <span className="shrink-0 text-[11px] text-ink-muted">
                  {r.mandi_count} mandis
                </span>
              </div>
              <span className="num ml-3 shrink-0 text-xs font-medium text-ink-soft group-hover:text-ink">
                {inr(r.modal_price)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
