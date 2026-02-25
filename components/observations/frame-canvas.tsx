"use client"

import { useEffect, useRef } from "react"

interface FrameCanvasProps {
  frameUrl: string | undefined
}

export function FrameCanvas({ frameUrl }: FrameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !frameUrl) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
    }
    img.src = frameUrl
  }, [frameUrl])

  return (
    <div className="flex items-center justify-center rounded-lg bg-black/90 border border-border/50 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-[336px] h-[336px]"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  )
}
