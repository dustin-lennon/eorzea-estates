import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@xivapi/nodestone", "regex-translator", "@langfuse/otel", "@opentelemetry/sdk-node"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img2.finalfantasyxiv.com",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      }
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps only in CI/production builds; suppress output locally
  silent: !process.env.CI,

  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Proxy Sentry requests through the app to avoid ad blockers
  tunnelRoute: "/monitoring",

  // Tree-shake Sentry debug code in production
  disableLogger: true,

  // Automatically instrument Next.js data fetching, API routes, and middleware
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
  autoInstrumentAppDirectory: true,
});
