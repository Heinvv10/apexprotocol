/**
 * API Key Authentication Module
 *
 * Provides utilities for validating API keys from Authorization headers
 * and returning user/organization context for authenticated requests.
 *
 * Uses key hash lookup for performance (no decryption needed for validation).
 */

import { db } from "@/lib/db";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { apiKeys, users, organizations } from "@/lib/db/schema";
import type * as schema from "@/lib/db/schema";
import { eq, and, or, isNull, gt } from "drizzle-orm";
import { hashApiKey, isValidApiKeyFormat } from "@/lib/crypto/key-generation";

/**
 * Custom headers set by middleware for API key authenticated requests.
 * These headers allow API routes to identify API key auth vs session auth.
 *
 * Use getApiKeyAuthContext() to read these headers in API routes.
 */
export const API_KEY_AUTH_HEADERS = {
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

/**
 * API routes that support API key authentication.
 * Admin routes are intentionally excluded.
 */
export const API_KEY_SUPPORTED_ROUTES = [
  "/api/brands",
  "/api/content",
  "/api/audit",
  "/api/recommendations",
  "/api/monitor",
  "/api/competitive",
  "/api/portfolios",
  "/api/analytics",
  "/api/export",
  "/api/locations",
  "/api/opportunities",
  "/api/people",
  "/api/integrations",
] as const;

/**
 * Result of a successful API key validation
 */
export interface ApiKeyAuthResult {
  /** Whether authentication succeeded */
  valid: true;
  /** The API key record ID */
  keyId: string;
  /** The user ID associated with the API key */
  userId: string;
  /** The organization ID associated with the API key */
  organizationId: string;
  /** User's email address (if available) */
  userEmail: string | null;
  /** User's name (if available) */
  userName: string | null;
  /** Organization name (if available) */
  organizationName: string | null;
  /** API key scopes (for future permission support) */
  scopes: {
    read?: boolean;
    write?: boolean;
    admin?: boolean;
    endpoints?: string[];
  } | null;
}

/**
 * Result of a failed API key validation
 */
export interface ApiKeyAuthFailure {
  /** Whether authentication succeeded */
  valid: false;
  /** The reason for failure */
  reason:
    | "missing_header"
    | "invalid_format"
    | "key_not_found"
    | "key_inactive"
    | "key_expired"
    | "user_not_found"
    | "database_error";
  /** Human-readable error message */
  message: string;
}

/**
 * Combined result type for API key validation
 */
export type ApiKeyValidationResult = ApiKeyAuthResult | ApiKeyAuthFailure;

/**
 * Extract Bearer token from Authorization header
 *
 * @param authHeader - The Authorization header value
 * @returns The token without "Bearer " prefix, or null if invalid
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Must start with "Bearer " (case-insensitive per RFC 6750)
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!bearerMatch) {
    return null;
  }

  return bearerMatch[1].trim();
}

/**
 * Check if a token is an Apex API key (starts with apx_)
 *
 * @param token - The token to check
 * @returns true if this appears to be an Apex API key
 */
export function isApexApiKey(token: string | null): boolean {
  if (!token) {
    return false;
  }
  return token.startsWith("apx_");
}

/**
 * Validate an API key and return user/organization context
 *
 * This function:
 * 1. Validates the key format
 * 2. Hashes the key for database lookup (no decryption needed)
 * 3. Checks the key is active and not expired
 * 4. Updates lastUsedAt timestamp on successful auth
 * 5. Returns user and organization context
 *
 * @param apiKey - The raw API key (e.g., "apx_...")
 * @returns Validation result with user/org context or failure reason
 */
export async function validateApiKey(
  apiKey: string,
  dbInstance: NeonHttpDatabase<typeof schema> = db
): Promise<ApiKeyValidationResult> {
  try {
    // Step 1: Validate key format
    if (!isValidApiKeyFormat(apiKey)) {
      return {
        valid: false,
        reason: "invalid_format",
        message: "Invalid API key format",
      };
    }

    // Step 2: Hash the key for lookup
    const keyHash = await hashApiKey(apiKey);

    // Step 3: Look up the key in the database
    const now = new Date();
    const [keyRecord] = await dbInstance
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        organizationId: apiKeys.organizationId,
        isActive: apiKeys.isActive,
        expiresAt: apiKeys.expiresAt,
        scopes: apiKeys.scopes,
      })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyHash, keyHash),
          eq(apiKeys.type, "user") // Only user-generated API keys can authenticate
        )
      )
      .limit(1);

    if (!keyRecord) {
      return {
        valid: false,
        reason: "key_not_found",
        message: "API key not found",
      };
    }

    // Step 4: Check if key is active
    if (!keyRecord.isActive) {
      return {
        valid: false,
        reason: "key_inactive",
        message: "API key has been revoked",
      };
    }

    // Step 5: Check if key is expired
    if (keyRecord.expiresAt && keyRecord.expiresAt < now) {
      return {
        valid: false,
        reason: "key_expired",
        message: "API key has expired",
      };
    }

    // Step 6: Verify user exists (required for user API keys)
    if (!keyRecord.userId) {
      return {
        valid: false,
        reason: "user_not_found",
        message: "API key is not associated with a user",
      };
    }

    // Step 7: Fetch user and organization details
    const [userRecord] = await dbInstance
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.clerkUserId, keyRecord.userId))
      .limit(1);

    const [orgRecord] = await dbInstance
      .select({
        id: organizations.id,
        name: organizations.name,
      })
      .from(organizations)
      .where(eq(organizations.id, keyRecord.organizationId))
      .limit(1);

    // Step 8: Update lastUsedAt timestamp (async, don't block response)
    // Use a fire-and-forget pattern to avoid slowing down the auth flow
    updateLastUsedAt(keyRecord.id, dbInstance).catch(() => {
      // Silently ignore errors - lastUsedAt update is not critical
    });

    // Step 9: Return success result with context
    return {
      valid: true,
      keyId: keyRecord.id,
      userId: keyRecord.userId,
      organizationId: keyRecord.organizationId,
      userEmail: userRecord?.email ?? null,
      userName: userRecord?.name ?? null,
      organizationName: orgRecord?.name ?? null,
      scopes: keyRecord.scopes ?? null,
    };
  } catch (error) {
    // Log error for debugging but don't expose details to client
    if (process.env.NODE_ENV === "development") {
      console.error("[API Key Auth] Validation error:", error);
    }

    return {
      valid: false,
      reason: "database_error",
      message: "Failed to validate API key",
    };
  }
}

