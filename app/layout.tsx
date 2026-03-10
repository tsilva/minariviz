import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const SITE_URL = "https://minariviz.tsilva.eu";
const SITE_TITLE = "Minari Explorer | Offline RL Dataset Visualizer";
const SITE_DESCRIPTION = "Browse and visualize Minari offline reinforcement learning datasets from the Farama Foundation. Explore metadata, episode statistics, reward distributions, and observations. Free tool for RL researchers and practitioners.";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    "Minari",
    "reinforcement learning",
    "RL datasets",
    "offline RL",
    "dataset visualization",
    "Farama Foundation",
    "Gymnasium",
    "machine learning",
    "AI research",
    "episode statistics",
    "reward distribution",
    "observation space",
    "action space",
  ],
  authors: [{ name: "Tiago Silva" }],
  creator: "Tiago Silva",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: "Visualize Minari offline RL datasets. Explore episode statistics, rewards, and observations from Farama Foundation datasets.",
    type: "website",
    url: SITE_URL,
    siteName: "Minari Explorer",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: "Browse and visualize Minari offline RL datasets. Free tool for reinforcement learning research.",
    creator: "@tiagosilva",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Minari Explorer",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  author: {
    "@type": "Person",
    name: "Tiago Silva",
    url: "https://www.tsilva.eu",
  },
  applicationCategory: "DeveloperApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
