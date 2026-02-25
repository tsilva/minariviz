"use client"

import type { ObservationFrame } from "@/lib/minari-data"
import { useCallback, useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"

interface Props {
  frames: ObservationFrame[]
  envName: string
}

function renderFrame(
  canvas: HTMLCanvasElement,
  frame: ObservationFrame,
  scale: number
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const { width, height, pixels } = frame
  canvas.width = width * scale
  canvas.height = height * scale
  ctx.imageSmoothingEnabled = false

  const imageData = ctx.createImageData(width, height)
  for (let y = 0; y < height; y++) {
    const row = pixels[y]
    if (!row) continue
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      imageData.data[idx] = row[x * 3] ?? 0
      imageData.data[idx + 1] = row[x * 3 + 1] ?? 0
      imageData.data[idx + 2] = row[x * 3 + 2] ?? 0
      imageData.data[idx + 3] = 255
    }
  }

  const offscreen = document.createElement("canvas")
  offscreen.width = width
  offscreen.height = height
  const offCtx = offscreen.getContext("2d")!
  offCtx.putImageData(imageData, 0, 0)

  ctx.drawImage(offscreen, 0, 0, width * scale, height * scale)
}

function FrameCanvas({
  frame,
  scale,
  className,
}: {
  frame: ObservationFrame
  scale: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      renderFrame(canvasRef.current, frame, scale)
    }
  }, [frame, scale])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  )
}

export function ObservationPreview({ frames, envName }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selected = frames[selectedIdx]

  const goNext = useCallback(() => {
    setSelectedIdx((i) => (i + 1) % frames.length)
  }, [frames.length])

  const goPrev = useCallback(() => {
    setSelectedIdx((i) => (i - 1 + frames.length) % frames.length)
  }, [frames.length])

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(goNext, 350)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [playing, goNext])

  if (!selected) return null

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
        Observation Frames - {envName}
      </h4>

      {/* Main preview */}
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-3 inline-flex flex-col items-center gap-2">
          <FrameCanvas
            frame={selected}
            scale={3}
            className="rounded-sm"
          />
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={goPrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={goNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="secondary" className="font-mono text-[10px]">
            step {selected.step}
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            ep {selected.episode}
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {selected.width}x{selected.height} RGB
          </Badge>
          <span className="text-muted-foreground">
            {selectedIdx + 1}/{frames.length}
          </span>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1">
        {frames.map((frame, i) => (
          <button
            key={i}
            onClick={() => {
              setSelectedIdx(i)
              setPlaying(false)
            }}
            className={`flex-shrink-0 rounded-sm border-2 transition-colors cursor-pointer ${
              i === selectedIdx
                ? "border-primary"
                : "border-transparent hover:border-border"
            }`}
          >
            <FrameCanvas frame={frame} scale={1} className="rounded-sm" />
          </button>
        ))}
      </div>
    </div>
  )
}
