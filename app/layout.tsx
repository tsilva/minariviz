import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { Suspense } from 'react'
import { GoogleAnalytics } from '@/components/google-analytics'
import './globals.css'

const SITE_URL = "https://minariviz.tsilva.eu";
const SITE_TITLE = "Minari Explorer | Offline RL Dataset Visualizer";
const SITE_DESCRIPTION = "Browse and visualize Minari offline reinforcement learning datasets from the Farama Foundation. Explore metadata, episode statistics, reward distributions, and observations. Free tool for RL researchers and practitioners.";

const _geist = Geist({ subsets: ["latin"], preload: false });
const _geistMono = Geist_Mono({ subsets: ["latin"], preload: false });
const catalogSans = localFont({
  src: "./fonts/geist-latin-400-700.woff2",
  weight: "400 700",
  variable: "--font-catalog-sans",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});
const catalogMono = localFont({
  src: "./fonts/geist-mono-latin-400-700.woff2",
  weight: "400 700",
  variable: "--font-catalog-mono",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
      <body className={`${catalogSans.variable} ${catalogMono.variable} font-sans antialiased`}>
        {children}
        {GA_MEASUREMENT_ID ? (
          <Suspense fallback={null}>
            <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
          </Suspense>
        ) : null}
        <Analytics />
      </body>
    </html>
  )
}
