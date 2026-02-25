export interface ObservationFrame {
  step: number
  episode: number
  imageUrl: string
  width: number
  height: number
}

export interface MinariDataset {
  id: string
  namespace: string
  envName: string
  datasetName: string
  version: number
  totalEpisodes: number
  totalSteps: number
  actionSpaceType: string
  actionSpaceDims: number
  observationSpaceType: string
  observationSpaceDims: number
  algorithmName: string
  author: string
  minariVersion: string
  description: string
  tags: string[]
  episodeStats: EpisodeStats
  downloads: number
  createdAt: string
  observationFrames?: ObservationFrame[]
}

export interface EpisodeStats {
  rewardsMean: number
  rewardsStd: number
  rewardsMin: number
  rewardsMax: number
  avgEpisodeLength: number
  rewardDistribution: { bin: string; count: number }[]
  episodeLengthDistribution: { bin: string; count: number }[]
  cumulativeRewards: { episode: number; reward: number }[]
}

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
      count: Math.max(1, Math.round(density * 100 + Math.random() * 15)),
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
      count: Math.max(1, Math.round(density * 80 + Math.random() * 10)),
    }
  })
}

function generateCumulativeRewards(numEpisodes: number, mean: number, std: number): { episode: number; reward: number }[] {
  const sampleSize = Math.min(numEpisodes, 50)
  const step = Math.max(1, Math.floor(numEpisodes / sampleSize))
  return Array.from({ length: sampleSize }, (_, i) => ({
    episode: i * step,
    reward: parseFloat((mean + (Math.random() - 0.5) * std * 2).toFixed(2)),
  }))
}

function makeStats(
  mean: number,
  std: number,
  min: number,
  max: number,
  avgLen: number,
  episodes: number
): EpisodeStats {
  return {
    rewardsMean: mean,
    rewardsStd: std,
    rewardsMin: min,
    rewardsMax: max,
    avgEpisodeLength: avgLen,
    rewardDistribution: generateRewardDistribution(mean, std, min, max),
    episodeLengthDistribution: generateEpisodeLengthDistribution(avgLen),
    cumulativeRewards: generateCumulativeRewards(episodes, mean, std),
  }
}

// -- Atari observation frame generators --

type PixelGrid = number[][]

function createGrid(w: number, h: number, bg: number[]): PixelGrid {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => [...bg]).flat())
}

function setPixel(grid: PixelGrid, x: number, y: number, w: number, r: number, g: number, b: number) {
  if (x >= 0 && x < w && y >= 0 && y < grid.length) {
    grid[y][x * 3] = r
    grid[y][x * 3 + 1] = g
    grid[y][x * 3 + 2] = b
  }
}

function fillRect(grid: PixelGrid, x0: number, y0: number, rw: number, rh: number, w: number, r: number, g: number, b: number) {
  for (let dy = 0; dy < rh; dy++) {
    for (let dx = 0; dx < rw; dx++) {
      setPixel(grid, x0 + dx, y0 + dy, w, r, g, b)
    }
  }
}

function generateBreakoutFrame(step: number, episode: number): ObservationFrame {
  const W = 84, H = 84
  const grid = createGrid(W, H, [0, 0, 0])
  // Bricks
  const colors = [[200, 50, 50], [200, 130, 50], [200, 200, 50], [50, 200, 50], [50, 100, 200]]
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
      const destroyed = Math.random() < (step / 5000)
      if (!destroyed) {
        const [cr, cg, cb] = colors[row]
        fillRect(grid, col * 8 + 2, row * 4 + 6, 7, 3, W, cr, cg, cb)
      }
    }
  }
  // Paddle
  const px = 20 + Math.round(Math.sin(step * 0.1 + episode) * 25)
  fillRect(grid, px, 78, 16, 3, W, 180, 180, 220)
  // Ball
  const bx = 42 + Math.round(Math.sin(step * 0.3) * 30)
  const by = 30 + Math.round(Math.cos(step * 0.25) * 30)
  fillRect(grid, bx, by, 2, 2, W, 255, 255, 255)
  return { step, episode, pixels: grid, width: W, height: H }
}

function generatePongFrame(step: number, episode: number): ObservationFrame {
  const W = 84, H = 84
  const grid = createGrid(W, H, [0, 0, 0])
  // Center line
  for (let y = 0; y < H; y += 4) fillRect(grid, 41, y, 2, 2, W, 80, 80, 80)
  // Left paddle
  const ly = 25 + Math.round(Math.sin(step * 0.08 + episode) * 20)
  fillRect(grid, 6, ly, 3, 16, W, 92, 186, 92)
  // Right paddle
  const ry = 30 + Math.round(Math.cos(step * 0.1 + episode * 2) * 22)
  fillRect(grid, 75, ry, 3, 16, W, 213, 130, 74)
  // Ball
  const bx = 20 + Math.round(((step * 3 + episode * 7) % 50))
  const by = 15 + Math.round(Math.sin(step * 0.15) * 28) + 20
  fillRect(grid, bx, by, 3, 3, W, 236, 236, 236)
  // Score area
  fillRect(grid, 0, 0, 84, 4, W, 30, 30, 30)
  return { step, episode, pixels: grid, width: W, height: H }
}

