import Link from "next/link";
import { inr } from "@/lib/format";
import { slugify } from "@/lib/constants";
import { ChangePill } from "./change-pill";
import type { TopMover } from "@/lib/db";

export function CommodityCard({ mover }: { mover: TopMover }) {
  return (
    <Link
      href={`/c/${slugify(mover.commodity)}`}
      className="card-elev card-elev-hover group block p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            {mover.state}
          </div>
          <div className="mt-1 truncate text-lg font-semibold text-ink">
            {mover.commodity}
          </div>
        </div>
        <ChangePill change={mover.pct_change} size="md" />
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="num text-2xl font-semibold tracking-tight text-ink">
          {inr(mover.modal_price)}
        </span>
        <span className="text-xs text-ink-muted">/quintal</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
        <span className="num">prev {inr(mover.prev_modal_price)}</span>
        <span className="h-1 w-1 rounded-full bg-ink-muted/40" />
        <span>{mover.sample_size} mandis</span>
      </div>
    </Link>
  );
}
