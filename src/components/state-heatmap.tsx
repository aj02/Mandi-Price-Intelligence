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
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-ink">{label}</div>
        <div className="text-xs text-ink-muted">
          <span className="num">{inr(min)}</span> – <span className="num">{inr(max)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {data.map((r) => {
          const intensity = (r.modal_price - min) / range; // 0..1
          const bg = intensityToColor(intensity);
          return (
            <Link
              key={r.state}
              href={`/s/${slugify(r.state)}`}
              className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm hover:border-accent/40"
              style={{ background: bg }}
            >
              <span className="truncate text-ink">{r.state}</span>
              <span className="num ml-2 shrink-0 text-xs text-ink-soft">
                {inr(r.modal_price)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function intensityToColor(t: number): string {
  // Cream → ochre gradient.
  const c1 = [250, 250, 246];
  const c2 = [243, 231, 208];
  const c3 = [184, 118, 28];
  const mix = (a: number[], b: number[], k: number) =>
    a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const rgb = t < 0.5 ? mix(c1, c2, t / 0.5) : mix(c2, c3, (t - 0.5) / 0.5);
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.55)`;
}