/**
 * Update the lastUsedAt timestamp for an API key
 *
 * This is called asynchronously after successful authentication
 * to avoid blocking the response.
 *
 * @param keyId - The API key record ID
 */
async function updateLastUsedAt(
  keyId: string,
  dbInstance: NeonHttpDatabase<typeof schema> = db
): Promise<void> {
  await dbInstance
    .update(apiKeys)
    .set({
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(apiKeys.id, keyId));
}

/**
 * Validate API key from Authorization header
 *
 * Convenience function that extracts the Bearer token and validates it.
 *
 * @param authHeader - The Authorization header value
 * @returns Validation result with user/org context or failure reason
 */
export async function validateApiKeyFromHeader(
  authHeader: string | null,
  dbInstance: NeonHttpDatabase<typeof schema> = db
): Promise<ApiKeyValidationResult> {
  // Extract Bearer token
  const token = extractBearerToken(authHeader);

  if (!token) {
    return {
      valid: false,
      reason: "missing_header",
      message: "Missing or invalid Authorization header",
    };
  }

  // Check if this is an Apex API key
  if (!isApexApiKey(token)) {
    return {
      valid: false,
      reason: "invalid_format",
      message: "Token is not an Apex API key",
    };
  }

  // Validate the API key
  return validateApiKey(token, dbInstance);
}

/**
 * Get active API keys count for a user (for rate limiting display)
 *
 * @param userId - The user's Clerk user ID
 * @param organizationId - The organization ID
 * @returns Count of active API keys
 */
export async function getActiveApiKeyCount(
  userId: string,
  organizationId: string
): Promise<number> {
  const now = new Date();

  const result = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.userId, userId),
        eq(apiKeys.organizationId, organizationId),
        eq(apiKeys.type, "user"),
        eq(apiKeys.isActive, true),
        // Not expired (null expiresAt or future date)
        or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, now))
      )
    );

  return result.length;
}

