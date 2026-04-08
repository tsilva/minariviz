"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface Props {
  data: { episode: number; reward: number }[]
}

export function CumulativeRewardsChart({ data }: Props) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
        Episode Rewards Over Time
      </h4>
      <div className="h-[220px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="rewardGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.72 0.15 195)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.72 0.15 195)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.22 0.01 260)"
              vertical={false}
            />
            <XAxis
              dataKey="episode"
              tick={{ fontSize: 10, fill: "oklch(0.6 0.01 260)" }}
              tickLine={false}
              axisLine={{ stroke: "oklch(0.22 0.01 260)" }}
              label={{
                value: "Episode",
                position: "insideBottomRight",
                offset: -5,
                style: { fontSize: 10, fill: "oklch(0.6 0.01 260)" },
              }}
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
              labelFormatter={(v) => `Episode ${v}`}
              formatter={(value: number) => [value.toFixed(2), "Reward"]}
            />
            <Area
              type="monotone"
              dataKey="reward"
              stroke="oklch(0.72 0.15 195)"
              strokeWidth={1.5}
              fill="url(#rewardGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
