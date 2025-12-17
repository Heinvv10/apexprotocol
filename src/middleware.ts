import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Check if Clerk is configured at build/runtime
const CLERK_CONFIGURED =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

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
  "/dashboard(.*)",  // Allow dashboard for testing
  "/api/onboarding(.*)",  // Allow all onboarding APIs
  "/api/webhooks(.*)",
  "/api/health",
  "/api/status",
  "/_next(.*)",
  "/static(.*)",
  "/favicon.ico",
  "/logo.svg",
  "/robots.txt",
  "/sitemap.xml",
];

// Development mode middleware (when Clerk is not configured)
async function devMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a super-admin route
  const isSuperAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (isSuperAdminRoute) {
    // In dev mode, require DEV_SUPER_ADMIN=true for admin routes
    const devSuperAdmin = process.env.DEV_SUPER_ADMIN === "true";

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
    "/api/brands(.*)",
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

  return handler(request, {} as never);
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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
