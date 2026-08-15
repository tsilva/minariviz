"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface Props {
  data: { bin: string; count: number }[]
}

export function EpisodeLengthChart({ data }: Props) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
        Episode Length Distribution
      </h4>
      <div className="h-[220px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.22 0.01 260)"
              vertical={false}
            />
            <XAxis
              dataKey="bin"
              tick={{ fontSize: 10, fill: "oklch(0.6 0.01 260)" }}
              tickLine={false}
              axisLine={{ stroke: "oklch(0.22 0.01 260)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "oklch(0.6 0.01 260)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.14 0.008 260)",
                border: "1px solid oklch(0.22 0.01 260)",
                borderRadius: "6px",
                fontSize: "12px",
                color: "oklch(0.95 0 0)",
              }}
              labelFormatter={(v) => `Length: ${v}`}
              formatter={(value) => [value ?? 0, "Episodes"]}
            />
            <Bar
              dataKey="count"
              fill="oklch(0.7 0.18 160)"
              radius={[3, 3, 0, 0]}
              fillOpacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
