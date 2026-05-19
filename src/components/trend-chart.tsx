"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { inr, fmtDate } from "@/lib/format";

type Point = { date: string; avg_modal: number; sample: number };

export function TrendChart({ data }: { data: Point[] }) {
  if (!data.length) {
    return (
      <div className="card-elev p-8 text-center text-sm text-ink-muted">
        No reporting in the last 30 days.
      </div>
    );
  }
  if (data.length === 1) {
    const only = data[0];
    return (
      <div className="card-elev p-6">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {fmtDate(only.date)} · {only.sample} mandis
        </div>
        <div className="num mt-2 text-3xl font-semibold text-ink">
          {inr(only.avg_modal)}
        </div>
        <p className="mt-3 max-w-md text-sm text-ink-soft">
          Only one day of data so far. The trend chart fills in as new daily
          snapshots accumulate (one per day, via the AGMARKNET cron).
        </p>
      </div>
    );
  }
  return (
    <div className="card-elev h-80 w-full p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 18, left: 6, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => fmtDate(d).replace(/\s\d{4}$/, "")}
            stroke="var(--ink-muted)"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="var(--ink-muted)"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={64}
            tickFormatter={(v) =>
              new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v)
            }
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              fontSize: 12,
              boxShadow: "0 4px 14px -4px rgba(0,0,0,0.08)",
            }}
            formatter={(value) => [inr(Number(value)), "Modal price"]}
            labelFormatter={(label) => fmtDate(label)}
          />
          <Area
            type="monotone"
            dataKey="avg_modal"
            stroke="var(--brand)"
            strokeWidth={2.2}
            fill="url(#trendFill)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--brand)", stroke: "var(--card)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
