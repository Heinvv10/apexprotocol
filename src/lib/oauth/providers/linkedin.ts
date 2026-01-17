/**
 * LinkedIn OAuth Provider
 * Handles OAuth 2.0 flow and API interactions for LinkedIn
 *
 * Required scopes for our use case:
 * - openid: Required for OIDC
 * - profile: Basic profile info
 * - email: Email address
 * - w_member_social: Post on behalf of user (for future features)
 * - r_organization_social: Read organization posts (company pages)
 * - w_organization_social: Post on company pages
 * - r_organization_followers: Organization follower stats
 *
 * @see https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 */

import { TokenService, type TokenData, type OAuthAccountInfo } from "../token-service";
import { RateLimitService } from "../rate-limit-service";
import { db } from "@/lib/db";
import { apiIntegrations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { decryptConfigApiKey } from "@/lib/security";

// ============================================================================
// Configuration
// ============================================================================

const LINKEDIN_CONFIG = {
  authorizationUrl: "https://www.linkedin.com/oauth/v2/authorization",
  tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
  apiBaseUrl: "https://api.linkedin.com/v2",
  restApiBaseUrl: "https://api.linkedin.com/rest", // New REST API

  // Default scopes for brand monitoring (OIDC only - w_member_social requires additional approval)
  defaultScopes: [
    "openid",
    "profile",
    "email",
  ],

  // Scopes for company pages (requires LinkedIn Marketing Solutions Partner access)
  organizationScopes: [
    "r_organization_social",
    "w_organization_social",
    "r_organization_followers",
    "rw_organization_admin",
  ],
};

// ============================================================================
// Types
// ============================================================================

export interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  localizedHeadline?: string;
  profilePicture?: {
    displayImage: string;
  };
  vanityName?: string;
}

export interface LinkedInEmailHandle {
  emailAddress: string;
}

export interface LinkedInOrganization {
  id: number;
  localizedName: string;
  vanityName: string;
  logoV2?: {
    original: string;
  };
  localizedDescription?: string;
  websiteUrl?: string;
}

export interface LinkedInShare {
  id: string;
  author: string;
  created: {
    time: number;
  };
  commentary?: string;
  content?: {
    contentEntities?: Array<{
      entityLocation?: string;
      thumbnails?: Array<{ resolvedUrl: string }>;
    }>;
  };
  distribution?: {
    linkedInDistributionTarget?: {
      visibleToGuest: boolean;
    };
  };
  socialDetail?: {
    totalSocialActivityCounts?: {
      numLikes: number;
      numComments: number;
      numShares: number;
    };
  };
}

export interface LinkedInFollowerStats {
  organicFollowerCount: number;
  paidFollowerCount: number;
  totalFollowerCount: number;
}

// ============================================================================
// Environment Variables / Database Config
// ============================================================================

/**
 * Get LinkedIn OAuth credentials from API config database
 * Falls back to environment variables if not found in database
 */
async function getLinkedInCredentials(): Promise<{ clientId: string; clientSecret: string; redirectUri: string }> {
  // First, try to get from database (admin API config)
  try {
    const integration = await db.query.apiIntegrations.findFirst({
      where: and(
        eq(apiIntegrations.serviceName, "LinkedIn OAuth"),
        eq(apiIntegrations.isEnabled, true)
      ),
    });

    if (integration?.config) {
      const decryptedConfig = decryptConfigApiKey(integration.config);

      if (decryptedConfig.clientId && decryptedConfig.clientSecret) {
        const redirectUri = decryptedConfig.redirectUri ||
          `${process.env.NEXT_PUBLIC_APP_URL}/api/settings/oauth/linkedin/callback`;

        return {
          clientId: decryptedConfig.clientId,
          clientSecret: decryptedConfig.clientSecret,
          redirectUri,
        };
      }
    }
  } catch (error) {
    console.warn("[LinkedIn OAuth] Failed to fetch credentials from database, falling back to env vars:", error);
  }

  // Fallback to environment variables
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/settings/oauth/linkedin/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "LinkedIn OAuth credentials not configured. Please configure via Admin > API Config or set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables."
    );
  }

  return { clientId, clientSecret, redirectUri };
}

// ============================================================================
// OAuth Flow
// ============================================================================

/**
 * Generate the LinkedIn authorization URL
 */
