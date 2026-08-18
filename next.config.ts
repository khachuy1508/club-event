import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
    serverActions: {
      // Cap below 1MB so a large logo never hits the action (app limit is 500KB).
      bodySizeLimit: "800kb",
    },
  },
};

export default nextConfig;