function generateSpaceInvadersFrame(step: number, episode: number): ObservationFrame {
  const W = 84, H = 84
  const grid = createGrid(W, H, [0, 0, 0])
  // Invaders grid
  const invaderColors = [[220, 50, 50], [50, 220, 120], [100, 150, 255]]
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      const alive = !((step + episode * 3) % (row * 8 + col + 3) === 0 && Math.random() < 0.4)
      if (alive) {
        const [cr, cg, cb] = invaderColors[row]
        const ox = col * 10 + 3 + Math.round(Math.sin(step * 0.05) * 3)
        fillRect(grid, ox, row * 8 + 8, 6, 5, W, cr, cg, cb)
        // "antenna" pixels
        setPixel(grid, ox + 1, row * 8 + 7, W, cr, cg, cb)
        setPixel(grid, ox + 4, row * 8 + 7, W, cr, cg, cb)
      }
    }
  }
  // Player ship
  const px = 35 + Math.round(Math.sin(step * 0.12 + episode) * 25)
  fillRect(grid, px, 74, 10, 4, W, 50, 200, 50)
  fillRect(grid, px + 4, 72, 2, 2, W, 50, 255, 50)
  // Shields
  for (let s = 0; s < 4; s++) {
    const sx = s * 20 + 6
    const damage = Math.min(5, Math.floor(step / 500))
    fillRect(grid, sx, 62, 12, 6 - damage, W, 180, 120, 50)
  }
  // Bullet
  if (step % 3 !== 0) {
    const bulletY = 72 - ((step * 4) % 50)
    fillRect(grid, px + 4, Math.max(5, bulletY), 2, 4, W, 255, 255, 100)
  }
  return { step, episode, pixels: grid, width: W, height: H }
}

function generateSeaquestFrame(step: number, episode: number): ObservationFrame {
  const W = 84, H = 84
  const grid = createGrid(W, H, [10, 20, 60])
  // Water surface
  for (let x = 0; x < W; x++) {
    const waveY = 8 + Math.round(Math.sin(x * 0.3 + step * 0.1) * 2)
    for (let y = 0; y < waveY; y++) setPixel(grid, x, y, W, 30, 60, 120)
  }
  // Submarine (player)
  const subX = 30 + Math.round(Math.sin(step * 0.06 + episode) * 22)
  const subY = 40 + Math.round(Math.sin(step * 0.08) * 15)
  fillRect(grid, subX, subY, 14, 6, W, 200, 200, 60)
  fillRect(grid, subX + 14, subY + 2, 4, 2, W, 200, 200, 60)
  fillRect(grid, subX + 4, subY - 2, 2, 2, W, 180, 180, 50)
  // Fish / enemies
  for (let i = 0; i < 4; i++) {
    const fx = ((step * (2 + i) + i * 30 + episode * 11) % 100) - 10
    const fy = 20 + i * 15
    fillRect(grid, fx, fy, 8, 4, W, 220, 80 + i * 30, 80)
    setPixel(grid, fx + 8, fy + 1, W, 220, 80 + i * 30, 80)
    setPixel(grid, fx + 8, fy + 2, W, 220, 80 + i * 30, 80)
  }
  // Bubbles
  for (let b = 0; b < 6; b++) {
    const bx = (b * 14 + step + episode * 5) % W
    const by = (80 - (step + b * 20) % 70)
    setPixel(grid, bx, by, W, 150, 200, 255)
  }
  // O2 bar
  const o2 = Math.max(10, 60 - Math.floor(step / 100))
  fillRect(grid, 2, 2, o2, 3, W, 50, 200, 255)
  return { step, episode, pixels: grid, width: W, height: H }
}

