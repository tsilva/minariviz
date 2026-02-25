"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { EpisodeListItem } from "@/lib/api"

interface EpisodeSelectorProps {
  episodes: EpisodeListItem[]
  selectedEpisode: number | null
  onSelect: (episodeId: number) => void
}

export function EpisodeSelector({
  episodes,
  selectedEpisode,
  onSelect,
}: EpisodeSelectorProps) {
  return (
    <Select
      value={selectedEpisode !== null ? String(selectedEpisode) : undefined}
      onValueChange={(v) => onSelect(Number(v))}
    >
      <SelectTrigger size="sm" className="w-full h-8 text-xs">
        <SelectValue placeholder="Select an episode..." />
      </SelectTrigger>
      <SelectContent>
        {episodes.map((ep) => (
          <SelectItem key={ep.id} value={String(ep.id)} className="text-xs">
            Episode {ep.id} ({ep.length} frames)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
