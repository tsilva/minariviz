// Next.js proxies these requests to the configured Python API. Keeping requests
// on the page's origin also supports previews and development with auto ports.
const BASE_URL = ""

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

export async function checkApiHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, {
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(60_000)])
        : AbortSignal.timeout(60_000),
      cache: "no-store",
    })
    return res.ok && (await res.json()).status === "ok"
  } catch {
    return false
  }
}

export async function fetchEpisodes(
  datasetId: string,
  signal?: AbortSignal,
): Promise<EpisodeListItem[]> {
  const res = await fetch(`${BASE_URL}/api/datasets/${datasetId}/episodes`, { signal })
  if (!res.ok) throw new Error(`Failed to fetch episodes: ${res.statusText}`)
  return res.json()
}

export async function fetchEpisodeInfo(
  datasetId: string,
  episodeId: number,
  signal?: AbortSignal,
): Promise<EpisodeInfo> {
  const res = await fetch(
    `${BASE_URL}/api/datasets/${datasetId}/episodes/${episodeId}/info`,
    { signal },
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
