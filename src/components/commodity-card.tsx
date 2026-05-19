import Link from "next/link";
import { inr } from "@/lib/format";
import { slugify } from "@/lib/constants";
import { ChangePill } from "./change-pill";
import type { TopMover } from "@/lib/db";

export function CommodityCard({ mover }: { mover: TopMover }) {
  return (
    <Link
      href={`/c/${slugify(mover.commodity)}`}
      className="group block rounded-xl border border-line bg-card p-4 transition-colors hover:border-accent/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-muted">
            {mover.state}
          </div>
          <div className="mt-0.5 font-[var(--font-heading)] text-lg font-semibold text-ink">
            {mover.commodity}
          </div>
        </div>
        <ChangePill change={mover.pct_change} />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="num text-2xl font-semibold text-ink">
          {inr(mover.modal_price)}
        </span>
        <span className="text-xs text-ink-muted">per quintal</span>
      </div>
      <div className="mt-1 text-xs text-ink-muted">
        <span className="num">prev {inr(mover.prev_modal_price)}</span>
        <span className="mx-2">·</span>
        <span>{mover.sample_size} mandis</span>
      </div>
    </Link>
  );
}
