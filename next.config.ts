import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@xivapi/nodestone", "regex-translator"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img2.finalfantasyxiv.com",
      },
    ],
  },
};

export default nextConfig;
