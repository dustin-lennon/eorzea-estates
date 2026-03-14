import type { NextConfig } from "next";

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
        hostname: "*.supabase.co",
      }
    ],
  },
};

export default nextConfig;
