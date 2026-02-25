<div align="center">
  <img src="logo.png" alt="minariviz" width="512"/>

  [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

  **🔬 Explore, filter, and visualize Minari offline reinforcement learning datasets in your browser 📊**

  [Minari Docs](https://minari.farama.org/) · [Farama Foundation](https://farama.org/)
</div>

---

## 🧠 Overview

**The Pain:** Offline RL datasets are scattered across repositories with inconsistent metadata, making it hard to compare episode statistics, reward distributions, and environment configurations at a glance.

**The Solution:** minariviz provides an interactive browser-based catalog for 40+ Minari datasets with real-time search, namespace filtering, and rich visual analytics — no setup required.

**The Result:** Find the right dataset in seconds instead of reading documentation for hours. Compare reward distributions, episode lengths, and action spaces side by side.

## ✨ Features

- 🔍 **Real-time search** — full-text search across dataset IDs, environments, descriptions, and tags
- 🏷️ **Namespace filtering** — browse by D4RL, MiniGrid, Atari, MuJoCo, MetaWorld, and WebAgents
- 📊 **Visual analytics** — reward distributions, episode length histograms, cumulative reward charts, and summary statistics
- 📋 **Dataset details** — action/observation spaces, episode stats, algorithm info, and one-click Python install commands
- 🥧 **Namespace overview** — pie charts and bar charts showing dataset distribution across namespaces
- 🌙 **Dark mode** — toggle between light and dark themes
- ⚡ **Zero backend** — fully client-side, instant load

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/tsilva/minariviz.git
cd minariviz

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the datasets.

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js](https://nextjs.org/) 16 |
| Language | [TypeScript](https://www.typescriptlang.org/) 5.7 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 4 |
| Components | [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives) |
| Charts | [Recharts](https://recharts.org/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) |

## 📁 Project Structure

```
minariviz/
├── app/                    # Next.js app directory
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page entry point
│   └── globals.css         # Global styles & CSS variables
├── components/
│   ├── charts/             # Recharts visualizations
│   │   ├── namespace-chart.tsx
│   │   ├── reward-distribution.tsx
│   │   ├── episode-length.tsx
│   │   ├── cumulative-rewards.tsx
│   │   └── reward-summary.tsx
│   ├── dataset-card.tsx    # Dataset list item
│   ├── dataset-detail.tsx  # Full detail view with tabs
│   ├── overview-stats.tsx  # Top stats bar
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── minari-data.ts      # Dataset definitions & models
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

## 🏗️ Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

## 📜 License

[MIT](LICENSE) — Tiago Silva
