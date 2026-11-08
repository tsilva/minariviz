"use client"

import { formatNumber } from "@/lib/minari-data"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface NamespacePlotsProps {
  data: { name: string; datasets: number; episodes: number }[]
  colors: string[]
}

export function NamespacePlots({ data, colors }: NamespacePlotsProps) {
  const pieData = data.map(({ name, datasets }) => ({ name, value: datasets }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pie */}
      <div className="h-[250px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              stroke="oklch(0.098 0.005 260)"
              strokeWidth={2}
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.85}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.14 0.008 260)",
                border: "1px solid oklch(0.22 0.01 260)",
                borderRadius: "6px",
                fontSize: "12px",
                color: "oklch(0.95 0 0)",
              }}
              formatter={(value) => [`${value ?? 0} datasets`, ""]}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
              formatter={(value) => (
                <span style={{ color: "oklch(0.6 0.01 260)" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar */}
      <div className="h-[250px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.22 0.01 260)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "oklch(0.6 0.01 260)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatNumber(v)}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 10, fill: "oklch(0.6 0.01 260)" }}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.14 0.008 260)",
                border: "1px solid oklch(0.22 0.01 260)",
                borderRadius: "6px",
                fontSize: "12px",
                color: "oklch(0.95 0 0)",
              }}
              formatter={(value) => [
                formatNumber(typeof value === "number" ? value : 0),
                "Total Episodes",
              ]}
            />
            <Bar
              dataKey="episodes"
              fill="oklch(0.72 0.15 195)"
              radius={[0, 4, 4, 0]}
              fillOpacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
