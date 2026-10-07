import { fileURLToPath } from "node:url"
import { withSentryConfig } from "@sentry/nextjs"

const projectRoot = fileURLToPath(new URL(".", import.meta.url))

export function resolveObservationApiUrl(configuredUrl, isProduction) {
  const fallback = isProduction
    ? "https://minariviz-api.onrender.com"
    : "http://localhost:8000"
  const value = configuredUrl?.trim()
  if (!value) return fallback

  const url = new URL(value)
  const isLoopback = url.hostname === "localhost"
    || url.hostname.endsWith(".localhost")
    || url.hostname.startsWith("127.")
    || url.hostname === "[::1]"
    || url.hostname === "0.0.0.0"

  // Development dotenv settings must never send hosted traffic to localhost.
  if (isProduction && isLoopback) return fallback
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("NEXT_PUBLIC_API_URL must use HTTP or HTTPS")
  }
  return value.replace(/\/+$/, "")
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = resolveObservationApiUrl(
      process.env.NEXT_PUBLIC_API_URL,
      process.env.NODE_ENV === "production",
    )
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: projectRoot,
  },
}

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG ?? "tsilva",
  project: process.env.SENTRY_PROJECT ?? "minariviz",
  silent: !process.env.CI,
  ...(process.env.SENTRY_AUTH_TOKEN
    ? {
        authToken: process.env.SENTRY_AUTH_TOKEN,
        widenClientFileUpload: true,
      }
    : {}),
}

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions)
