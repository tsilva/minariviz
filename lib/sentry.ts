const sentryEnvironment = process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV

export const sentryBrowserDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
export const sentryServerDsn =
  process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

export const sentryCommonConfig = {
  environment: sentryEnvironment,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    mcp: { inputs: false, outputs: false },
    databaseQueryData: false,
    queues: false,
    frameContextLines: 7,
  },
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1 : 0.1,
}
