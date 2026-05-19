"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

export function PriceSparkline({
  data,
  color = "var(--accent)",
  height = 32,
}: {
  data: { date: string; avg_modal: number }[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) return null;
  return (
    <div style={{ height, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="avg_modal" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
