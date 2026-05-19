import { findMsp } from "@/lib/msp";
import { inr } from "@/lib/format";
import { ChangePill } from "./change-pill";

export function MspGapCard({
  commodity,
  variety,
  marketPrice,
}: {
  commodity: string;
  variety?: string | null;
  marketPrice: number | null | undefined;
}) {
  const msp = findMsp(commodity, variety);
  if (!msp || marketPrice == null) return null;
  const gapPct = ((marketPrice - msp.price_per_quintal) / msp.price_per_quintal) * 100;
  const aboveMsp = gapPct >= 0;
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-ink-muted">
        <span>{commodity}{msp.variety ? ` · ${msp.variety}` : ""}</span>
        <span>{msp.season}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-ink-muted">Market modal</div>
          <div className="num mt-0.5 text-xl font-semibold text-ink">{inr(marketPrice)}</div>
        </div>
        <div>
          <div className="text-xs text-ink-muted">MSP</div>
          <div className="num mt-0.5 text-xl font-semibold text-ink">{inr(msp.price_per_quintal)}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-ink-soft">
          {aboveMsp ? "Above MSP" : "Below MSP"}
        </span>
        <ChangePill change={gapPct} />
      </div>
    </div>
  );
}
