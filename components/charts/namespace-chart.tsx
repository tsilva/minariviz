import { NamespacePlots } from "./namespace-plots"
import { MINARI_DATASETS, NAMESPACES, formatNumber } from "@/lib/minari-data"

const COLORS = [
  "oklch(0.72 0.15 195)",
  "oklch(0.7 0.18 160)",
  "oklch(0.75 0.15 80)",
  "oklch(0.65 0.2 330)",
  "oklch(0.7 0.16 40)",
  "oklch(0.6 0.14 270)",
]

export function NamespaceChart() {
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

      <NamespacePlots data={namespaceData} colors={COLORS} />

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
