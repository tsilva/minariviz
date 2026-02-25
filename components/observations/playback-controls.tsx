"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

interface PlaybackControlsProps {
  isPlaying: boolean
  currentFrame: number
  totalFrames: number
  speed: number
  onPlayPause: () => void
  onStepForward: () => void
  onStepBackward: () => void
  onGoToStart: () => void
  onGoToEnd: () => void
  onSpeedChange: (speed: number) => void
}

const SPEEDS = [
  { value: "0.5", label: "0.5x" },
  { value: "1", label: "1x" },
  { value: "2", label: "2x" },
  { value: "4", label: "4x" },
]

export function PlaybackControls({
  isPlaying,
  currentFrame,
  totalFrames,
  speed,
  onPlayPause,
  onStepForward,
  onStepBackward,
  onGoToStart,
  onGoToEnd,
  onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onGoToStart}>
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onStepBackward}>
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPlayPause}>
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onStepForward}>
          <SkipForward className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onGoToEnd}>
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>

      <span className="text-xs font-mono text-muted-foreground tabular-nums">
        Frame {currentFrame + 1} / {totalFrames}
      </span>

      <Select
        value={String(speed)}
        onValueChange={(v) => onSpeedChange(Number(v))}
      >
        <SelectTrigger size="sm" className="w-[72px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SPEEDS.map((s) => (
            <SelectItem key={s.value} value={s.value} className="text-xs">
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