function generateMontezumaFrame(step: number, episode: number): ObservationFrame {
  const W = 84, H = 84
  const grid = createGrid(W, H, [0, 0, 0])
  // Room walls / platforms
  fillRect(grid, 0, 78, 84, 6, W, 120, 70, 30) // floor
  fillRect(grid, 0, 0, 84, 6, W, 120, 70, 30) // ceiling
  fillRect(grid, 0, 0, 4, 84, W, 120, 70, 30) // left wall
  fillRect(grid, 80, 0, 4, 84, W, 120, 70, 30) // right wall
  // Platforms
  fillRect(grid, 15, 55, 22, 3, W, 140, 90, 40)
  fillRect(grid, 50, 42, 22, 3, W, 140, 90, 40)
  fillRect(grid, 20, 28, 30, 3, W, 140, 90, 40)
  // Ladder
  for (let y = 42; y < 78; y += 2) {
    fillRect(grid, 38, y, 2, 1, W, 100, 100, 180)
    fillRect(grid, 44, y, 2, 1, W, 100, 100, 180)
  }
  for (let y = 42; y < 78; y += 5) {
    fillRect(grid, 38, y, 8, 1, W, 100, 100, 180)
  }
  // Player character (Panama Joe)
  const px = 20 + Math.round(Math.sin(step * 0.05 + episode) * 15)
  const onPlat = step % 300 < 150
  const py = onPlat ? 49 : 72
  fillRect(grid, px, py, 5, 6, W, 220, 50, 50) // body
  fillRect(grid, px + 1, py - 3, 3, 3, W, 255, 200, 150) // head
  fillRect(grid, px, py - 4, 5, 1, W, 220, 220, 50) // hat
  // Key
  const keyX = 60 + Math.round(Math.sin(step * 0.02) * 5)
  fillRect(grid, keyX, 36, 4, 4, W, 255, 220, 50)
  setPixel(grid, keyX + 4, 38, W, 255, 220, 50)
  setPixel(grid, keyX + 5, 38, W, 255, 220, 50)
  // Skull (enemy)
  const skullX = (step * 2 + episode * 13) % 60 + 10
  fillRect(grid, skullX, 72, 5, 5, W, 200, 200, 200)
  setPixel(grid, skullX + 1, 73, W, 0, 0, 0)
  setPixel(grid, skullX + 3, 73, W, 0, 0, 0)
  // Score
  fillRect(grid, 0, 0, 84, 5, W, 0, 0, 0)
  return { step, episode, pixels: grid, width: W, height: H }
}

type FrameGenerator = (step: number, episode: number) => ObservationFrame

const ATARI_GENERATORS: Record<string, FrameGenerator> = {
  "Breakout": generateBreakoutFrame,
  "Pong": generatePongFrame,
  "Space Invaders": generateSpaceInvadersFrame,
  "Seaquest": generateSeaquestFrame,
  "Montezuma Revenge": generateMontezumaFrame,
}

function generateAtariFrames(envName: string, totalSteps: number, totalEpisodes: number): ObservationFrame[] {
  const gen = ATARI_GENERATORS[envName]
  if (!gen) return []
  const frames: ObservationFrame[] = []
  const numFrames = 12
  for (let i = 0; i < numFrames; i++) {
    const ep = Math.floor(Math.random() * Math.min(totalEpisodes, 10))
    const step = Math.floor((i / numFrames) * totalSteps * 0.01) + Math.floor(Math.random() * 100)
    frames.push(gen(step, ep))
  }
  return frames
}

