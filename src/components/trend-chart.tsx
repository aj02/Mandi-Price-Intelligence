"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
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
      <div className="rounded-xl border border-line bg-card p-8 text-center text-sm text-ink-muted">
        Not enough history yet for a trend.
      </div>
    );
  }
  return (
    <div className="h-72 w-full rounded-xl border border-line bg-card p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 18, left: 6, bottom: 0 }}>
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
            tickFormatter={(v) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v)}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [inr(Number(value)), "Modal price"]}
            labelFormatter={(label) => fmtDate(label)}
          />
          <Line
            type="monotone"
            dataKey="avg_modal"
            stroke="var(--ink)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "var(--accent)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
