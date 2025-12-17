/**
 * Twitter/X OAuth 2.0 Provider
 *
 * Implements OAuth 2.0 with PKCE for Twitter/X API v2
 * Handles authorization, token exchange, profile fetching, and rate limiting
 *
 * @see https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
 */

import { TokenService, type TokenData, type OAuthAccountInfo } from "../token-service";
import { RateLimitService } from "../rate-limit-service";

// ============================================================================
// Configuration
// ============================================================================

const TWITTER_CONFIG = {
  authorizationUrl: "https://twitter.com/i/oauth2/authorize",
  tokenUrl: "https://api.twitter.com/2/oauth2/token",
  revokeUrl: "https://api.twitter.com/2/oauth2/revoke",
  apiBaseUrl: "https://api.twitter.com/2",

  // Default scopes for brand monitoring
  defaultScopes: [
    "tweet.read",
    "users.read",
    "offline.access", // Required for refresh tokens
  ],

  // Extended scopes for full functionality
  extendedScopes: [
    "tweet.read",
    "tweet.write",
    "users.read",
    "follows.read",
    "follows.write",
    "offline.access",
    "like.read",
    "list.read",
  ],
};

// ============================================================================
// Types
// ============================================================================

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  description?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  verified?: boolean;
  verified_type?: string;
  created_at?: string;
}

interface TwitterTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope: string;
  refresh_token?: string;
}

interface TwitterUserResponse {
  data: TwitterUser;
}

interface TwitterError {
  error?: string;
  error_description?: string;
  errors?: Array<{ message: string; code: number }>;
}

interface AuthorizationUrlParams {
  brandId: string;
  organizationId: string;
  scopes?: string[];
  redirectUri?: string;
}

interface AuthorizationUrlResult {
  url: string;
  state: string;
  codeVerifier: string;
}

// ============================================================================
// PKCE Helpers
// ============================================================================

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Store PKCE verifiers temporarily (in production, use Redis or DB)
const pkceStore = new Map<string, { verifier: string; expiresAt: number }>();

function cleanupPkceStore(): void {
  const now = Date.now();
  for (const [key, value] of pkceStore.entries()) {
    if (value.expiresAt < now) {
      pkceStore.delete(key);
    }
  }
}

// ============================================================================
// OAuth Flow Functions
// ============================================================================

/**
 * Generate authorization URL with PKCE
 */
