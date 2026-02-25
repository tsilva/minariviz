"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { DatasetCard } from "@/components/dataset-card"
import { DatasetDetail } from "@/components/dataset-detail"
import { OverviewStats } from "@/components/overview-stats"
import { NamespaceChart } from "@/components/charts/namespace-chart"
import { MINARI_DATASETS, NAMESPACES } from "@/lib/minari-data"
import type { MinariDataset } from "@/lib/minari-data"
import { Search, X, SlidersHorizontal, ExternalLink } from "lucide-react"

export default function MinariVisualizer() {
  const [search, setSearch] = useState("")
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([])
  const [selectedDataset, setSelectedDataset] = useState<MinariDataset | null>(null)
  const [showFilters, setShowFilters] = useState(true)

  const filteredDatasets = useMemo(() => {
    return MINARI_DATASETS.filter((d) => {
      const matchesSearch =
        search === "" ||
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.envName.toLowerCase().includes(search.toLowerCase()) ||
        d.datasetName.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase()) ||
        d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))

      const matchesNamespace =
        selectedNamespaces.length === 0 ||
        selectedNamespaces.includes(d.namespace)

      return matchesSearch && matchesNamespace
    })
  }, [search, selectedNamespaces])

  function toggleNamespace(ns: string) {
    setSelectedNamespaces((prev) =>
      prev.includes(ns) ? prev.filter((n) => n !== ns) : [...prev, ns]
    )
  }

  function clearFilters() {
    setSearch("")
    setSelectedNamespaces([])
  }

  const hasFilters = search !== "" || selectedNamespaces.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-foreground">
                  Minari Explorer
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  Offline RL Dataset Visualizer
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono hidden sm:flex">
              {MINARI_DATASETS.length} datasets
            </Badge>
            <Button variant="outline" size="sm" className="text-xs h-8" asChild>
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
      </header>

      <main className="mx-auto max-w-[1600px] px-4 md:px-6 py-6">
        {/* Overview Stats */}
        <OverviewStats />

        <div className="mt-6 flex flex-col lg:flex-row gap-6">
          {/* Left Panel: Catalog */}
          <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0 space-y-4">
            {/* Search & Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search datasets, environments, tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-card border-border/50 text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-muted-foreground"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="w-3 h-3 mr-1.5" />
                  Filters
                </Button>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-muted-foreground"
                    onClick={clearFilters}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {showFilters && (
                <div className="flex flex-wrap gap-1.5">
                  {NAMESPACES.map((ns) => (
                    <Badge
                      key={ns}
                      variant={selectedNamespaces.includes(ns) ? "default" : "outline"}
                      className={`cursor-pointer text-[11px] transition-all ${
                        selectedNamespaces.includes(ns)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => toggleNamespace(ns)}
                    >
                      {ns}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator className="bg-border/30" />

            {/* Results count */}
            <p className="text-xs text-muted-foreground">
              {filteredDatasets.length} dataset{filteredDatasets.length !== 1 ? "s" : ""}
              {hasFilters ? " matching filters" : ""}
            </p>

            {/* Dataset List */}
            <ScrollArea className="h-[calc(100vh-380px)] pr-3">
              <div className="space-y-2 pb-4">
                {filteredDatasets.map((dataset) => (
                  <DatasetCard
                    key={dataset.id}
                    dataset={dataset}
                    isSelected={selectedDataset?.id === dataset.id}
                    onClick={() => setSelectedDataset(dataset)}
                  />
                ))}
                {filteredDatasets.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">
                      No datasets match your filters
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={clearFilters}
                    >
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Detail */}
          <div className="flex-1 min-w-0">
            {selectedDataset ? (
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <DatasetDetail dataset={selectedDataset} />
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <div className="text-center py-8 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-8 h-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    Minari Dataset Explorer
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
                    Browse and visualize offline reinforcement learning datasets from the
                    Farama Foundation. Select a dataset from the catalog to explore its
                    metadata, episode statistics, and reward distributions.
                  </p>
                </div>

                <Separator className="bg-border/30 mb-6" />

                {/* Namespace overview chart */}
                <NamespaceChart />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
