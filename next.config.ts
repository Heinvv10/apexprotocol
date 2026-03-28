import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix Turbopack root directory detection for git worktrees
  turbopack: {
    root: __dirname,
  },

  // Enable standalone output for Docker deployments
  output: "standalone",

  // Disable telemetry in production
  poweredByHeader: false,

  // Production optimizations
  reactStrictMode: true,


  // Skip type checking and linting during build (run separately)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
