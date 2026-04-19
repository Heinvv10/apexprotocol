/**
 * API Key Context Module
 *
 * Provides unified authentication context helpers for API routes that support
 * both session-based (Clerk) and API key authentication.
 *
 * This module allows API routes to seamlessly handle both auth methods without
 * duplicating authentication logic.
 *
 * @example
 * ```ts
 * // In an API route:
 * import { getAuthContext, requireAuthContext } from "@/lib/auth/api-key-context";
 *
 * export async function GET(request: NextRequest) {
 *   // Works with both API key and session auth
 *   const context = await getAuthContext(request);
 *   if (!context) {
 *     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   }
 *
 *   // Use context.userId, context.organizationId regardless of auth method
 *   // Check context.authType if you need to know which auth method was used
 * }
 * ```
 */

import type { NextRequest } from "next/server";
import { getSession, currentDbUser } from "@/lib/auth/supabase-server";
import {
  getApiKeyAuthContext,
  isApiKeyAuthenticated,
  type ApiKeyContext,
} from "./api-key-auth";

// Check if Clerk is configured
const CLERK_CONFIGURED =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

// Dev mode fallback values
const DEV_USER_ID = "dev-user-id";
const DEV_ORG_ID = "demo-org-id";

/**
 * Authentication type indicator
 */
export type AuthType = "api-key" | "session" | "dev";

/**
 * Unified authentication context that works with both API key and session auth.
 * This interface provides a common shape for both authentication methods.
 */
export interface UnifiedAuthContext {
  /** The authentication method used */
  authType: AuthType;

  /** The authenticated user's ID (Clerk userId or API key userId) */
  userId: string;

  /** The organization ID for the request */
  organizationId: string;

  /** User's email address (if available) */
  userEmail: string | null;

  /** User's name (if available) */
  userName: string | null;

  /** Organization name (if available) */
  organizationName: string | null;

  /** The API key record ID (only present for API key auth) */
  keyId?: string;

  /** Organization role (only present for session auth) */
  orgRole?: string | null;

  /** Organization slug (only present for session auth) */
  orgSlug?: string | null;
}

/**
 * Get authentication context from either API key or session.
 *
 * This function checks for API key authentication first (via request headers),
 * then falls back to session authentication (via Clerk).
 *
 * @param request - The NextRequest object (required to read API key headers)
 * @returns Unified auth context or null if not authenticated
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const context = await getAuthContext(request);
 *
 *   if (!context) {
 *     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   }
 *
 *   // context.userId and context.organizationId work for both auth methods
 *   const data = await fetchData(context.userId, context.organizationId);
 *
 *   // Check if using API key auth for audit logging
 *   if (context.authType === "api-key") {
 *     await logApiKeyAccess(context.keyId!, "data-fetch");
 *   }
 *
 *   return NextResponse.json(data);
 * }
 * ```
 */
export async function getAuthContext(
  request: NextRequest
): Promise<UnifiedAuthContext | null> {
  // First, check for API key authentication via headers
  const apiKeyContext = getApiKeyAuthContext(request.headers);

  if (apiKeyContext) {
    return {
      authType: "api-key",
      userId: apiKeyContext.userId,
      organizationId: apiKeyContext.organizationId,
      userEmail: apiKeyContext.userEmail,
      userName: apiKeyContext.userName,
      organizationName: apiKeyContext.organizationName,
      keyId: apiKeyContext.keyId,
    };
  }

  // Fall back to session authentication
  return getSessionAuthContext();
}

/**
 * Get session-based authentication context from Clerk.
 *
 * This is similar to the existing auth() pattern but returns a UnifiedAuthContext.
 *
 * @returns Session auth context or null if not authenticated
 */
