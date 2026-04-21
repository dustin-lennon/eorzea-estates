import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Don't crash the build if local Hyperdrive proxy fails to start (e.g., no
// localConnectionString configured). Wrangler sets up the CF context at
// request time anyway; this call is only needed for `next dev`, not `pnpm preview`.
initOpenNextCloudflareForDev().catch((e: unknown) => {
  if (process.env.NODE_ENV === "development") {
    console.warn("[next.config] initOpenNextCloudflareForDev failed:", (e as Error).message)
  }
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["@xivapi/nodestone", "regex-translator", "@langfuse/otel", "@opentelemetry/sdk-node"],
  // Turbopack hashes sharp to a random module ID (e.g. "sharp-03c9e6d01f648d5d") that
  // OpenNext's esbuild step cannot resolve. Aliasing to a null shim prevents the error.
  // Next.js skips image optimization when sharp is unavailable, which is fine for CF Workers.
  turbopack: {
    resolveAlias: {
      sharp: "./src/shims/sharp.js",
    },
  },
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
      },
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
