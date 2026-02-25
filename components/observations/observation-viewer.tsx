"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Terminal } from "lucide-react"
import { checkApiHealth, fetchEpisodes, fetchEpisodeInfo } from "@/lib/api"
import type { EpisodeListItem, EpisodeInfo } from "@/lib/api"
import { useEpisodeFrames } from "@/hooks/use-episode-frames"
import { FrameCanvas } from "./frame-canvas"
import { PlaybackControls } from "./playback-controls"
import { EpisodeSelector } from "./episode-selector"
import { TimelineScrubber } from "./timeline-scrubber"

interface ObservationViewerProps {
  datasetId: string
}

export function ObservationViewer({ datasetId }: ObservationViewerProps) {
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null)
  const [episodes, setEpisodes] = useState<EpisodeListItem[]>([])
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null)
  const [episodeInfo, setEpisodeInfo] = useState<EpisodeInfo | null>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [loadError, setLoadError] = useState<string | null>(null)

  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const totalFrames = episodeInfo?.length ?? 0

  const { frames, isLoading, error: frameError } = useEpisodeFrames(
    datasetId,
    selectedEpisode,
    totalFrames,
    currentFrame,
  )

  // Check API availability on mount
  useEffect(() => {
    checkApiHealth().then(setApiAvailable)
  }, [])

  // Load episodes when API is available
  useEffect(() => {
    if (!apiAvailable) return
    setLoadError(null)
    fetchEpisodes(datasetId)
      .then(setEpisodes)
      .catch((e) => setLoadError(e.message))
  }, [apiAvailable, datasetId])

  // Load episode info when selected
  useEffect(() => {
    if (selectedEpisode === null) return
    setCurrentFrame(0)
    setIsPlaying(false)
    setEpisodeInfo(null)
    fetchEpisodeInfo(datasetId, selectedEpisode)
      .then(setEpisodeInfo)
      .catch((e) => setLoadError(e.message))
  }, [datasetId, selectedEpisode])

  // Playback loop
  useEffect(() => {
    if (!isPlaying || totalFrames === 0) return

    const targetInterval = 1000 / (15 * speed)

    function tick(time: number) {
      if (time - lastTimeRef.current >= targetInterval) {
        lastTimeRef.current = time
        setCurrentFrame((prev) => {
          if (prev >= totalFrames - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    lastTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, speed, totalFrames])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (selectedEpisode === null || totalFrames === 0) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.code) {
        case "Space":
          e.preventDefault()
          setIsPlaying((prev) => !prev)
          break
        case "ArrowRight":
          e.preventDefault()
          setIsPlaying(false)
          setCurrentFrame((prev) => Math.min(prev + 1, totalFrames - 1))
          break
        case "ArrowLeft":
          e.preventDefault()
          setIsPlaying(false)
          setCurrentFrame((prev) => Math.max(prev - 1, 0))
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedEpisode, totalFrames])

  const handlePlayPause = useCallback(() => setIsPlaying((p) => !p), [])
  const handleStepForward = useCallback(() => {
    setIsPlaying(false)
    setCurrentFrame((prev) => Math.min(prev + 1, totalFrames - 1))
  }, [totalFrames])
  const handleStepBackward = useCallback(() => {
    setIsPlaying(false)
    setCurrentFrame((prev) => Math.max(prev - 1, 0))
  }, [])
  const handleGoToStart = useCallback(() => {
    setIsPlaying(false)
    setCurrentFrame(0)
  }, [])
  const handleGoToEnd = useCallback(() => {
    setIsPlaying(false)
    setCurrentFrame(Math.max(0, totalFrames - 1))
  }, [totalFrames])
  const handleScrub = useCallback((frame: number) => {
    setIsPlaying(false)
    setCurrentFrame(frame)
  }, [])

  // API unavailable state
  if (apiAvailable === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Checking API availability...</p>
      </div>
    )
  }

  if (!apiAvailable) {
    return (
      <Card className="p-6 border-border/50 bg-card">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-secondary/50 p-3">
            <Terminal className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              API Server Required
            </h3>
            <p className="text-xs text-muted-foreground mb-3 max-w-xs">
              The observation viewer requires the Python API server to load and
              serve episode frames.
            </p>
          </div>
          <div className="rounded-lg bg-secondary/60 border border-border/50 p-3 font-mono text-xs text-foreground/80 w-full text-left">
            <pre className="whitespace-pre">
              {`cd api\npip install -r requirements.txt\nuvicorn main:app --reload`}
            </pre>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <EpisodeSelector
        episodes={episodes}
        selectedEpisode={selectedEpisode}
        onSelect={setSelectedEpisode}
      />

      {loadError && (
        <p className="text-xs text-destructive">{loadError}</p>
      )}

      {selectedEpisode !== null && episodeInfo && (
        <>
          <FrameCanvas frameUrl={frames.get(currentFrame)} />

          {frameError && (
            <p className="text-xs text-destructive">{frameError}</p>
          )}

          <TimelineScrubber
            currentFrame={currentFrame}
            totalFrames={totalFrames}
            onScrub={handleScrub}
          />

          <PlaybackControls
            isPlaying={isPlaying}
            currentFrame={currentFrame}
            totalFrames={totalFrames}
            speed={speed}
            onPlayPause={handlePlayPause}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onGoToStart={handleGoToStart}
            onGoToEnd={handleGoToEnd}
            onSpeedChange={setSpeed}
          />

          {isLoading && (
            <p className="text-xs text-muted-foreground text-center">
              Loading frames...
            </p>
          )}

          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span>
              Reward: {episodeInfo.total_reward.toFixed(1)}
            </span>
            <span>
              Shape: {episodeInfo.observation_shape.join("x")}
            </span>
          </div>
        </>
      )}

      {selectedEpisode !== null && !episodeInfo && !loadError && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Loading episode...</p>
        </div>
      )}
    </div>
  )
}
