import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Check if Clerk is configured at build/runtime
const CLERK_CONFIGURED =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

/**
 * Custom headers set for API key authenticated requests.
 * These headers allow API routes to identify API key auth vs session auth.
 */
const API_KEY_AUTH_HEADERS = {
  /** Indicates request was authenticated via API key */
  AUTH_TYPE: "x-apex-auth-type",
  /** The API key record ID (for audit logging) */
  KEY_ID: "x-apex-key-id",
  /** The authenticated user's ID */
  USER_ID: "x-apex-user-id",
  /** The organization ID for the request */
  ORG_ID: "x-apex-org-id",
  /** User's email (if available) */
  USER_EMAIL: "x-apex-user-email",
  /** User's name (if available) */
  USER_NAME: "x-apex-user-name",
  /** Organization name (if available) */
  ORG_NAME: "x-apex-org-name",
} as const;

// Simple matcher function for development mode
function matchesPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith("(.*)")) {
      const prefix = pattern.slice(0, -4);
      return pathname.startsWith(prefix);
    }
    return pathname === pattern;
  });
}

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",  // Allow onboarding wizard for testing
  "/api/onboarding(.*)",  // Allow all onboarding APIs
  "/api/webhooks(.*)",
  "/api/health",
  "/api/status",
  "/api/brands(.*)",  // Handles auth internally via getOrganizationId()
  "/_next(.*)",
  "/static(.*)",
  "/favicon.ico",
  "/logo.svg",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
];

/**
 * API routes that support API key authentication for programmatic access.
 * These routes can be accessed with either session auth (Clerk) or API key auth.
 *
 * Note: Admin routes (/api/admin/*) are NOT included - they require session auth
 * with super-admin privileges.
 */
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
  "/api/ai-insights(.*)",  // AI Insights analysis routes
  "/api/simulations(.*)",  // Test Before Publish simulator
];

/**
 * Extract Bearer token from Authorization header
 * Must start with "Bearer " (case-insensitive per RFC 6750)
 */
function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  return bearerMatch ? bearerMatch[1].trim() : null;
}

/**
 * Check if a token is an Apex API key (starts with apx_)
 */
function isApexApiKey(token: string | null): boolean {
  return token ? token.startsWith("apx_") : false;
}

/**
 * Create an unauthorized response for API routes
 */
function createUnauthorizedResponse(message: string, reason: string): NextResponse {
  return NextResponse.json(
    {
      error: "Unauthorized",
      message,
      reason,
    },
    { status: 401 }
  );
}

/**
 * Handle API key authentication and rate limiting.
 * Shared between dev and production middleware.
 *
 * Returns a NextResponse if the request was handled (auth success, failure, or rate limited).
 * Returns null if the request is not an API key request and should fall through.
 */
async function handleApiKeyAuth(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  const isApiKeyRoute = matchesPattern(pathname, apiKeyAuthRoutes);
  const authHeader = request.headers.get("authorization");
  const token = extractBearerToken(authHeader);

  if (!isApiKeyRoute || !isApexApiKey(token)) {
    return null; // Not an API key request — fall through
  }

  try {
    const { validateApiKey } = await import("@/lib/auth/api-key-auth");
    const result = await validateApiKey(token!);

    if (!result.valid) {
      return createUnauthorizedResponse(result.message, result.reason);
    }

    // Check rate limits for API key requests
    let rateLimitHeaders: Record<string, string> = {};
    try {
      const { checkApiRateLimit, getRateLimitHeaders } = await import(
        "@/lib/api/api-rate-limiter"
      );
      const rlResult = await checkApiRateLimit(result.organizationId);
      rateLimitHeaders = getRateLimitHeaders(rlResult);

      if (!rlResult.allowed) {
        const response = NextResponse.json(
          {
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please retry after the reset time.",
            retryAfter: new Date(rlResult.resetMs).toISOString(),
          },
          { status: 429 }
        );
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value);
        }
        response.headers.set(
          "Retry-After",
          String(Math.ceil((rlResult.resetMs - Date.now()) / 1000))
        );
        return response;
      }
    } catch {
      // Rate limiting unavailable — allow request (fail open)
    }

    // API key is valid — set auth context headers on the request
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(API_KEY_AUTH_HEADERS.AUTH_TYPE, "api-key");
    requestHeaders.set(API_KEY_AUTH_HEADERS.KEY_ID, result.keyId);
    requestHeaders.set(API_KEY_AUTH_HEADERS.USER_ID, result.userId);
    requestHeaders.set(API_KEY_AUTH_HEADERS.ORG_ID, result.organizationId);

    if (result.userEmail) {
      requestHeaders.set(API_KEY_AUTH_HEADERS.USER_EMAIL, result.userEmail);
    }
    if (result.userName) {
      requestHeaders.set(API_KEY_AUTH_HEADERS.USER_NAME, result.userName);
    }
    if (result.organizationName) {
      requestHeaders.set(API_KEY_AUTH_HEADERS.ORG_NAME, result.organizationName);
    }

    // Continue to route with auth context headers + rate limit response headers
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (_error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Middleware] API key validation error:", _error);
    }
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to validate API key",
      },
      { status: 500 }
    );
  }
}

