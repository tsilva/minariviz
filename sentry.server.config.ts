import * as Sentry from "@sentry/nextjs"

import { sentryCommonConfig, sentryServerDsn } from "./lib/sentry"

Sentry.init({
  ...sentryCommonConfig,
  dsn: sentryServerDsn,
  enabled: Boolean(sentryServerDsn),
})
