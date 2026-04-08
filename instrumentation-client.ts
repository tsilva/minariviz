import * as Sentry from "@sentry/nextjs"

import { sentryBrowserDsn, sentryCommonConfig } from "./lib/sentry"

Sentry.init({
  ...sentryCommonConfig,
  dsn: sentryBrowserDsn,
  enabled: Boolean(sentryBrowserDsn),
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
