const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export interface EpisodeListItem {
  id: number
  length: number
}

export interface EpisodeInfo {
  id: number
  length: number
  total_reward: number
  observation_shape: number[]
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, {
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function fetchEpisodes(
  datasetId: string,
): Promise<EpisodeListItem[]> {
  const res = await fetch(`${BASE_URL}/api/datasets/${datasetId}/episodes`)
  if (!res.ok) throw new Error(`Failed to fetch episodes: ${res.statusText}`)
  return res.json()
}

export async function fetchEpisodeInfo(
  datasetId: string,
  episodeId: number,
): Promise<EpisodeInfo> {
  const res = await fetch(
    `${BASE_URL}/api/datasets/${datasetId}/episodes/${episodeId}/info`,
  )
  if (!res.ok)
    throw new Error(`Failed to fetch episode info: ${res.statusText}`)
  return res.json()
}

export async function fetchFrameBatch(
  datasetId: string,
  episodeId: number,
  start: number,
  count: number,
  quality: number = 75,
): Promise<Blob[]> {
  const params = new URLSearchParams({
    start: String(start),
    count: String(count),
    quality: String(quality),
  })
  const res = await fetch(
    `${BASE_URL}/api/datasets/${datasetId}/episodes/${episodeId}/frames?${params}`,
  )
  if (!res.ok) throw new Error(`Failed to fetch frames: ${res.statusText}`)

  const buffer = await res.arrayBuffer()
  return decodeBatchedFrames(buffer)
}

function decodeBatchedFrames(buffer: ArrayBuffer): Blob[] {
  const view = new DataView(buffer)
  const blobs: Blob[] = []
  let offset = 0

  while (offset < buffer.byteLength) {
    const length = view.getUint32(offset, true)
    offset += 4
    const jpegData = new Uint8Array(buffer, offset, length)
    blobs.push(new Blob([jpegData], { type: "image/jpeg" }))
    offset += length
  }

  return blobs
}
