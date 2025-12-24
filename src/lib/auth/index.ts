// Auth exports for Apex platform

export {
  auth,
  currentUser,
  clerkClient,
  getSession,
  getCurrentUserWithOrg,
  hasOrgRole,
  isOrgAdmin,
  isOrgMember,
  getUserOrganizations,
  getOrganization,
  getOrganizationMembers,
  extractUserData,
  extractOrgData,
  getOrganizationId,
  getUserId,
  requireAuth,
  type AuthSession,
  type ClerkUserData,
  type ClerkOrgData,
} from "./clerk";

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

// API Key context helpers (unified auth context for API routes)
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