export async function getAuthorizationUrl(params: {
  state: string; // CSRF token
  scopes?: string[];
  includeOrganizationScopes?: boolean;
  callbackPath?: string; // Override the callback path (e.g., '/api/oauth/linkedin/callback')
}): Promise<string> {
  const { clientId, redirectUri: defaultRedirectUri } = await getLinkedInCredentials();

  // Allow overriding the redirect URI path for different OAuth contexts
  let redirectUri = defaultRedirectUri;
  if (params.callbackPath) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    redirectUri = `${baseUrl}${params.callbackPath}`;
  }

  let scopes = params.scopes || LINKEDIN_CONFIG.defaultScopes;

  if (params.includeOrganizationScopes) {
    scopes = [...scopes, ...LINKEDIN_CONFIG.organizationScopes];
  }

  const url = new URL(LINKEDIN_CONFIG.authorizationUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("scope", scopes.join(" "));

  return url.toString();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  callbackPath?: string
): Promise<TokenData> {
  const { clientId, clientSecret, redirectUri: defaultRedirectUri } = await getLinkedInCredentials();

  // Allow overriding the redirect URI path for different OAuth contexts
  let redirectUri = defaultRedirectUri;
  if (callbackPath) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    redirectUri = `${baseUrl}${callbackPath}`;
  }

  const response = await fetch(LINKEDIN_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    tokenType: data.token_type || "Bearer",
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null,
    scopes: data.scope ? data.scope.split(" ") : [],
  };
}

/**
 * Refresh an expired access token
 * Note: LinkedIn tokens have very long expiry (60 days) but refresh tokens
 * can be used to get new access tokens without user interaction
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenData> {
  const { clientId, clientSecret } = await getLinkedInCredentials();

  const response = await fetch(LINKEDIN_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // LinkedIn may not rotate refresh tokens
    tokenType: data.token_type || "Bearer",
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null,
    scopes: data.scope ? data.scope.split(" ") : [],
  };
}

// ============================================================================
// API Helpers
// ============================================================================

/**
 * Make an authenticated API request to LinkedIn
 */
