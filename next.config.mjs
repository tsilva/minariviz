import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
