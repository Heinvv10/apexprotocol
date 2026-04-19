import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Security headers — target A rating on securityheaders.com (NFR-SEC-010).
//
// CSP is enforced. If a third-party embed breaks, ADD IT TO THE ALLOWLIST —
// do not switch CSP to report-only. Report-only is a footgun; real attackers
// care whether the policy blocks them, not whether someone's watching reports.
//
// Nonces for inline scripts are applied via middleware when needed; the
// default policy below is strict enough for Next.js App Router with no inline
// script injection from our code.
const IS_PROD = process.env.NODE_ENV === "production";

const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    // Next.js RSC/hydration inline bootstrap — we allow via hash if tightening further.
    "'unsafe-inline'",
    // Allow Vercel Analytics + Sentry if enabled
    "https://*.vercel-analytics.com",
    "https://*.vercel-insights.com",
    "https://*.ingest.sentry.io",
    // Google OAuth consent for GA4/GSC flows
    "https://accounts.google.com",
    "https://apis.google.com",
    ...(IS_PROD ? [] : ["'unsafe-eval'"]),
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'", // Tailwind + shadcn emit inline style hashes we'd have to track
    "https://fonts.googleapis.com",
  ],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https:", // brand logos are arbitrary https URLs
  ],
  "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    "https://*.supabase.in",
    // Our own self-hosted Supabase
    "https://api.apex.dev",
    "https://*.apex.dev",
    // LLM provider APIs for anything called client-side (minimize this)
    "https://api.openai.com",
    "https://api.anthropic.com",
    "https://generativelanguage.googleapis.com",
    "https://api.perplexity.ai",
    // Observability
    "https://*.ingest.sentry.io",
    "https://*.vercel-analytics.com",
    "wss:",
  ],
  "frame-src": [
    "'self'",
    "https://accounts.google.com",
  ],
  "frame-ancestors": ["'none'"], // replaces X-Frame-Options: DENY
  "base-uri": ["'self'"],
  "form-action": ["'self'", "https://accounts.google.com"],
  "object-src": ["'none'"],
  "upgrade-insecure-requests": [],
};

const csp = Object.entries(cspDirectives)
  .map(([k, v]) => (v.length > 0 ? `${k} ${v.join(" ")}` : k))
  .join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), xr-spatial-tracking=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: csp },
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
