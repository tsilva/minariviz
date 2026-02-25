"use client"

import type { EpisodeStats } from "@/lib/minari-data"

interface Props {
  stats: EpisodeStats
}

export function RewardSummaryChart({ stats }: Props) {
  const range = stats.rewardsMax - stats.rewardsMin
  const meanPos = range > 0 ? ((stats.rewardsMean - stats.rewardsMin) / range) * 100 : 50
  const stdLow = range > 0 ? Math.max(0, ((stats.rewardsMean - stats.rewardsStd - stats.rewardsMin) / range) * 100) : 25
  const stdHigh = range > 0 ? Math.min(100, ((stats.rewardsMean + stats.rewardsStd - stats.rewardsMin) / range) * 100) : 75

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
        Reward Statistics Summary
      </h4>

      <div className="space-y-5">
        {/* Box plot style visualization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <span>{stats.rewardsMin.toFixed(1)}</span>
            <span>{stats.rewardsMax.toFixed(1)}</span>
          </div>
          <div className="relative h-8 rounded-md bg-secondary/60 border border-border/50 overflow-hidden">
            {/* Std range */}
            <div
              className="absolute top-0 bottom-0 bg-primary/15"
              style={{ left: `${stdLow}%`, width: `${stdHigh - stdLow}%` }}
            />
            {/* Mean line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary"
              style={{ left: `${meanPos}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Mean</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 rounded-sm bg-primary/15 border border-primary/30" />
              <span>{"Mean +/- Std"}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-secondary/40 border border-border/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Mean Reward</p>
            <p className="text-lg font-bold font-mono text-foreground">{stats.rewardsMean.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-secondary/40 border border-border/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Std Dev</p>
            <p className="text-lg font-bold font-mono text-foreground">{stats.rewardsStd.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-secondary/40 border border-border/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Min Reward</p>
            <p className="text-lg font-bold font-mono text-chart-5">{stats.rewardsMin.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-secondary/40 border border-border/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Max Reward</p>
            <p className="text-lg font-bold font-mono text-chart-2">{stats.rewardsMax.toFixed(2)}</p>
          </div>
        </div>

        <div className="rounded-lg bg-secondary/40 border border-border/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Avg Episode Length</p>
          <p className="text-lg font-bold font-mono text-foreground">
            {stats.avgEpisodeLength} <span className="text-sm font-normal text-muted-foreground">steps</span>
          </p>
        </div>
      </div>
    </div>
  )
}
