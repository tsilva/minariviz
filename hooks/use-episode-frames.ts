"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { fetchFrameBatch } from "@/lib/api"

const BATCH_SIZE = 120
const PREFETCH_THRESHOLD = 0.75

interface UseEpisodeFramesResult {
  frames: Map<number, string>
  totalFrames: number
  isLoading: boolean
  error: string | null
}

export function useEpisodeFrames(
  datasetId: string,
  episodeId: number | null,
  totalFrames: number,
  currentFrame: number,
): UseEpisodeFramesResult {
  const [frames, setFrames] = useState<Map<number, string>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadedRangesRef = useRef<Set<number>>(new Set())
  const abortRef = useRef<AbortController | null>(null)

  // Clean up object URLs when episode changes or unmount
  useEffect(() => {
    return () => {
      setFrames((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url))
        return new Map()
      })
      loadedRangesRef.current.clear()
    }
  }, [datasetId, episodeId])

  const loadBatch = useCallback(
    async (batchStart: number) => {
      if (episodeId === null) return
      const batchKey = Math.floor(batchStart / BATCH_SIZE)
      if (loadedRangesRef.current.has(batchKey)) return

      loadedRangesRef.current.add(batchKey)
      setIsLoading(true)
      setError(null)

      try {
        const start = batchKey * BATCH_SIZE
        const count = Math.min(BATCH_SIZE, totalFrames - start)
        if (count <= 0) return

        const blobs = await fetchFrameBatch(
          datasetId,
          episodeId,
          start,
          count,
        )

        setFrames((prev) => {
          const next = new Map(prev)
          blobs.forEach((blob, i) => {
            const idx = start + i
            if (!next.has(idx)) {
              next.set(idx, URL.createObjectURL(blob))
            }
          })
          return next
        })
      } catch (e) {
        loadedRangesRef.current.delete(batchKey)
        setError(e instanceof Error ? e.message : "Failed to load frames")
      } finally {
        setIsLoading(false)
      }
    },
    [datasetId, episodeId, totalFrames],
  )

  // Load initial batch
  useEffect(() => {
    if (episodeId === null || totalFrames === 0) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    loadBatch(0)
  }, [episodeId, totalFrames, loadBatch])

  // Prefetch next batch when playback reaches threshold
  useEffect(() => {
    if (episodeId === null || totalFrames === 0) return

    const currentBatch = Math.floor(currentFrame / BATCH_SIZE)
    const positionInBatch = currentFrame - currentBatch * BATCH_SIZE
    const threshold = BATCH_SIZE * PREFETCH_THRESHOLD

    if (positionInBatch >= threshold) {
      const nextBatchStart = (currentBatch + 1) * BATCH_SIZE
      if (nextBatchStart < totalFrames) {
        loadBatch(nextBatchStart)
      }
    }
  }, [currentFrame, episodeId, totalFrames, loadBatch])

  // Also load the batch containing the current frame (for scrubbing)
  useEffect(() => {
    if (episodeId === null || totalFrames === 0) return
    loadBatch(currentFrame)
  }, [currentFrame, episodeId, totalFrames, loadBatch])

  return { frames, totalFrames, isLoading, error }
}
