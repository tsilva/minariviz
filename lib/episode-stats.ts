import type { EpisodeStats, EpisodeSummary } from "./minari-data"

// Illustrative catalog data, not measurements from downloaded episodes.
// Keep generated examples deterministic across server and browser rendering.
function generateRewardDistribution(mean: number, std: number, min: number, max: number): { bin: string; count: number }[] {
  const bins = 12
  const range = max - min
  const binWidth = range / bins
  return Array.from({ length: bins }, (_, i) => {
    const binStart = min + i * binWidth
    const binCenter = binStart + binWidth / 2
    const z = (binCenter - mean) / (std || 1)
    const density = Math.exp(-0.5 * z * z)
    return {
      bin: binStart.toFixed(1),
      count: Math.max(1, Math.round(density * 100)),
    }
  })
}

function generateEpisodeLengthDistribution(avgLen: number): { bin: string; count: number }[] {
  const bins = 10
  const minLen = Math.max(1, Math.round(avgLen * 0.2))
  const maxLen = Math.round(avgLen * 2.2)
  const binWidth = (maxLen - minLen) / bins
  return Array.from({ length: bins }, (_, i) => {
    const binStart = minLen + i * binWidth
    const binCenter = binStart + binWidth / 2
    const z = (binCenter - avgLen) / (avgLen * 0.35)
    const density = Math.exp(-0.5 * z * z)
    return {
      bin: Math.round(binStart).toString(),
      count: Math.max(1, Math.round(density * 80)),
    }
  })
}

function generateCumulativeRewards(numEpisodes: number, mean: number, std: number): { episode: number; reward: number }[] {
  const sampleSize = Math.min(numEpisodes, 50)
  const step = Math.max(1, Math.floor(numEpisodes / sampleSize))
  return Array.from({ length: sampleSize }, (_, i) => ({
    episode: i * step,
    reward: parseFloat((mean + Math.sin(i * 1.7) * std).toFixed(2)),
  }))
}

export function buildEpisodeStats(summary: EpisodeSummary, episodes: number): EpisodeStats {
  const { rewardsMean, rewardsStd, rewardsMin, rewardsMax, avgEpisodeLength } = summary
  return {
    ...summary,
    rewardDistribution: generateRewardDistribution(rewardsMean, rewardsStd, rewardsMin, rewardsMax),
    episodeLengthDistribution: generateEpisodeLengthDistribution(avgEpisodeLength),
    cumulativeRewards: generateCumulativeRewards(episodes, rewardsMean, rewardsStd),
  }
}