export async function getAuthorizationUrl(
  params: AuthorizationUrlParams
): Promise<AuthorizationUrlResult> {
  const { brandId, organizationId, scopes, redirectUri } = params;

  const clientId = process.env.TWITTER_CLIENT_ID;
  const finalRedirectUri = redirectUri || process.env.TWITTER_REDIRECT_URI;

  if (!clientId || !finalRedirectUri) {
    throw new Error(
      "Twitter OAuth not configured: TWITTER_CLIENT_ID and TWITTER_REDIRECT_URI required"
    );
  }

  // Generate PKCE values
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Create state with brand context
  const stateData = {
    brandId,
    organizationId,
    timestamp: Date.now(),
    nonce: crypto.randomUUID(),
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");

  // Store PKCE verifier (expires in 10 minutes)
  pkceStore.set(state, {
    verifier: codeVerifier,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  // Clean up expired verifiers
  cleanupPkceStore();

  const scopeList = scopes || TWITTER_CONFIG.defaultScopes;
  const searchParams = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: finalRedirectUri,
    scope: scopeList.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return {
    url: `${TWITTER_CONFIG.authorizationUrl}?${searchParams.toString()}`,
    state,
    codeVerifier,
  };
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  state: string,
  redirectUri?: string
): Promise<TwitterTokenResponse> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const finalRedirectUri = redirectUri || process.env.TWITTER_REDIRECT_URI;

  if (!clientId || !finalRedirectUri) {
    throw new Error("Twitter OAuth not configured");
  }

  // Retrieve PKCE verifier
  const pkceData = pkceStore.get(state);
  if (!pkceData) {
    throw new Error("Invalid or expired state parameter");
  }

  if (pkceData.expiresAt < Date.now()) {
    pkceStore.delete(state);
    throw new Error("Authorization request expired");
  }

  const codeVerifier = pkceData.verifier;
  pkceStore.delete(state); // Clean up after use

  // Check rate limits
  const rateLimitStatus = await RateLimitService.checkRateLimit({ platform: "twitter", endpoint: "oauth" });
  if (!rateLimitStatus.canMakeRequest && rateLimitStatus.waitMs) {
    throw new Error(`Rate limited. Please wait ${Math.ceil(rateLimitStatus.waitMs / 1000)} seconds.`);
  }

  // Twitter uses Basic auth for token exchange when client secret is available
  const authHeader = clientSecret
    ? `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
    : undefined;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: finalRedirectUri,
    code_verifier: codeVerifier,
  });

  // If no client secret (public client), include client_id in body
  if (!clientSecret) {
    body.append("client_id", clientId);
  }

  const response = await fetch(TWITTER_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(authHeader && { Authorization: authHeader }),
    },
    body: body.toString(),
  });

  await RateLimitService.recordRequest({ platform: "twitter", endpoint: "oauth" });

  if (!response.ok) {
    const error: TwitterError = await response.json();
    await RateLimitService.recordError({ platform: "twitter", endpoint: "oauth" });
    throw new Error(
      `Twitter token exchange failed: ${error.error_description || error.error || "Unknown error"}`
    );
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TwitterTokenResponse> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId) {
    throw new Error("Twitter OAuth not configured");
  }

  const rateLimitStatus = await RateLimitService.checkRateLimit({ platform: "twitter", endpoint: "oauth" });
  if (!rateLimitStatus.canMakeRequest && rateLimitStatus.waitMs) {
    throw new Error(`Rate limited. Please wait ${Math.ceil(rateLimitStatus.waitMs / 1000)} seconds.`);
  }

  const authHeader = clientSecret
    ? `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
    : undefined;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  if (!clientSecret) {
    body.append("client_id", clientId);
  }

  const response = await fetch(TWITTER_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(authHeader && { Authorization: authHeader }),
    },
    body: body.toString(),
  });

  await RateLimitService.recordRequest({ platform: "twitter", endpoint: "oauth" });

  if (!response.ok) {
    const error: TwitterError = await response.json();
    await RateLimitService.recordError({ platform: "twitter", endpoint: "oauth" });
    throw new Error(
      `Twitter token refresh failed: ${error.error_description || error.error || "Unknown error"}`
    );
  }

  return response.json();
}

/**
 * Revoke access token
 */
export async function revokeToken(token: string): Promise<void> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId) {
    throw new Error("Twitter OAuth not configured");
  }

  const authHeader = clientSecret
    ? `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
    : undefined;

  const body = new URLSearchParams({
    token,
    token_type_hint: "access_token",
  });

  if (!clientSecret) {
    body.append("client_id", clientId);
  }

  const response = await fetch(TWITTER_CONFIG.revokeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(authHeader && { Authorization: authHeader }),
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error: TwitterError = await response.json();
    throw new Error(
      `Failed to revoke Twitter token: ${error.error_description || error.error || "Unknown error"}`
    );
  }
}

// ============================================================================
// Profile Functions
// ============================================================================

/**
 * Get authenticated user profile
 */
export async function getProfile(accessToken: string): Promise<TwitterUser> {
  const rateLimitStatus = await RateLimitService.checkRateLimit({ platform: "twitter", endpoint: "users" });
  if (!rateLimitStatus.canMakeRequest && rateLimitStatus.waitMs) {
    // Wait for rate limit to reset
    await new Promise((resolve) => setTimeout(resolve, Math.min(rateLimitStatus.waitMs!, 30000)));
  }

  const params = new URLSearchParams({
    "user.fields":
      "id,name,username,profile_image_url,description,public_metrics,verified,verified_type,created_at",
  });

  const response = await fetch(
    `${TWITTER_CONFIG.apiBaseUrl}/users/me?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  await RateLimitService.recordRequest({ platform: "twitter", endpoint: "users" });

  if (!response.ok) {
    if (response.status === 429) {
      await RateLimitService.recordError({ platform: "twitter", endpoint: "users", isRateLimitError: true });
    } else {
      await RateLimitService.recordError({ platform: "twitter", endpoint: "users" });
    }

    const error: TwitterError = await response.json();
    throw new Error(
      `Failed to fetch Twitter profile: ${error.errors?.[0]?.message || "Unknown error"}`
    );
  }

  const data: TwitterUserResponse = await response.json();
  return data.data;
}

/**
 * Get user by ID
 */
