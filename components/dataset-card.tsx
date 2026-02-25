"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { MinariDataset } from "@/lib/minari-data"
import { formatNumber } from "@/lib/minari-data"
import { Database, Layers, ArrowRight } from "lucide-react"

interface DatasetCardProps {
  dataset: MinariDataset
  isSelected: boolean
  onClick: () => void
}

const namespaceColors: Record<string, string> = {
  D4RL: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  MiniGrid: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  Atari: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  MuJoCo: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  MetaWorld: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  WebAgents: "bg-primary/15 text-primary border-primary/30",
}

export function DatasetCard({ dataset, isSelected, onClick }: DatasetCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`group cursor-pointer p-4 transition-all duration-200 border ${
        isSelected
          ? "border-primary/60 bg-primary/5 shadow-[0_0_20px_-5px] shadow-primary/20"
          : "border-border hover:border-primary/30 bg-card hover:bg-card/80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className={`text-[10px] font-mono px-1.5 py-0 leading-5 border ${
                namespaceColors[dataset.namespace] || "bg-secondary text-secondary-foreground"
              }`}
            >
              {dataset.namespace}
            </Badge>
            <span className="text-[10px] font-mono text-muted-foreground">
              v{dataset.version}
            </span>
          </div>
          <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
            {dataset.envName}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            {dataset.datasetName}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Layers className="w-3 h-3 text-primary/70" />
          <span className="font-mono">{formatNumber(dataset.totalEpisodes)}</span>
          <span className="text-muted-foreground/60">eps</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Database className="w-3 h-3 text-primary/70" />
          <span className="font-mono">{formatNumber(dataset.totalSteps)}</span>
          <span className="text-muted-foreground/60">steps</span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1 text-[10px] text-muted-foreground/60">
        <span className="font-mono">
          {dataset.actionSpaceType}({dataset.actionSpaceDims})
        </span>
        <span>{"/"}</span>
        <span className="font-mono">
          {dataset.observationSpaceType}({dataset.observationSpaceDims})
        </span>
      </div>
    </Card>
  )
}
