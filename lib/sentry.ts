const sentryEnvironment = process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV

export const sentryBrowserDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
export const sentryServerDsn =
  process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

export const sentryCommonConfig = {
  environment: sentryEnvironment,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1 : 0.1,
}