export const MINARI_DATASETS: MinariDataset[] = [
  // D4RL - Point Maze
  {
    id: "D4RL/pointmaze/umaze-v2",
    namespace: "D4RL",
    envName: "Point Maze",
    datasetName: "Umaze",
    version: 2,
    totalEpisodes: 1267,
    totalSteps: 305281,
    actionSpaceType: "Box",
    actionSpaceDims: 2,
    observationSpaceType: "Dict",
    observationSpaceDims: 6,
    algorithmName: "Waypoint Controller",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Point maze navigation in a U-shaped maze using a waypoint controller policy.",
    tags: ["D4RL", "Maze", "Navigation", "Continuous"],
    episodeStats: makeStats(82.4, 35.2, 0.0, 158.3, 241, 1267),
    downloads: 4895,
    createdAt: "2024-11-05",
  },
  {
    id: "D4RL/pointmaze/medium-v2",
    namespace: "D4RL",
    envName: "Point Maze",
    datasetName: "Medium",
    version: 2,
    totalEpisodes: 2004,
    totalSteps: 999982,
    actionSpaceType: "Box",
    actionSpaceDims: 2,
    observationSpaceType: "Dict",
    observationSpaceDims: 6,
    algorithmName: "Waypoint Controller",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Point maze navigation in a medium-difficulty maze layout with complex paths.",
    tags: ["D4RL", "Maze", "Navigation", "Continuous"],
    episodeStats: makeStats(64.1, 42.8, -12.0, 192.5, 499, 2004),
    downloads: 3210,
    createdAt: "2024-11-05",
  },
  {
    id: "D4RL/pointmaze/large-v2",
    namespace: "D4RL",
    envName: "Point Maze",
    datasetName: "Large",
    version: 2,
    totalEpisodes: 4097,
    totalSteps: 3995934,
    actionSpaceType: "Box",
    actionSpaceDims: 2,
    observationSpaceType: "Dict",
    observationSpaceDims: 6,
    algorithmName: "Waypoint Controller",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Point maze navigation in a large maze with lengthy trajectories and sparse rewards.",
    tags: ["D4RL", "Maze", "Navigation", "Continuous"],
    episodeStats: makeStats(48.7, 55.1, -25.0, 280.0, 975, 4097),
    downloads: 2780,
    createdAt: "2024-11-05",
  },
  {
    id: "D4RL/pointmaze/open-v2",
    namespace: "D4RL",
    envName: "Point Maze",
    datasetName: "Open",
    version: 2,
    totalEpisodes: 1187,
    totalSteps: 248105,
    actionSpaceType: "Box",
    actionSpaceDims: 2,
    observationSpaceType: "Dict",
    observationSpaceDims: 6,
    algorithmName: "Waypoint Controller",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Point maze in an open environment with minimal obstacles.",
    tags: ["D4RL", "Maze", "Navigation", "Continuous"],
    episodeStats: makeStats(95.3, 22.1, 15.0, 132.0, 209, 1187),
    downloads: 1950,
    createdAt: "2024-11-05",
  },
  // D4RL - Ant Maze
  {
    id: "D4RL/antmaze/umaze-v2",
    namespace: "D4RL",
    envName: "Ant Maze",
    datasetName: "Umaze",
    version: 2,
    totalEpisodes: 1499,
    totalSteps: 999926,
    actionSpaceType: "Box",
    actionSpaceDims: 8,
    observationSpaceType: "Dict",
    observationSpaceDims: 29,
    algorithmName: "Waypoint Controller",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Ant robot navigating a U-shaped maze. High-dimensional continuous control with 8 joint actuators.",
    tags: ["D4RL", "Maze", "MuJoCo", "Locomotion"],
    episodeStats: makeStats(0.62, 0.38, 0.0, 1.0, 667, 1499),
    downloads: 4120,
    createdAt: "2024-11-05",
  },
  {
    id: "D4RL/antmaze/medium-play-v2",
    namespace: "D4RL",
    envName: "Ant Maze",
    datasetName: "Medium-Play",
    version: 2,
    totalEpisodes: 2998,
    totalSteps: 1999928,
    actionSpaceType: "Box",
    actionSpaceDims: 8,
    observationSpaceType: "Dict",
    observationSpaceDims: 29,
    algorithmName: "Diverse Controller",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Ant robot exploring diverse paths in a medium maze for play-style data collection.",
    tags: ["D4RL", "Maze", "MuJoCo", "Locomotion"],
    episodeStats: makeStats(0.41, 0.42, 0.0, 1.0, 667, 2998),
    downloads: 3540,
    createdAt: "2024-11-05",
  },
  {
    id: "D4RL/antmaze/large-diverse-v2",
    namespace: "D4RL",
    envName: "Ant Maze",
    datasetName: "Large-Diverse",
    version: 2,
    totalEpisodes: 3998,
    totalSteps: 3999696,
    actionSpaceType: "Box",
    actionSpaceDims: 8,
    observationSpaceType: "Dict",
    observationSpaceDims: 29,
    algorithmName: "Diverse Controller",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Ant robot in a large maze with highly diverse trajectories and challenging navigation.",
    tags: ["D4RL", "Maze", "MuJoCo", "Locomotion"],
    episodeStats: makeStats(0.28, 0.39, 0.0, 1.0, 1000, 3998),
    downloads: 2890,
    createdAt: "2024-11-05",
  },
  // D4RL - Door
  {
    id: "D4RL/door/human-v2",
    namespace: "D4RL",
    envName: "Door",
    datasetName: "Human",
    version: 2,
    totalEpisodes: 6729,
    totalSteps: 327680,
    actionSpaceType: "Box",
    actionSpaceDims: 28,
    observationSpaceType: "Box",
    observationSpaceDims: 39,
    algorithmName: "Human Teleoperation",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Robotic hand opening a door, collected via human teleoperation demonstrations.",
    tags: ["D4RL", "Adroit", "Dexterous", "Human"],
    episodeStats: makeStats(12.8, 18.5, -6.2, 82.4, 49, 6729),
    downloads: 3150,
    createdAt: "2024-11-05",
  },
  {
    id: "D4RL/door/cloned-v2",
    namespace: "D4RL",
    envName: "Door",
    datasetName: "Cloned",
    version: 2,
    totalEpisodes: 8192,
    totalSteps: 491520,
    actionSpaceType: "Box",
    actionSpaceDims: 28,
    observationSpaceType: "Box",
    observationSpaceDims: 39,
    algorithmName: "Behavioral Cloning",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Robotic hand opening a door, collected from a behavioral cloning policy trained on human data.",
    tags: ["D4RL", "Adroit", "Dexterous", "Cloned"],
    episodeStats: makeStats(8.2, 15.3, -8.1, 75.2, 60, 8192),
    downloads: 2440,
    createdAt: "2024-11-05",
  },
  {
    id: "D4RL/door/expert-v2",
    namespace: "D4RL",
    envName: "Door",
    datasetName: "Expert",
    version: 2,
    totalEpisodes: 5000,
    totalSteps: 250000,
    actionSpaceType: "Box",
    actionSpaceDims: 28,
    observationSpaceType: "Box",
    observationSpaceDims: 39,
    algorithmName: "RL Expert Policy",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Robotic hand opening a door, collected from an RL-trained expert policy.",
    tags: ["D4RL", "Adroit", "Dexterous", "Expert"],
    episodeStats: makeStats(52.1, 12.4, 18.0, 85.6, 50, 5000),
    downloads: 3680,
    createdAt: "2024-11-05",
  },
  // D4RL - Pen
  {
    id: "D4RL/pen/human-v2",
    namespace: "D4RL",
    envName: "Pen",
    datasetName: "Human",
    version: 2,
    totalEpisodes: 5000,
    totalSteps: 500000,
    actionSpaceType: "Box",
    actionSpaceDims: 24,
    observationSpaceType: "Box",
    observationSpaceDims: 45,
    algorithmName: "Human Teleoperation",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Dexterous pen manipulation using a Shadow Hand, collected via human teleoperation.",
    tags: ["D4RL", "Adroit", "Dexterous", "Human"],
    episodeStats: makeStats(42.5, 28.3, -10.0, 120.0, 100, 5000),
    downloads: 2750,
    createdAt: "2024-11-05",
  },
  {
    id: "D4RL/pen/expert-v2",
    namespace: "D4RL",
    envName: "Pen",
    datasetName: "Expert",
    version: 2,
    totalEpisodes: 5000,
    totalSteps: 500000,
    actionSpaceType: "Box",
    actionSpaceDims: 24,
    observationSpaceType: "Box",
    observationSpaceDims: 45,
    algorithmName: "RL Expert Policy",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Dexterous pen manipulation using a Shadow Hand, expert RL policy demonstrations.",
    tags: ["D4RL", "Adroit", "Dexterous", "Expert"],
    episodeStats: makeStats(98.4, 15.2, 30.0, 140.0, 100, 5000),
    downloads: 3190,
    createdAt: "2024-11-05",
  },
  // D4RL - Hammer
  {
    id: "D4RL/hammer/human-v2",
    namespace: "D4RL",
    envName: "Hammer",
    datasetName: "Human",
    version: 2,
    totalEpisodes: 3214,
    totalSteps: 642800,
    actionSpaceType: "Box",
    actionSpaceDims: 26,
    observationSpaceType: "Box",
    observationSpaceDims: 46,
    algorithmName: "Human Teleoperation",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Robotic hand using a hammer to drive a nail, teleoperated by humans.",
    tags: ["D4RL", "Adroit", "Dexterous", "Human"],
    episodeStats: makeStats(1.2, 2.8, -3.0, 15.4, 200, 3214),
    downloads: 1890,
    createdAt: "2024-11-05",
  },
  {
    id: "D4RL/hammer/expert-v2",
    namespace: "D4RL",
    envName: "Hammer",
    datasetName: "Expert",
    version: 2,
    totalEpisodes: 5000,
    totalSteps: 1000000,
    actionSpaceType: "Box",
    actionSpaceDims: 26,
    observationSpaceType: "Box",
    observationSpaceDims: 46,
    algorithmName: "RL Expert Policy",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Robotic hand using a hammer to drive a nail, collected from expert RL policy.",
    tags: ["D4RL", "Adroit", "Dexterous", "Expert"],
    episodeStats: makeStats(78.6, 22.1, 5.0, 125.0, 200, 5000),
    downloads: 2340,
    createdAt: "2024-11-05",
  },
  // D4RL - Relocate
  {
    id: "D4RL/relocate/human-v2",
    namespace: "D4RL",
    envName: "Relocate",
    datasetName: "Human",
    version: 2,
    totalEpisodes: 3467,
    totalSteps: 693400,
    actionSpaceType: "Box",
    actionSpaceDims: 30,
    observationSpaceType: "Box",
    observationSpaceDims: 39,
    algorithmName: "Human Teleoperation",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Object relocation using a dexterous robotic hand, collected from human demonstrations.",
    tags: ["D4RL", "Adroit", "Dexterous", "Human"],
    episodeStats: makeStats(-2.5, 4.1, -15.0, 8.2, 200, 3467),
    downloads: 1650,
    createdAt: "2024-11-05",
  },
  // D4RL - Kitchen
  {
    id: "D4RL/kitchen/complete-v2",
    namespace: "D4RL",
    envName: "Kitchen",
    datasetName: "Complete",
    version: 2,
    totalEpisodes: 3680,
    totalSteps: 1070440,
    actionSpaceType: "Box",
    actionSpaceDims: 9,
    observationSpaceType: "Box",
    observationSpaceDims: 60,
    algorithmName: "Human Teleoperation",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Kitchen manipulation environment with a 9-DOF Franka robot completing all subtasks.",
    tags: ["D4RL", "Kitchen", "Manipulation", "Multi-task"],
    episodeStats: makeStats(3.2, 1.1, 0.0, 4.0, 291, 3680),
    downloads: 3020,
    createdAt: "2024-11-05",
  },
  {
    id: "D4RL/kitchen/partial-v2",
    namespace: "D4RL",
    envName: "Kitchen",
    datasetName: "Partial",
    version: 2,
    totalEpisodes: 3680,
    totalSteps: 1070440,
    actionSpaceType: "Box",
    actionSpaceDims: 9,
    observationSpaceType: "Box",
    observationSpaceDims: 60,
    algorithmName: "Human Teleoperation",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "Kitchen manipulation with partial task completion demonstrations.",
    tags: ["D4RL", "Kitchen", "Manipulation", "Multi-task"],
    episodeStats: makeStats(1.8, 1.0, 0.0, 4.0, 291, 3680),
    downloads: 2560,
    createdAt: "2024-11-05",
  },
  // MiniGrid
  {
    id: "minigrid/fourrooms-v0",
    namespace: "MiniGrid",
    envName: "FourRooms",
    datasetName: "Optimal",
    version: 0,
    totalEpisodes: 10000,
    totalSteps: 380000,
    actionSpaceType: "Discrete",
    actionSpaceDims: 7,
    observationSpaceType: "Dict",
    observationSpaceDims: 147,
    algorithmName: "BFS Optimal",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "MiniGrid FourRooms environment with optimal BFS-generated trajectories.",
    tags: ["MiniGrid", "Grid", "Navigation", "Discrete"],
    episodeStats: makeStats(0.92, 0.12, 0.0, 1.0, 38, 10000),
    downloads: 4052,
    createdAt: "2024-11-19",
  },
  {
    id: "minigrid/babyai-pickup-v0",
    namespace: "MiniGrid",
    envName: "BabyAI Pickup",
    datasetName: "Optimal",
    version: 0,
    totalEpisodes: 50000,
    totalSteps: 450000,
    actionSpaceType: "Discrete",
    actionSpaceDims: 7,
    observationSpaceType: "Dict",
    observationSpaceDims: 147,
    algorithmName: "BFS Optimal",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "BabyAI Pickup task: pick up an object of a specified type and color.",
    tags: ["MiniGrid", "BabyAI", "Instruction", "Discrete"],
    episodeStats: makeStats(0.95, 0.08, 0.0, 1.0, 9, 50000),
    downloads: 1820,
    createdAt: "2024-11-19",
  },
  {
    id: "minigrid/babyai-gotobj-v0",
    namespace: "MiniGrid",
    envName: "BabyAI GoToObj",
    datasetName: "Optimal",
    version: 0,
    totalEpisodes: 50000,
    totalSteps: 300000,
    actionSpaceType: "Discrete",
    actionSpaceDims: 7,
    observationSpaceType: "Dict",
    observationSpaceDims: 147,
    algorithmName: "BFS Optimal",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "BabyAI GoToObj: Navigate to an object in a single room.",
    tags: ["MiniGrid", "BabyAI", "Instruction", "Discrete"],
    episodeStats: makeStats(0.97, 0.05, 0.0, 1.0, 6, 50000),
    downloads: 1540,
    createdAt: "2024-11-19",
  },
  {
    id: "minigrid/babyai-bosslevel-v0",
    namespace: "MiniGrid",
    envName: "BabyAI BossLevel",
    datasetName: "Optimal",
    version: 0,
    totalEpisodes: 50000,
    totalSteps: 4500000,
    actionSpaceType: "Discrete",
    actionSpaceDims: 7,
    observationSpaceType: "Dict",
    observationSpaceDims: 147,
    algorithmName: "BFS Optimal",
    author: "Farama Foundation",
    minariVersion: "0.4.3",
    description: "BabyAI BossLevel: The most challenging BabyAI task combining all skills.",
    tags: ["MiniGrid", "BabyAI", "Instruction", "Discrete"],
    episodeStats: makeStats(0.68, 0.35, 0.0, 1.0, 90, 50000),
    downloads: 2100,
    createdAt: "2024-11-19",
  },
  // Atari
  {
    id: "atari/breakout/expert-v0",
    namespace: "Atari",
    envName: "Breakout",
    datasetName: "Expert",
    version: 0,
    totalEpisodes: 100,
    totalSteps: 458320,
    actionSpaceType: "Discrete",
    actionSpaceDims: 4,
    observationSpaceType: "Box",
    observationSpaceDims: 84,
    algorithmName: "CleanRL PPO",
    author: "Farama Foundation",
    minariVersion: "0.5.3",
    description: "Atari Breakout played by a CleanRL PPO-trained expert agent.",
    tags: ["Atari", "Arcade", "Expert", "Discrete"],
    episodeStats: makeStats(312.5, 89.2, 42.0, 520.0, 4583, 100),
    downloads: 3976,
    createdAt: "2025-03-22",
    observationFrames: generateAtariFrames("Breakout", 458320, 100),
  },
  {
    id: "atari/pong/expert-v0",
    namespace: "Atari",
    envName: "Pong",
    datasetName: "Expert",
    version: 0,
    totalEpisodes: 100,
    totalSteps: 125000,
    actionSpaceType: "Discrete",
    actionSpaceDims: 6,
    observationSpaceType: "Box",
    observationSpaceDims: 84,
    algorithmName: "CleanRL PPO",
    author: "Farama Foundation",
    minariVersion: "0.5.3",
    description: "Atari Pong played by a CleanRL PPO-trained expert agent.",
    tags: ["Atari", "Arcade", "Expert", "Discrete"],
    episodeStats: makeStats(19.8, 1.5, 14.0, 21.0, 1250, 100),
    downloads: 2840,
    createdAt: "2025-03-22",
    observationFrames: generateAtariFrames("Pong", 125000, 100),
  },
  {
    id: "atari/spaceinvaders/expert-v0",
    namespace: "Atari",
    envName: "Space Invaders",
    datasetName: "Expert",
    version: 0,
    totalEpisodes: 100,
    totalSteps: 210500,
    actionSpaceType: "Discrete",
    actionSpaceDims: 6,
    observationSpaceType: "Box",
    observationSpaceDims: 84,
    algorithmName: "CleanRL PPO",
    author: "Farama Foundation",
    minariVersion: "0.5.3",
    description: "Atari Space Invaders played by expert PPO policy from CleanRL.",
    tags: ["Atari", "Arcade", "Expert", "Discrete"],
    episodeStats: makeStats(1285.0, 420.0, 280.0, 2450.0, 2105, 100),
    downloads: 2210,
    createdAt: "2025-03-22",
    observationFrames: generateAtariFrames("Space Invaders", 210500, 100),
  },
  {
    id: "atari/seaquest/expert-v0",
    namespace: "Atari",
    envName: "Seaquest",
    datasetName: "Expert",
    version: 0,
    totalEpisodes: 100,
    totalSteps: 380000,
    actionSpaceType: "Discrete",
    actionSpaceDims: 18,
    observationSpaceType: "Box",
    observationSpaceDims: 84,
    algorithmName: "CleanRL PPO",
    author: "Farama Foundation",
    minariVersion: "0.5.3",
    description: "Atari Seaquest played by expert PPO policy.",
    tags: ["Atari", "Arcade", "Expert", "Discrete"],
    episodeStats: makeStats(2450.0, 850.0, 400.0, 5200.0, 3800, 100),
    downloads: 1680,
    createdAt: "2025-03-22",
    observationFrames: generateAtariFrames("Seaquest", 380000, 100),
  },
  {
    id: "atari/montezumarevenge/expert-v0",
    namespace: "Atari",
    envName: "Montezuma Revenge",
    datasetName: "Expert",
    version: 0,
    totalEpisodes: 100,
    totalSteps: 520000,
    actionSpaceType: "Discrete",
    actionSpaceDims: 18,
    observationSpaceType: "Box",
    observationSpaceDims: 84,
    algorithmName: "CleanRL PPO",
    author: "Farama Foundation",
    minariVersion: "0.5.3",
    description: "Atari Montezuma's Revenge - notoriously hard exploration game with sparse rewards.",
    tags: ["Atari", "Arcade", "Expert", "Discrete", "Sparse"],
    episodeStats: makeStats(2100.0, 1800.0, 0.0, 8500.0, 5200, 100),
    downloads: 1950,
    createdAt: "2025-03-22",
    observationFrames: generateAtariFrames("Montezuma Revenge", 520000, 100),
  },
  // MuJoCo
  {
    id: "mujoco/halfcheetah/expert-v0",
    namespace: "MuJoCo",
    envName: "HalfCheetah",
    datasetName: "Expert",
    version: 0,
    totalEpisodes: 1000,
    totalSteps: 1000000,
    actionSpaceType: "Box",
    actionSpaceDims: 6,
    observationSpaceType: "Box",
    observationSpaceDims: 17,
    algorithmName: "SAC Expert",
    author: "Farama Foundation",
    minariVersion: "0.5.0",
    description: "HalfCheetah locomotion from a SAC-trained expert policy.",
    tags: ["MuJoCo", "Locomotion", "Expert", "Continuous"],
    episodeStats: makeStats(11200.0, 1500.0, 5400.0, 14800.0, 1000, 1000),
    downloads: 4641,
    createdAt: "2024-11-06",
  },
  {
    id: "mujoco/hopper/expert-v0",
    namespace: "MuJoCo",
    envName: "Hopper",
    datasetName: "Expert",
    version: 0,
    totalEpisodes: 1000,
    totalSteps: 1000000,
    actionSpaceType: "Box",
    actionSpaceDims: 3,
    observationSpaceType: "Box",
    observationSpaceDims: 11,
    algorithmName: "SAC Expert",
    author: "Farama Foundation",
    minariVersion: "0.5.0",
    description: "Hopper single-leg locomotion from a SAC-trained expert.",
    tags: ["MuJoCo", "Locomotion", "Expert", "Continuous"],
    episodeStats: makeStats(3420.0, 280.0, 1800.0, 3780.0, 1000, 1000),
    downloads: 3890,
    createdAt: "2024-11-06",
  },
  {
    id: "mujoco/walker2d/expert-v0",
    namespace: "MuJoCo",
    envName: "Walker2d",
    datasetName: "Expert",
    version: 0,
    totalEpisodes: 1000,
    totalSteps: 1000000,
    actionSpaceType: "Box",
    actionSpaceDims: 6,
    observationSpaceType: "Box",
    observationSpaceDims: 17,
    algorithmName: "SAC Expert",
    author: "Farama Foundation",
    minariVersion: "0.5.0",
    description: "Walker2d bipedal locomotion from an SAC-trained expert policy.",
    tags: ["MuJoCo", "Locomotion", "Expert", "Continuous"],
    episodeStats: makeStats(4850.0, 420.0, 2200.0, 5500.0, 1000, 1000),
    downloads: 3240,
    createdAt: "2024-11-06",
  },
  {
    id: "mujoco/ant/expert-v0",
    namespace: "MuJoCo",
    envName: "Ant",
    datasetName: "Expert",
    version: 0,
    totalEpisodes: 1000,
    totalSteps: 1000000,
    actionSpaceType: "Box",
    actionSpaceDims: 8,
    observationSpaceType: "Box",
    observationSpaceDims: 27,
    algorithmName: "SAC Expert",
    author: "Farama Foundation",
    minariVersion: "0.5.0",
    description: "Ant quadruped locomotion from a SAC-trained expert policy.",
    tags: ["MuJoCo", "Locomotion", "Expert", "Continuous"],
    episodeStats: makeStats(5820.0, 680.0, 2800.0, 7200.0, 1000, 1000),
    downloads: 2960,
    createdAt: "2024-11-06",
  },
  // MetaWorld
  {
    id: "metaworld/button-press-v2",
    namespace: "MetaWorld",
    envName: "Button Press",
    datasetName: "Expert",
    version: 2,
    totalEpisodes: 2500,
    totalSteps: 375000,
    actionSpaceType: "Box",
    actionSpaceDims: 4,
    observationSpaceType: "Box",
    observationSpaceDims: 39,
    algorithmName: "SAC Expert",
    author: "Farama Foundation",
    minariVersion: "0.5.3",
    description: "MetaWorld button pressing task with a Sawyer robot arm.",
    tags: ["MetaWorld", "Manipulation", "Expert", "Continuous"],
    episodeStats: makeStats(4200.0, 350.0, 2800.0, 4800.0, 150, 2500),
    downloads: 3393,
    createdAt: "2025-05-07",
  },
  {
    id: "metaworld/drawer-open-v2",
    namespace: "MetaWorld",
    envName: "Drawer Open",
    datasetName: "Expert",
    version: 2,
    totalEpisodes: 2500,
    totalSteps: 375000,
    actionSpaceType: "Box",
    actionSpaceDims: 4,
    observationSpaceType: "Box",
    observationSpaceDims: 39,
    algorithmName: "SAC Expert",
    author: "Farama Foundation",
    minariVersion: "0.5.3",
    description: "MetaWorld drawer opening task with a Sawyer robot arm.",
    tags: ["MetaWorld", "Manipulation", "Expert", "Continuous"],
    episodeStats: makeStats(3800.0, 420.0, 2100.0, 4600.0, 150, 2500),
    downloads: 2180,
    createdAt: "2025-05-07",
  },
  {
    id: "metaworld/pick-place-v2",
    namespace: "MetaWorld",
    envName: "Pick Place",
    datasetName: "Expert",
    version: 2,
    totalEpisodes: 2500,
    totalSteps: 375000,
    actionSpaceType: "Box",
    actionSpaceDims: 4,
    observationSpaceType: "Box",
    observationSpaceDims: 39,
    algorithmName: "SAC Expert",
    author: "Farama Foundation",
    minariVersion: "0.5.3",
    description: "MetaWorld pick and place manipulation task with a Sawyer robot arm.",
    tags: ["MetaWorld", "Manipulation", "Expert", "Continuous"],
    episodeStats: makeStats(3200.0, 580.0, 1500.0, 4400.0, 150, 2500),
    downloads: 2540,
    createdAt: "2025-05-07",
  },
  // WebAgents
  {
    id: "webagents/webarena-v0",
    namespace: "WebAgents",
    envName: "WebArena",
    datasetName: "Expert",
    version: 0,
    totalEpisodes: 812,
    totalSteps: 8950,
    actionSpaceType: "Text",
    actionSpaceDims: 0,
    observationSpaceType: "Dict",
    observationSpaceDims: 0,
    algorithmName: "Human Demonstrations",
    author: "Farama Foundation",
    minariVersion: "0.5.3",
    description: "WebArena web navigation tasks with human expert demonstrations.",
    tags: ["WebAgents", "Web", "NLP", "Multimodal"],
    episodeStats: makeStats(0.42, 0.38, 0.0, 1.0, 11, 812),
    downloads: 2077,
    createdAt: "2025-05-15",
  },
]

export const NAMESPACES = [...new Set(MINARI_DATASETS.map(d => d.namespace))]

export const ENV_NAMES = [...new Set(MINARI_DATASETS.map(d => d.envName))]

export const ALL_TAGS = [...new Set(MINARI_DATASETS.flatMap(d => d.tags))].sort()

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
