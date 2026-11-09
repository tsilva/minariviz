import { formatNumber } from "@/lib/minari-data"

interface NamespacePlotsProps {
  data: { name: string; datasets: number; episodes: number }[]
  colors: string[]
}

export function NamespacePlots({ data, colors }: NamespacePlotsProps) {
  const namespaces = data.map((namespace, index) => ({
    ...namespace,
    color: colors[index % colors.length],
  }))
  const legend = [...namespaces].sort((a, b) => a.name.localeCompare(b.name, "en"))
  const populated = namespaces.filter((namespace) => namespace.datasets > 0)
  const total = populated.reduce((sum, namespace) => sum + namespace.datasets, 0)
  const gap = 3
  const availableAngle = 360 - populated.length * gap
  const segments: (typeof populated[number] & { start: number; sweep: number })[] = []
  let angle = gap / 2
  for (const namespace of populated) {
    const sweep = (namespace.datasets / total) * availableAngle
    segments.push({ ...namespace, start: angle, sweep })
    angle += sweep + gap
  }

  const maxEpisodes = Math.max(1, ...namespaces.map((namespace) => namespace.episodes))
  const ticks = [0, 25, 50, 75, 100]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <figure aria-label="Dataset counts by namespace" className="flex h-[250px] min-w-0 flex-col">
        <div className="grid flex-1 place-items-center">
          <svg role="img" aria-label="Dataset counts by namespace" viewBox="0 0 164 164" width="164" height="164">
            <g transform="translate(0 164) scale(1 -1)">
              {segments.map(({ name, datasets, color, start, sweep }) => (
                <circle
                  key={name}
                  cx={82}
                  cy={82}
                  r={65}
                  pathLength={360}
                  fill="none"
                  stroke={color}
                  strokeOpacity={0.85}
                  strokeWidth={30}
                  strokeDasharray={`${sweep} ${360 - sweep}`}
                  transform={`rotate(${start} 82 82)`}
                >
                  <title>{name}: {datasets} dataset{datasets === 1 ? "" : "s"}</title>
                </circle>
              ))}
            </g>
          </svg>
        </div>
        <ul aria-label="Namespace colors" className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 pb-1 text-[11px] text-muted-foreground">
          {legend.map(({ name, color }) => (
            <li key={name} className="flex items-center gap-1">
              <span aria-hidden="true" className="h-2.5 w-3.5" style={{ backgroundColor: color }} />
              {name}
            </li>
          ))}
        </ul>
      </figure>

      <figure aria-label="Total episodes by namespace" className="h-[250px] min-w-0 pr-2.5">
        <div className="relative h-[220px]">
          <div aria-hidden="true" className="absolute inset-y-0 right-0 left-20 flex justify-between">
            {ticks.map((tick) => (
              <span key={tick} className="h-full border-l border-dashed border-border" />
            ))}
          </div>
          <div className="relative grid h-full" style={{ gridTemplateRows: `repeat(${namespaces.length}, minmax(0, 1fr))` }}>
            {namespaces.map(({ name, episodes }) => (
              <div
                key={name}
                className="grid grid-cols-[80px_minmax(0,1fr)] items-center"
                title={`${name}: ${formatNumber(episodes)} total episodes`}
              >
                <span className="pr-2 text-right text-[10px] text-muted-foreground">{name}</span>
                <span
                  aria-hidden="true"
                  className="h-4/5 rounded-r-sm bg-primary/80"
                  style={{ width: `${episodes / maxEpisodes * 100}%` }}
                />
                <span className="sr-only">{formatNumber(episodes)} total episodes</span>
              </div>
            ))}
          </div>
        </div>
        <div aria-hidden="true" className="relative ml-20 h-[30px] text-[10px] text-muted-foreground">
          {ticks.map((tick) => (
            <span key={tick} className="absolute top-1 -translate-x-1/2" style={{ left: `${tick}%` }}>
              {formatNumber(maxEpisodes * tick / 100)}
            </span>
          ))}
        </div>
      </figure>
    </div>
  )
}
