import Link from "next/link";
import { inr } from "@/lib/format";
import { slugify } from "@/lib/constants";
import type { PriceRow } from "@/lib/db";
import { ChangePill } from "./change-pill";

export function MandiTable({
  rows,
  showCommodity = false,
  changes,
  emptyMessage = "No mandi rows for this view.",
}: {
  rows: PriceRow[];
  showCommodity?: boolean;
  changes?: Map<string, number>;
  emptyMessage?: string;
}) {
  if (!rows.length) {
    return (
      <div className="card-elev p-6 text-sm text-ink-muted">{emptyMessage}</div>
    );
  }
  return (
    <div className="card-elev overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line bg-secondary/60 text-left text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3">
                {showCommodity ? "Commodity" : "Mandi"}
              </th>
              <th className="px-4 py-3">
                {showCommodity ? "Variety" : "District / State"}
              </th>
              <th className="num px-4 py-3 text-right">Min</th>
              <th className="num px-4 py-3 text-right">Modal</th>
              <th className="num px-4 py-3 text-right">Max</th>
              {changes && <th className="px-4 py-3 text-right">Δ vs prev</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const key = showCommodity
                ? `${r.commodity}-${r.variety ?? ""}-${r.id}`
                : `${r.market}-${r.id}`;
              const change = changes?.get(
                showCommodity ? r.commodity : r.market,
              );
              return (
                <tr
                  key={key}
                  className="border-b border-line/60 last:border-0 hover:bg-secondary/40"
                >
                  <td className="px-4 py-3">
                    {showCommodity ? (
                      <Link
                        href={`/c/${slugify(r.commodity)}`}
                        className="font-medium text-ink hover:text-brand"
                      >
                        {r.commodity}
                      </Link>
                    ) : (
                      <Link
                        href={`/m/${slugify(r.market)}`}
                        className="font-medium text-ink hover:text-brand"
                      >
                        {r.market}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {showCommodity ? (
                      <span>
                        {r.variety ?? "—"}
                        {r.grade ? ` · ${r.grade}` : ""}
                      </span>
                    ) : (
                      <span>
                        {r.district}
                        <span className="mx-1 text-ink-muted">·</span>
                        <Link
                          href={`/s/${slugify(r.state)}`}
                          className="hover:text-ink"
                        >
                          {r.state}
                        </Link>
                      </span>
                    )}
                  </td>
                  <td className="num px-4 py-3 text-right text-ink-soft">
                    {inr(r.min_price)}
                  </td>
                  <td className="num px-4 py-3 text-right font-semibold text-ink">
                    {inr(r.modal_price)}
                  </td>
                  <td className="num px-4 py-3 text-right text-ink-soft">
                    {inr(r.max_price)}
                  </td>
                  {changes && (
                    <td className="px-4 py-3 text-right">
                      <ChangePill change={change ?? null} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
