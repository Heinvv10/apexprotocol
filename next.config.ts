import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Turbopack disabled for production builds — its serverExternalPackages
  // handling for pg/ioredis is incomplete (Node builtins like dns/net/tls
  // aren't externalized). Webpack handles serverExternalPackages correctly.
  // (Turbopack still works for `next dev` if invoked with --turbopack flag.)

  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,

  // Don't bundle pg / ioredis / nodemailer — they use Node builtins (dns,
  // net, tls, fs) that the bundler can't trace. Mark them external so Node
  // requires them at runtime instead. Required since the Plan 2 driver swap.
  serverExternalPackages: ["pg", "ioredis", "nodemailer", "@supabase/supabase-js"],

  productionBrowserSourceMaps: process.env.SENTRY_ENABLED === "true",

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.apexgeo.app" },
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "www.google.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  disableLogger: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
