"use client"

import { Slider } from "@/components/ui/slider"

interface TimelineScrubberProps {
  currentFrame: number
  totalFrames: number
  onScrub: (frame: number) => void
}

export function TimelineScrubber({
  currentFrame,
  totalFrames,
  onScrub,
}: TimelineScrubberProps) {
  if (totalFrames <= 1) return null

  return (
    <Slider
      value={[currentFrame]}
      min={0}
      max={totalFrames - 1}
      step={1}
      onValueChange={([value]) => onScrub(value)}
      className="w-full"
    />
  )
}