export async function getUserById(
  accessToken: string,
  userId: string
): Promise<TwitterUser> {
  const rateLimitStatus = await RateLimitService.checkRateLimit({ platform: "twitter", endpoint: "users" });
  if (!rateLimitStatus.canMakeRequest && rateLimitStatus.waitMs) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(rateLimitStatus.waitMs!, 30000)));
  }

  const params = new URLSearchParams({
    "user.fields":
      "id,name,username,profile_image_url,description,public_metrics,verified,verified_type,created_at",
  });

  const response = await fetch(
    `${TWITTER_CONFIG.apiBaseUrl}/users/${userId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  await RateLimitService.recordRequest({ platform: "twitter", endpoint: "users" });

  if (!response.ok) {
    if (response.status === 429) {
      await RateLimitService.recordError({ platform: "twitter", endpoint: "users", isRateLimitError: true });
    } else {
      await RateLimitService.recordError({ platform: "twitter", endpoint: "users" });
    }

    const error: TwitterError = await response.json();
    throw new Error(
      `Failed to fetch Twitter user: ${error.errors?.[0]?.message || "Unknown error"}`
    );
  }

  const data: TwitterUserResponse = await response.json();
  return data.data;
}

/**
 * Get user by username
 */
export async function getUserByUsername(
  accessToken: string,
  username: string
): Promise<TwitterUser> {
  const rateLimitStatus = await RateLimitService.checkRateLimit({ platform: "twitter", endpoint: "users" });
  if (!rateLimitStatus.canMakeRequest && rateLimitStatus.waitMs) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(rateLimitStatus.waitMs!, 30000)));
  }

  const params = new URLSearchParams({
    "user.fields":
      "id,name,username,profile_image_url,description,public_metrics,verified,verified_type,created_at",
  });

  const response = await fetch(
    `${TWITTER_CONFIG.apiBaseUrl}/users/by/username/${username}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  await RateLimitService.recordRequest({ platform: "twitter", endpoint: "users" });

  if (!response.ok) {
    if (response.status === 429) {
      await RateLimitService.recordError({ platform: "twitter", endpoint: "users", isRateLimitError: true });
    } else {
      await RateLimitService.recordError({ platform: "twitter", endpoint: "users" });
    }

    const error: TwitterError = await response.json();
    throw new Error(
      `Failed to fetch Twitter user: ${error.errors?.[0]?.message || "Unknown error"}`
    );
  }

  const data: TwitterUserResponse = await response.json();
  return data.data;
}

// ============================================================================
// Complete OAuth Flow
// ============================================================================

/**
 * Complete OAuth flow - exchange code, get profile, save tokens
 */
export async function completeOAuthFlow(params: {
  code: string;
  state: string;
  redirectUri?: string;
}): Promise<{
  tokens: TokenData;
  accountInfo: OAuthAccountInfo;
  profile: TwitterUser;
}> {
  const { code, state, redirectUri } = params;

  // Decode state to get brand context
  let stateData: { brandId: string; organizationId: string };
  try {
    stateData = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    throw new Error("Invalid state parameter");
  }

  const { brandId, organizationId } = stateData;

  // Exchange code for tokens
  const tokenResponse = await exchangeCodeForTokens(code, state, redirectUri);

  // Get user profile
  const profile = await getProfile(tokenResponse.access_token);

  // Build token data
  const tokens: TokenData = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    tokenType: tokenResponse.token_type,
    expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
    scopes: tokenResponse.scope.split(" "),
  };

  // Build account info
  const accountInfo: OAuthAccountInfo = {
    accountId: profile.id,
    accountName: profile.name,
    accountHandle: profile.username,
    profileUrl: `https://twitter.com/${profile.username}`,
    avatarUrl: profile.profile_image_url,
    followerCount: profile.public_metrics?.followers_count,
    followingCount: profile.public_metrics?.following_count,
  };

  // Save tokens using token service
  await TokenService.storeTokens({
    organizationId,
    brandId,
    platform: "twitter",
    tokens,
    accountInfo,
  });

  return { tokens, accountInfo, profile };
}

// ============================================================================
// Export Provider
// ============================================================================

export const TwitterProvider = {
  // Configuration
  config: TWITTER_CONFIG,

  // OAuth Flow
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
  completeOAuthFlow,

  // Profile
  getProfile,
  getUserById,
  getUserByUsername,
};

export default TwitterProvider;
