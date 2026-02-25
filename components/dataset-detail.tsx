"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { MinariDataset } from "@/lib/minari-data"
import { formatNumber } from "@/lib/minari-data"
import {
  Database,
  Layers,
  ArrowDownToLine,
  User,
  Code,
  Cpu,
  Eye,
  Joystick,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { RewardDistributionChart } from "./charts/reward-distribution"
import { EpisodeLengthChart } from "./charts/episode-length"
import { CumulativeRewardsChart } from "./charts/cumulative-rewards"
import { RewardSummaryChart } from "./charts/reward-summary"
import { useState } from "react"

interface DatasetDetailProps {
  dataset: MinariDataset
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  sub?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3 border border-border/50">
      <div className="rounded-md bg-primary/10 p-2">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </p>
        <p className="text-lg font-semibold font-mono text-foreground leading-tight mt-0.5">
          {value}
        </p>
        {sub && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  )
}

export function DatasetDetail({ dataset }: DatasetDetailProps) {
  const [copied, setCopied] = useState(false)

  const installCmd = `import minari\ndataset = minari.load_dataset("${dataset.id}", download=True)`

  function handleCopy() {
    navigator.clipboard.writeText(installCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant="outline"
            className="text-xs font-mono border-primary/30 text-primary bg-primary/10"
          >
            {dataset.namespace}
          </Badge>
          <Badge variant="outline" className="text-xs font-mono">
            v{dataset.version}
          </Badge>
          <Badge variant="outline" className="text-xs font-mono">
            Minari {dataset.minariVersion}
          </Badge>
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          {dataset.envName}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {dataset.datasetName} dataset
        </p>
        <p className="text-sm text-muted-foreground/80 mt-2 leading-relaxed">
          {dataset.description}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-2">
        <div className="relative rounded-lg bg-secondary/60 border border-border/50 p-3 font-mono text-xs text-foreground/80 overflow-x-auto">
          <pre className="whitespace-pre">{installCmd}</pre>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-chart-2" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs" asChild>
            <a
              href={`https://huggingface.co/datasets/farama-minari/${dataset.namespace}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-3 h-3 mr-1.5" />
              HuggingFace
            </a>
          </Button>
          <Button variant="outline" size="sm" className="text-xs" asChild>
            <a
              href="https://minari.farama.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-3 h-3 mr-1.5" />
              Docs
            </a>
          </Button>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Episodes"
          value={formatNumber(dataset.totalEpisodes)}
          icon={Layers}
          sub={`Avg ${dataset.episodeStats.avgEpisodeLength} steps/ep`}
        />
        <StatCard
          label="Total Steps"
          value={formatNumber(dataset.totalSteps)}
          icon={Database}
        />
        <StatCard
          label="Downloads"
          value={formatNumber(dataset.downloads)}
          icon={ArrowDownToLine}
        />
        <StatCard
          label="Algorithm"
          value={dataset.algorithmName}
          icon={Cpu}
        />
      </div>

      {/* Spaces */}
      <Card className="p-4 border-border/50 bg-card">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Spaces
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Joystick className="w-4 h-4 text-chart-1" />
              <span className="text-sm text-foreground">Action Space</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {dataset.actionSpaceType}
              </Badge>
              {dataset.actionSpaceDims > 0 && (
                <span className="text-xs font-mono text-muted-foreground">
                  dim={dataset.actionSpaceDims}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-chart-2" />
              <span className="text-sm text-foreground">Observation Space</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {dataset.observationSpaceType}
              </Badge>
              {dataset.observationSpaceDims > 0 && (
                <span className="text-xs font-mono text-muted-foreground">
                  dim={dataset.observationSpaceDims}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {dataset.author}
        </div>
        <div className="flex items-center gap-1">
          <Code className="w-3 h-3" />
          {dataset.algorithmName}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {dataset.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[10px] font-mono">
            {tag}
          </Badge>
        ))}
      </div>

      <Separator className="bg-border/50" />

      {/* Charts */}
      <Tabs defaultValue="rewards" className="w-full">
        <TabsList className="w-full bg-secondary/60 p-1">
          <TabsTrigger value="rewards" className="text-xs flex-1">
            Reward Dist.
          </TabsTrigger>
          <TabsTrigger value="lengths" className="text-xs flex-1">
            Ep. Lengths
          </TabsTrigger>
          <TabsTrigger value="cumulative" className="text-xs flex-1">
            Cumulative
          </TabsTrigger>
          <TabsTrigger value="summary" className="text-xs flex-1">
            Summary
          </TabsTrigger>
        </TabsList>
        <TabsContent value="rewards" className="mt-4">
          <RewardDistributionChart data={dataset.episodeStats.rewardDistribution} />
        </TabsContent>
        <TabsContent value="lengths" className="mt-4">
          <EpisodeLengthChart data={dataset.episodeStats.episodeLengthDistribution} />
        </TabsContent>
        <TabsContent value="cumulative" className="mt-4">
          <CumulativeRewardsChart data={dataset.episodeStats.cumulativeRewards} />
        </TabsContent>
        <TabsContent value="summary" className="mt-4">
          <RewardSummaryChart stats={dataset.episodeStats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