/**
 * Check if a specific API key is valid (without updating lastUsedAt)
 *
 * Useful for checking key validity without triggering usage tracking.
 *
 * @param keyHash - The SHA-256 hash of the API key
 * @returns true if the key is valid and active
 */
export async function isApiKeyValid(
  keyHash: string,
  dbInstance: NeonHttpDatabase<typeof schema> = db
): Promise<boolean> {
  const now = new Date();

  const [keyRecord] = await dbInstance
    .select({
      id: apiKeys.id,
      isActive: apiKeys.isActive,
      expiresAt: apiKeys.expiresAt,
    })
    .from(apiKeys)
    .where(
      and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.type, "user"))
    )
    .limit(1);

  if (!keyRecord) {
    return false;
  }

  if (!keyRecord.isActive) {
    return false;
  }

  if (keyRecord.expiresAt && keyRecord.expiresAt < now) {
    return false;
  }

  return true;
}

/**
 * Context from API key authentication set by middleware
 */
export interface ApiKeyContext {
  /** Authentication type (always "api-key" when authenticated via API key) */
  authType: "api-key";
  /** The API key record ID (for audit logging) */
  keyId: string;
  /** The authenticated user's ID */
  userId: string;
  /** The organization ID for the request */
  organizationId: string;
  /** User's email (if available) */
  userEmail: string | null;
  /** User's name (if available) */
  userName: string | null;
  /** Organization name (if available) */
  organizationName: string | null;
}

/**
 * Read API key authentication context from request headers.
 *
 * The middleware sets these headers when a request is authenticated via API key.
 * Use this function in API routes to check if the request was authenticated
 * via API key and get the user/org context.
 *
 * @param headers - The request headers (from NextRequest or Headers)
 * @returns API key context if authenticated via API key, null otherwise
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const apiKeyContext = getApiKeyAuthContext(request.headers);
 *
 *   if (apiKeyContext) {
 *     // Request was authenticated via API key
 *     const { userId, organizationId } = apiKeyContext;
 *     // ... handle request
 *   } else {
 *     // Request was authenticated via session (Clerk)
 *     const { userId, orgId } = await auth();
 *     // ... handle request
 *   }
 * }
 * ```
 */
export function getApiKeyAuthContext(headers: Headers): ApiKeyContext | null {
  const authType = headers.get(API_KEY_AUTH_HEADERS.AUTH_TYPE);

  // Not authenticated via API key
  if (authType !== "api-key") {
    return null;
  }

  const keyId = headers.get(API_KEY_AUTH_HEADERS.KEY_ID);
  const userId = headers.get(API_KEY_AUTH_HEADERS.USER_ID);
  const organizationId = headers.get(API_KEY_AUTH_HEADERS.ORG_ID);

  // Required fields must be present
  if (!keyId || !userId || !organizationId) {
    return null;
  }

  return {
    authType: "api-key",
    keyId,
    userId,
    organizationId,
    userEmail: headers.get(API_KEY_AUTH_HEADERS.USER_EMAIL),
    userName: headers.get(API_KEY_AUTH_HEADERS.USER_NAME),
    organizationName: headers.get(API_KEY_AUTH_HEADERS.ORG_NAME),
  };
}

/**
 * Check if a request was authenticated via API key
 *
 * @param headers - The request headers
 * @returns true if authenticated via API key, false if via session
 */
export function isApiKeyAuthenticated(headers: Headers): boolean {
  return headers.get(API_KEY_AUTH_HEADERS.AUTH_TYPE) === "api-key";
}

// Default export for convenience
export const apiKeyAuth = {
  validateApiKey,
  validateApiKeyFromHeader,
  extractBearerToken,
  isApexApiKey,
  getActiveApiKeyCount,
  isApiKeyValid,
  getApiKeyAuthContext,
  isApiKeyAuthenticated,
  API_KEY_AUTH_HEADERS,
  API_KEY_SUPPORTED_ROUTES,
};
