import Link from "next/link";
import { inr } from "@/lib/format";
import { slugify } from "@/lib/constants";
import type { PriceRow } from "@/lib/db";
import { ChangePill } from "./change-pill";

export function MandiTable({
  rows,
  showCommodity = false,
  changes,
}: {
  rows: PriceRow[];
  showCommodity?: boolean;
  changes?: Map<string, number>;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-line bg-card p-6 text-sm text-ink-muted">
        No mandi rows for this view.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-line bg-secondary text-left text-xs uppercase tracking-wider text-ink-muted">
          <tr>
            <th className="px-3 py-2">{showCommodity ? "Commodity" : "Mandi"}</th>
            <th className="px-3 py-2">{showCommodity ? "Variety" : "District / State"}</th>
            <th className="num px-3 py-2 text-right">Min</th>
            <th className="num px-3 py-2 text-right">Modal</th>
            <th className="num px-3 py-2 text-right">Max</th>
            {changes && <th className="px-3 py-2 text-right">Δ</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const key = showCommodity
              ? `${r.commodity}-${r.variety ?? ""}-${r.id}`
              : `${r.market}-${r.id}`;
            const change = changes?.get(showCommodity ? r.commodity : r.market);
            return (
              <tr
                key={key}
                className={i % 2 ? "bg-background" : "bg-card"}
              >
                <td className="px-3 py-2">
                  {showCommodity ? (
                    <Link
                      href={`/c/${slugify(r.commodity)}`}
                      className="font-medium text-ink hover:text-accent"
                    >
                      {r.commodity}
                    </Link>
                  ) : (
                    <Link
                      href={`/m/${slugify(r.market)}`}
                      className="font-medium text-ink hover:text-accent"
                    >
                      {r.market}
                    </Link>
                  )}
                </td>
                <td className="px-3 py-2 text-ink-soft">
                  {showCommodity ? (
                    <span>{r.variety ?? "—"}{r.grade ? ` · ${r.grade}` : ""}</span>
                  ) : (
                    <span>
                      {r.district}
                      <span className="mx-1 text-ink-muted">·</span>
                      <Link href={`/s/${slugify(r.state)}`} className="hover:text-ink">
                        {r.state}
                      </Link>
                    </span>
                  )}
                </td>
                <td className="num px-3 py-2 text-right text-ink-soft">{inr(r.min_price)}</td>
                <td className="num px-3 py-2 text-right font-medium text-ink">{inr(r.modal_price)}</td>
                <td className="num px-3 py-2 text-right text-ink-soft">{inr(r.max_price)}</td>
                {changes && (
                  <td className="px-3 py-2 text-right">
                    <ChangePill change={change ?? null} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
