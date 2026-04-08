"use client"

import { useEffect, useState } from "react"
import { MINARI_DATASETS, NAMESPACES, formatNumber } from "@/lib/minari-data"
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

const COLORS = [
  "oklch(0.72 0.15 195)",
  "oklch(0.7 0.18 160)",
  "oklch(0.75 0.15 80)",
  "oklch(0.65 0.2 330)",
  "oklch(0.7 0.16 40)",
  "oklch(0.6 0.14 270)",
]

export function NamespaceChart() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const namespaceData = NAMESPACES.map((ns) => {
    const datasets = MINARI_DATASETS.filter((d) => d.namespace === ns)
    return {
      name: ns,
      datasets: datasets.length,
      episodes: datasets.reduce((s, d) => s + d.totalEpisodes, 0),
      steps: datasets.reduce((s, d) => s + d.totalSteps, 0),
      downloads: datasets.reduce((s, d) => s + d.downloads, 0),
    }
  })

  const pieData = namespaceData.map((d) => ({
    name: d.name,
    value: d.datasets,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Datasets by Namespace
        </h3>
        <p className="text-xs text-muted-foreground">
          Distribution of datasets across environment families
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie */}
        <div className="h-[250px] min-w-0">
          {isMounted ? (
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
                      fill={COLORS[index % COLORS.length]}
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
                  formatter={(value: number) => [`${value} datasets`, ""]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                  formatter={(value) => (
                    <span style={{ color: "oklch(0.6 0.01 260)" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-lg border border-border/50 bg-secondary/20" />
          )}
        </div>

        {/* Bar */}
        <div className="h-[250px] min-w-0">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
              <BarChart
                data={namespaceData}
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
                  formatter={(value: number) => [formatNumber(value), "Total Episodes"]}
                />
                <Bar
                  dataKey="episodes"
                  fill="oklch(0.72 0.15 195)"
                  radius={[0, 4, 4, 0]}
                  fillOpacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-lg border border-border/50 bg-secondary/20" />
          )}
        </div>
      </div>

      {/* Namespace summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {namespaceData.map((ns, i) => (
          <div
            key={ns.name}
            className="rounded-lg border border-border/50 bg-secondary/30 p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-xs font-semibold text-foreground">{ns.name}</span>
            </div>
            <div className="space-y-1 text-[10px] text-muted-foreground font-mono">
              <div className="flex justify-between">
                <span>Datasets</span>
                <span className="text-foreground">{ns.datasets}</span>
              </div>
              <div className="flex justify-between">
                <span>Episodes</span>
                <span className="text-foreground">{formatNumber(ns.episodes)}</span>
              </div>
              <div className="flex justify-between">
                <span>Steps</span>
                <span className="text-foreground">{formatNumber(ns.steps)}</span>
              </div>
              <div className="flex justify-between">
                <span>Downloads</span>
                <span className="text-foreground">{formatNumber(ns.downloads)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