// Development mode middleware (when Clerk is not configured)
async function devMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for API key authentication
  const apiKeyResponse = await handleApiKeyAuth(request);
  if (apiKeyResponse) return apiKeyResponse;

  // Check if this is a super-admin route
  const isSuperAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (isSuperAdminRoute) {
    // In dev mode, require DEV_SUPER_ADMIN=true for admin routes
    const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!devSuperAdmin) {
      const url = new URL("/dashboard", request.url);
      url.searchParams.set("error", "super_admin_required");
      url.searchParams.set("message", "Set DEV_SUPER_ADMIN=true in .env to access admin panel");
      return NextResponse.redirect(url);
    }
  }

  // Allow all other routes in dev mode
  return NextResponse.next();
}

// Production middleware with Clerk authentication
async function productionMiddleware(request: NextRequest) {
  // Check for API key authentication first (bypasses Clerk)
  const apiKeyResponse = await handleApiKeyAuth(request);
  if (apiKeyResponse) return apiKeyResponse;

  // For non-API key requests, use Clerk authentication
  // Dynamically import Clerk middleware only when configured
  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );

  const isPublicRoute = createRouteMatcher(publicRoutes);

  const isOrgRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/monitor(.*)",
    "/create(.*)",
    "/audit(.*)",
    "/recommendations(.*)",
    "/settings(.*)",
    "/api/content(.*)",
    "/api/audits(.*)",
    "/api/recommendations(.*)",
    "/api/monitoring(.*)",
    "/api/portfolios(.*)",
    "/api/reports(.*)",
  ]);

  // Super-admin routes (system-wide admin panel)
  const isSuperAdminRoute = createRouteMatcher([
    "/admin(.*)",
    "/api/admin(.*)",
  ]);

  // Org-admin routes (organization-level settings)
  const isOrgAdminRoute = createRouteMatcher([
    "/settings/organization(.*)",
    "/settings/billing(.*)",
    "/settings/api-keys(.*)",
  ]);

  const handler = clerkMiddleware(async (auth, req) => {
    // Allow public routes without authentication
    if (isPublicRoute(req)) {
      return;
    }

    // Protect all non-public routes
    await auth.protect();

    // For org routes, ensure user is part of an organization
    if (isOrgRoute(req)) {
      const { orgId } = await auth();
      if (!orgId) {
        return;
      }
    }

    // For super-admin routes, check for super-admin status via publicMetadata
    if (isSuperAdminRoute(req)) {
      const { sessionClaims } = await auth();
      const publicMetadata = sessionClaims?.publicMetadata as { isSuperAdmin?: boolean } | undefined;
      const isSuperAdmin = publicMetadata?.isSuperAdmin === true;

      // In development, allow access if DEV_SUPER_ADMIN is set
      const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

      if (!isSuperAdmin && !devSuperAdmin) {
        const url = new URL("/dashboard", req.url);
        url.searchParams.set("error", "super_admin_required");
        return NextResponse.redirect(url);
      }
    }

    // For org-admin routes, check for org:admin role
    if (isOrgAdminRoute(req)) {
      const { orgRole } = await auth();
      if (orgRole !== "org:admin") {
        const url = new URL("/dashboard", req.url);
        url.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(url);
      }
    }
  });

  // Create a minimal NextFetchEvent-like object.
  // Passing {} as never can break Clerk's cookie-setting logic in dev mode.
  const event = {
    sourcePage: request.nextUrl.pathname,
    waitUntil: (promise: Promise<unknown>) => { void promise; },
  };
  return handler(request, event as never);
}

// Export middleware based on Clerk configuration
export default async function middleware(request: NextRequest) {
  if (!CLERK_CONFIGURED) {
    return devMiddleware(request);
  }
  return productionMiddleware(request);
}

export const config = {
  // Match all paths except static files
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
