"use client"

import { MINARI_DATASETS, formatNumber } from "@/lib/minari-data"
import { Database, Layers, FolderOpen, ArrowDownToLine } from "lucide-react"

const stats = [
  {
    label: "Datasets",
    value: MINARI_DATASETS.length,
    icon: FolderOpen,
  },
  {
    label: "Total Episodes",
    value: MINARI_DATASETS.reduce((s, d) => s + d.totalEpisodes, 0),
    icon: Layers,
  },
  {
    label: "Total Steps",
    value: MINARI_DATASETS.reduce((s, d) => s + d.totalSteps, 0),
    icon: Database,
  },
  {
    label: "Total Downloads",
    value: MINARI_DATASETS.reduce((s, d) => s + d.downloads, 0),
    icon: ArrowDownToLine,
  },
]

export function OverviewStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3"
        >
          <div className="rounded-md bg-primary/10 p-2">
            <s.icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {s.label}
            </p>
            <p className="text-base font-bold font-mono text-foreground">
              {formatNumber(s.value)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