async function linkedInApiRequest<T>(params: {
  accessToken: string;
  endpoint: string;
  method?: "GET" | "POST" | "DELETE";
  body?: Record<string, unknown>;
  useRestApi?: boolean;
}): Promise<T> {
  const { accessToken, endpoint, method = "GET", body, useRestApi = false } = params;

  const baseUrl = useRestApi ? LINKEDIN_CONFIG.restApiBaseUrl : LINKEDIN_CONFIG.apiBaseUrl;
  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
  };

  if (method === "POST" && body) {
    headers["Content-Type"] = "application/json";
  }

  // For REST API (newer endpoints)
  if (useRestApi) {
    headers["LinkedIn-Version"] = "202312"; // Use specific API version
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Rate-limited API request wrapper
 */
async function rateLimitedRequest<T>(
  accessToken: string,
  endpoint: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  body?: Record<string, unknown>
): Promise<T> {
  const rateLimitedCall = RateLimitService.withRateLimit(
    "linkedin",
    endpoint.split("/")[1] || "default", // Use first path segment as endpoint category
    () => linkedInApiRequest<T>({ accessToken, endpoint, method, body })
  );

  const result = await rateLimitedCall();

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

// ============================================================================
// Profile API
// ============================================================================

/**
 * Get the authenticated user's profile using OpenID Connect userinfo endpoint
 * This endpoint works with openid, profile, and email scopes
 */
export async function getProfile(accessToken: string): Promise<LinkedInProfile> {
  // Use OpenID Connect userinfo endpoint
  const userinfo = await rateLimitedRequest<{
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture?: string;
    email?: string;
    locale?: string;
  }>(accessToken, "/userinfo");

  // Map OIDC fields to our LinkedInProfile format
  return {
    id: userinfo.sub,
    localizedFirstName: userinfo.given_name,
    localizedLastName: userinfo.family_name,
    localizedHeadline: undefined, // Not available in OIDC userinfo
    profilePicture: userinfo.picture ? { displayImage: userinfo.picture } : undefined,
    vanityName: undefined, // Not available in OIDC userinfo
  };
}

/**
 * Get the authenticated user's email from OpenID Connect userinfo
 */
export async function getEmail(accessToken: string): Promise<string | null> {
  try {
    const userinfo = await rateLimitedRequest<{
      email?: string;
    }>(accessToken, "/userinfo");

    return userinfo.email || null;
  } catch {
    return null;
  }
}

/**
 * Get user's profile picture URL from OpenID Connect userinfo
 */
export async function getProfilePicture(accessToken: string): Promise<string | null> {
  try {
    const userinfo = await rateLimitedRequest<{
      picture?: string;
    }>(accessToken, "/userinfo");

    return userinfo.picture || null;
  } catch {
    return null;
  }
}

// ============================================================================
// Organization API
// ============================================================================

/**
 * Get organizations the user administers
 */
export async function getAdminOrganizations(accessToken: string): Promise<LinkedInOrganization[]> {
  try {
    const response = await rateLimitedRequest<{
      elements: Array<{
        organizationalTarget: string;
        role: string;
        state: string;
      }>;
    }>(accessToken, "/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED");

    const orgIds = response.elements.map((el) => {
      // Extract org ID from URN like "urn:li:organization:123456"
      return el.organizationalTarget.replace("urn:li:organization:", "");
    });

    if (orgIds.length === 0) return [];

    // Fetch organization details
    const orgsResponse = await rateLimitedRequest<{
      results: Record<string, LinkedInOrganization>;
    }>(accessToken, `/organizations?ids=List(${orgIds.join(",")})`);

    return Object.values(orgsResponse.results || {});
  } catch {
    return [];
  }
}

/**
 * Get organization follower statistics
 */
export async function getOrganizationFollowers(
  accessToken: string,
  organizationId: string
): Promise<LinkedInFollowerStats | null> {
  try {
    const response = await rateLimitedRequest<{
      elements: Array<{
        organizationalFollowerStatistics: {
          organicFollowerCount: number;
          paidFollowerCount: number;
        };
      }>;
    }>(
      accessToken,
      `/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}`
    );

    const stats = response.elements?.[0]?.organizationalFollowerStatistics;
    if (!stats) return null;

    return {
      organicFollowerCount: stats.organicFollowerCount,
      paidFollowerCount: stats.paidFollowerCount,
      totalFollowerCount: stats.organicFollowerCount + stats.paidFollowerCount,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Posts/Shares API
// ============================================================================

/**
 * Get user's recent posts
 */
export async function getUserPosts(
  accessToken: string,
  count: number = 20
): Promise<LinkedInShare[]> {
  try {
    const profile = await getProfile(accessToken);
    const authorUrn = `urn:li:person:${profile.id}`;

    const response = await rateLimitedRequest<{
      elements: LinkedInShare[];
    }>(
      accessToken,
      `/shares?q=owners&owners=${encodeURIComponent(authorUrn)}&count=${count}&sortBy=CREATED`
    );

    return response.elements || [];
  } catch {
    return [];
  }
}

/**
 * Get organization's posts
 */
export async function getOrganizationPosts(
  accessToken: string,
  organizationId: string,
  count: number = 20
): Promise<LinkedInShare[]> {
  try {
    const orgUrn = `urn:li:organization:${organizationId}`;

    const response = await rateLimitedRequest<{
      elements: LinkedInShare[];
    }>(
      accessToken,
      `/shares?q=owners&owners=${encodeURIComponent(orgUrn)}&count=${count}&sortBy=CREATED`
    );

    return response.elements || [];
  } catch {
    return [];
  }
}

// ============================================================================
// Complete OAuth Flow Helper
// ============================================================================

/**
 * Complete OAuth callback: exchange code, fetch profile, store tokens
 */
export async function completeOAuthFlow(params: {
  code: string;
  state?: string;
  organizationId?: string;
  brandId?: string;
  callbackPath?: string; // Override callback path for token exchange
}): Promise<{
  success: boolean;
  tokens?: TokenData;
  accountInfo?: OAuthAccountInfo;
  profile?: LinkedInProfile;
  email?: string | null;
  error?: string;
}> {
  try {
    const { code, organizationId, brandId, callbackPath } = params;

    // Exchange code for tokens (pass callbackPath for redirect_uri consistency)
    const tokens = await exchangeCodeForTokens(code, callbackPath);

    // Fetch profile
    const profile = await getProfile(tokens.accessToken);
    const email = await getEmail(tokens.accessToken);
    const avatarUrl = await getProfilePicture(tokens.accessToken);

    // Build account info
    // Note: LinkedIn OIDC doesn't return vanityName, so we can't construct a profile URL
    // The member ID (sub) cannot be used in profile URLs - they require vanity names
    const accountInfo: OAuthAccountInfo = {
      accountId: profile.id,
      accountName: `${profile.localizedFirstName} ${profile.localizedLastName}`,
      accountHandle: profile.vanityName || undefined,
      profileUrl: profile.vanityName
        ? `https://linkedin.com/in/${profile.vanityName}`
        : undefined, // Don't generate broken URLs with member IDs
      avatarUrl: avatarUrl || undefined,
    };

    // Store tokens if organizationId and brandId provided
    if (organizationId && brandId) {
      await TokenService.storeTokens({
        organizationId,
        brandId,
        platform: "linkedin",
        tokens,
        accountInfo,
      });
    }

    return { success: true, tokens, accountInfo, profile, email };
  } catch (error) {
    console.error("[LinkedIn OAuth] Complete flow error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// Export Provider
// ============================================================================

export const LinkedInProvider = {
  // Configuration
  config: LINKEDIN_CONFIG,

  // OAuth Flow
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  completeOAuthFlow,

  // Profile
  getProfile,
  getEmail,
  getProfilePicture,

  // Organizations
  getAdminOrganizations,
  getOrganizationFollowers,

  // Posts
  getUserPosts,
  getOrganizationPosts,
};

export default LinkedInProvider;
