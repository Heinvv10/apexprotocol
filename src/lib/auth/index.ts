// Auth exports for Apex platform (post-Plan 3 — Supabase Auth replaces Clerk)

export {
  getSession,
  requireSession,
  getOrganizationId,
  getUserId,
  getInternalUserId,
  getOrgContext,
  currentDbUser,
  SUPABASE_AUTH_CONFIGURED,
} from "./supabase-server";

/**
 * Returns members of an organization. Replaces Clerk's getOrganizationMembers()
 * — same intent: "list users in this org". Lazy-imports db so this stays
 * tree-shake-friendly for client bundles.
 */
export async function getOrganizationMembers(organizationId: string) {
  const { db } = await import("@/lib/db");
  const { users } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");
  return db.select().from(users).where(eq(users.organizationId, organizationId));
}

export type { AuthSession } from "./auth-session";

export { getUserByAuthId, getUserById, getAdminClient } from "./supabase-admin";

// API Key authentication exports
export {
  validateApiKey,
  validateApiKeyFromHeader,
  extractBearerToken,
  isApexApiKey,
  getActiveApiKeyCount,
  isApiKeyValid,
  getApiKeyAuthContext,
  isApiKeyAuthenticated,
  apiKeyAuth,
  API_KEY_AUTH_HEADERS,
  API_KEY_SUPPORTED_ROUTES,
  type ApiKeyAuthResult,
  type ApiKeyAuthFailure,
  type ApiKeyValidationResult,
  type ApiKeyContext,
} from "./api-key-auth";

// Unified auth context (session + API key)
export {
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
  apiKeyContext,
  type AuthType,
  type UnifiedAuthContext,
} from "./api-key-context";
