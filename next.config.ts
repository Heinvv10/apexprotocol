import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

  // Source maps for Sentry (only when Sentry is enabled)
  productionBrowserSourceMaps: process.env.SENTRY_ENABLED === "true",

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

// Dark-ship: withSentryConfig is always applied (it's inert at runtime
// unless SENTRY_ENABLED=true + SENTRY_DSN is set in the Sentry init files).
// The build-time source map upload is gated on SENTRY_AUTH_TOKEN being set.
export default withSentryConfig(nextConfig, {
  silent: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  disableLogger: true,
  // Upload source maps only when a token is present
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
