import { MinariVisualizer } from "@/components/minari-visualizer"
import { OverviewStats } from "@/components/overview-stats"
import { NamespaceChart } from "@/components/charts/namespace-chart"

export default function Page() {
  return <MinariVisualizer overview={<OverviewStats />} namespaceChart={<NamespaceChart />} />
}
