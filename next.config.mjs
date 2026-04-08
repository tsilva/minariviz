import { fileURLToPath } from "node:url"
import { withSentryConfig } from "@sentry/nextjs"

const projectRoot = fileURLToPath(new URL(".", import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
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
