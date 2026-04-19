import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/auth/supabase-middleware";

const SUPABASE_AUTH_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co";

const API_KEY_AUTH_HEADERS = {
  AUTH_TYPE: "x-apex-auth-type",
  KEY_ID: "x-apex-key-id",
  USER_ID: "x-apex-user-id",
  ORG_ID: "x-apex-org-id",
  USER_EMAIL: "x-apex-user-email",
  USER_NAME: "x-apex-user-name",
  ORG_NAME: "x-apex-org-name",
} as const;

function matchesPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith("(.*)")) {
      return pathname.startsWith(pattern.slice(0, -4));
    }
    return pathname === pattern;
  });
}

const publicRoutes = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/auth/(.*)",
  "/onboarding(.*)",
  "/api/onboarding(.*)",
  "/api/auth(.*)",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  "/api/health",
  "/api/status",
  "/api/brands(.*)",
  "/api/monitor/trigger-by-domain",
  "/api/monitor/update-keywords",
  // Public API v1 — health + spec are open, actual endpoints auth via API key
  "/api/v1/health",
  "/api/v1/openapi.json",
  "/api/docs",
  // Trust Center + embeddable widgets — public by design
  "/trust",
  "/embed(.*)",
  "/_next(.*)",
  "/static(.*)",
  "/favicon.ico",
  "/logo.svg",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
];

const apiKeyAuthRoutes = [
  "/api/brands(.*)",
  "/api/content(.*)",
  "/api/audit(.*)",
  "/api/recommendations(.*)",
  "/api/monitor(.*)",
  "/api/competitive(.*)",
  "/api/portfolios(.*)",
  "/api/analytics(.*)",
  "/api/export(.*)",
  "/api/locations(.*)",
  "/api/opportunities(.*)",
  "/api/people(.*)",
  "/api/integrations(.*)",
  "/api/ai-insights(.*)",
  "/api/simulations(.*)",
  // Public v1 API — all endpoints except /health and /openapi.json
  "/api/v1/brands(.*)",
  "/api/v1/audits(.*)",
  "/api/v1/webhooks(.*)",
  "/api/v1/embed(.*)",
  "/api/v1/mcp(.*)",
];

const superAdminRoutes = ["/admin(.*)", "/api/admin(.*)"];
const orgAdminRoutes = [
  "/settings/organization(.*)",
  "/settings/billing(.*)",
  "/settings/api-keys(.*)",
];

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
function isApexApiKey(token: string | null): boolean {
  return token ? token.startsWith("apx_") : false;
}
function createUnauthorizedResponse(message: string, reason: string): NextResponse {
  return NextResponse.json({ error: "Unauthorized", message, reason }, { status: 401 });
}

async function handleApiKeyAuth(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const isApiKeyRoute = matchesPattern(pathname, apiKeyAuthRoutes);
  const authHeader = request.headers.get("authorization");
  const token = extractBearerToken(authHeader);
  if (!isApiKeyRoute || !isApexApiKey(token)) return null;

  try {
    const { validateApiKey } = await import("@/lib/auth/api-key-auth");
    const result = await validateApiKey(token!);
    if (!result.valid) return createUnauthorizedResponse(result.message, result.reason);

    let rateLimitHeaders: Record<string, string> = {};
    try {
      const { checkApiRateLimit, getRateLimitHeaders, classifyRoute } = await import(
        "@/lib/api/api-rate-limiter"
      );
      const bucket = classifyRoute(pathname);
      const rl = await checkApiRateLimit(`${result.organizationId}:${bucket}`, bucket);
      rateLimitHeaders = getRateLimitHeaders(rl);
      if (!rl.allowed) {
        const r = NextResponse.json(
          {
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please retry after the reset time.",
            retryAfter: new Date(rl.resetMs).toISOString(),
          },
          { status: 429 }
        );
        for (const [k, v] of Object.entries(rateLimitHeaders)) r.headers.set(k, v);
        r.headers.set("Retry-After", String(Math.ceil((rl.resetMs - Date.now()) / 1000)));
        return r;
      }
    } catch {
      // rate limiter unavailable — fail open
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(API_KEY_AUTH_HEADERS.AUTH_TYPE, "api-key");
    requestHeaders.set(API_KEY_AUTH_HEADERS.KEY_ID, result.keyId);
    requestHeaders.set(API_KEY_AUTH_HEADERS.USER_ID, result.userId);
    requestHeaders.set(API_KEY_AUTH_HEADERS.ORG_ID, result.organizationId);
    if (result.userEmail) requestHeaders.set(API_KEY_AUTH_HEADERS.USER_EMAIL, result.userEmail);
    if (result.userName) requestHeaders.set(API_KEY_AUTH_HEADERS.USER_NAME, result.userName);
    if (result.organizationName) requestHeaders.set(API_KEY_AUTH_HEADERS.ORG_NAME, result.organizationName);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    for (const [k, v] of Object.entries(rateLimitHeaders)) response.headers.set(k, v);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to validate API key" },
      { status: 500 }
    );
  }
}

async function devMiddleware(request: NextRequest) {
  const apiKeyResponse = await handleApiKeyAuth(request);
  if (apiKeyResponse) return apiKeyResponse;
  const { pathname } = request.nextUrl;
  if (matchesPattern(pathname, superAdminRoutes)) {
    if (process.env.DEV_SUPER_ADMIN !== "true") {
      const url = new URL("/dashboard", request.url);
      url.searchParams.set("error", "super_admin_required");
      url.searchParams.set("message", "Set DEV_SUPER_ADMIN=true in .env to access admin panel");
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

async function productionMiddleware(request: NextRequest) {
  const apiKeyResponse = await handleApiKeyAuth(request);
  if (apiKeyResponse) return apiKeyResponse;

  const { pathname } = request.nextUrl;
  const { response, userId } = await updateSupabaseSession(request);

  if (matchesPattern(pathname, publicRoutes)) return response;

  if (!userId) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("redirect_to", pathname);
    return NextResponse.redirect(url);
  }

  // NOTE: super-admin / org-admin DB lookups intentionally happen in the
  // route handlers / page guards (NOT here). Middleware runs in the edge
  // runtime which can't import pg. The middleware here only verifies that
  // a session exists; detailed role enforcement is downstream.

  if (pathname.startsWith("/api/")) {
    try {
      const { checkApiRateLimit, getRateLimitHeaders, classifyRoute } = await import(
        "@/lib/api/api-rate-limiter"
      );
      const bucket = classifyRoute(pathname);
      const rl = await checkApiRateLimit(`${userId}:${bucket}`, bucket);
      if (!rl.allowed) {
        const r = NextResponse.json(
          {
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please retry after the reset time.",
            retryAfter: new Date(rl.resetMs).toISOString(),
          },
          { status: 429 }
        );
        for (const [k, v] of Object.entries(getRateLimitHeaders(rl))) r.headers.set(k, v);
        r.headers.set("Retry-After", String(Math.ceil((rl.resetMs - Date.now()) / 1000)));
        return r;
      }
    } catch {
      // rate limiter unavailable — fail open
    }
  }

  return response;
}

export default async function middleware(request: NextRequest) {
  if (!SUPABASE_AUTH_CONFIGURED) return devMiddleware(request);
  return productionMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
