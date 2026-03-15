import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of transactions for performance monitoring in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Don't send PII by default
  sendDefaultPii: false,
})