export async function getSessionAuthContext(): Promise<UnifiedAuthContext | null> {
  // In development without Clerk, return mock context
  if (!CLERK_CONFIGURED && process.env.NODE_ENV === "development") {
    return {
      authType: "dev",
      userId: DEV_USER_ID,
      organizationId: DEV_ORG_ID,
      userEmail: "dev@example.com",
      userName: "Dev User",
      organizationName: "Demo Organization",
      orgRole: "org:admin",
      orgSlug: "demo-org",
    };
  }

  try {
    const __session = await getSession();
  const { userId, orgId, orgRole, orgSlug } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };

    if (!userId) {
      return null;
    }

    // Get org ID with fallback
    let organizationId = orgId;
    if (!organizationId && process.env.NODE_ENV === "development") {
      organizationId = DEV_ORG_ID;
    }

    if (!organizationId) {
      // User is authenticated but not in org context
      // Use personal workspace format
      organizationId = `user_${userId}`;
    }

    return {
      authType: "session",
      userId,
      organizationId,
      userEmail: null, // Session auth doesn't include email in basic auth()
      userName: null, // Would need to call currentUser() for this
      organizationName: null, // Would need to call getOrganization() for this
      orgRole: orgRole ?? null,
      orgSlug: orgSlug ?? null,
    };
  } catch {
    // In development, return dev context on auth failure
    if (process.env.NODE_ENV === "development") {
      return {
        authType: "dev",
        userId: DEV_USER_ID,
        organizationId: DEV_ORG_ID,
        userEmail: "dev@example.com",
        userName: "Dev User",
        organizationName: "Demo Organization",
        orgRole: "org:admin",
        orgSlug: "demo-org",
      };
    }
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated.
 *
 * Works with both API key and session auth. Use this when you need
 * guaranteed authentication context and want to throw on failure.
 *
 * @param request - The NextRequest object
 * @returns Unified auth context (never null)
 * @throws Error if not authenticated
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   try {
 *     const context = await requireAuthContext(request);
 *     // Guaranteed to have userId and organizationId
 *     await createResource(context.userId, context.organizationId);
 *   } catch (error) {
 *     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   }
 * }
 * ```
 */
export async function requireAuthContext(
  request: NextRequest
): Promise<UnifiedAuthContext> {
  const context = await getAuthContext(request);

  if (!context) {
    throw new Error("Authentication required");
  }

  return context;
}

/**
 * Get user ID from API key or session context.
 *
 * This is an API-key-aware version of getUserId() that checks
 * API key headers first before falling back to session auth.
 *
 * @param request - The NextRequest object
 * @returns User ID or null if not authenticated
 */
export async function getUserIdFromContext(
  request: NextRequest
): Promise<string | null> {
  const context = await getAuthContext(request);
  return context?.userId ?? null;
}

/**
 * Get organization ID from API key or session context.
 *
 * This is an API-key-aware version of getOrganizationId() that checks
 * API key headers first before falling back to session auth.
 *
 * @param request - The NextRequest object
 * @returns Organization ID or null if not authenticated/no org context
 */
export async function getOrganizationIdFromContext(
  request: NextRequest
): Promise<string | null> {
  const context = await getAuthContext(request);
  return context?.organizationId ?? null;
}

/**
 * Check if the request was authenticated via API key.
 *
 * Useful when you need to apply different logic based on auth method.
 *
 * @param request - The NextRequest object
 * @returns true if authenticated via API key
 *
 * @example
 * ```ts
 * if (isApiKeyAuth(request)) {
 *   // Log API key usage for billing/metrics
 *   await trackApiKeyUsage(context.keyId);
 * }
 * ```
 */
export function isApiKeyAuth(request: NextRequest): boolean {
  return isApiKeyAuthenticated(request.headers);
}

/**
 * Get API key context if authenticated via API key.
 *
 * Returns the API key specific context if the request was authenticated
 * via API key, or null if authenticated via session.
 *
 * @param request - The NextRequest object
 * @returns API key context or null if not API key auth
 */
export function getApiKeyContextFromRequest(
  request: NextRequest
): ApiKeyContext | null {
  return getApiKeyAuthContext(request.headers);
}

/**
 * Create a consistent error response for authentication failures.
 *
 * @param reason - The reason for the authentication failure
 * @param message - Optional custom message
 * @returns Object with error details for JSON response
 */
export function createAuthError(
  reason: "not_authenticated" | "missing_org" | "invalid_api_key" | "expired_api_key",
  message?: string
): { error: string; message: string; reason: string } {
  const defaultMessages: Record<typeof reason, string> = {
    not_authenticated: "Authentication required",
    missing_org: "Organization context required",
    invalid_api_key: "Invalid or revoked API key",
    expired_api_key: "API key has expired",
  };

  return {
    error: "Unauthorized",
    message: message ?? defaultMessages[reason],
    reason,
  };
}

/**
 * Helper type guard to check if context is from API key auth
 */
export function isApiKeyContext(
  context: UnifiedAuthContext
): context is UnifiedAuthContext & { authType: "api-key"; keyId: string } {
  return context.authType === "api-key" && !!context.keyId;
}

/**
 * Helper type guard to check if context is from session auth
 */
export function isSessionContext(
  context: UnifiedAuthContext
): context is UnifiedAuthContext & { authType: "session" } {
  return context.authType === "session";
}

/**
 * Helper type guard to check if context is from dev mode
 */
export function isDevContext(
  context: UnifiedAuthContext
): context is UnifiedAuthContext & { authType: "dev" } {
  return context.authType === "dev";
}

// Re-export types for convenience
export type { ApiKeyContext } from "./api-key-auth";

// Default export for convenience
export const apiKeyContext = {
  getAuthContext,
  getSessionAuthContext,
  requireAuthContext,
  getUserIdFromContext,
  getOrganizationIdFromContext,
  isApiKeyAuth,
  getApiKeyContextFromRequest,
  createAuthError,
  isApiKeyContext,
  isSessionContext,
  isDevContext,
};
