/**
 * TikTok OAuth Provider
 * Handles TikTok Login Kit OAuth 2.0 and Content Posting API
 *
 * Required scopes:
 * - user.info.basic: Basic user info
 * - user.info.profile: Detailed profile
 * - user.info.stats: Follower/following counts
 * - video.list: List user's videos
 * - video.publish: Publish videos (requires additional approval)
 *
 * @see https://developers.tiktok.com/doc/login-kit-web
 * @see https://developers.tiktok.com/doc/content-posting-api-get-started
 */

import { TokenService, type TokenData, type OAuthAccountInfo } from "../token-service";
import { RateLimitService } from "../rate-limit-service";

// ============================================================================
// Configuration
// ============================================================================

const TIKTOK_CONFIG = {
  authorizationUrl: "https://www.tiktok.com/v2/auth/authorize",
  tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
  revokeUrl: "https://open.tiktokapis.com/v2/oauth/revoke/",
  apiBaseUrl: "https://open.tiktokapis.com/v2",

  // Default scopes for monitoring
  defaultScopes: [
    "user.info.basic",
    "user.info.profile",
    "user.info.stats",
    "video.list",
  ],

  // Extended scopes for publishing (requires TikTok approval)
  extendedScopes: [
    "user.info.basic",
    "user.info.profile",
    "user.info.stats",
    "video.list",
    "video.publish",
  ],
};

// ============================================================================
// Types
// ============================================================================

interface TikTokUser {
  open_id: string;
  union_id?: string;
  avatar_url?: string;
  avatar_url_100?: string;
  avatar_large_url?: string;
  display_name?: string;
  bio_description?: string;
  profile_deep_link?: string;
  is_verified?: boolean;
  username?: string;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
}

interface TikTokUserResponse {
  data: {
    user: TikTokUser;
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

interface TikTokVideo {
  id: string;
  title?: string;
  video_description?: string;
  create_time: number;
  cover_image_url?: string;
  share_url?: string;
  duration?: number;
  height?: number;
  width?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
}

interface TikTokVideosResponse {
  data: {
    videos: TikTokVideo[];
    cursor: number;
    has_more: boolean;
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

interface TikTokTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token: string;
  refresh_expires_in: number;
  open_id: string;
}

interface TikTokError {
  error: string;
  error_description?: string;
  log_id?: string;
}

interface AuthorizationUrlParams {
  brandId: string;
  organizationId: string;
  scopes?: string[];
  redirectUri?: string;
  includePublish?: boolean;
  returnUrl?: string;
}

interface AuthorizationUrlResult {
  url: string;
  state: string;
  codeVerifier: string;
}

// ============================================================================
// PKCE Helpers (TikTok requires PKCE)
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

// Store PKCE verifiers temporarily
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
// Environment Configuration
// ============================================================================

function getTikTokCredentials(): {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
} {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri =
    process.env.TIKTOK_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/tiktok/callback`;

  if (!clientKey || !clientSecret) {
    throw new Error(
      "TikTok OAuth not configured: TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET required"
    );
  }

  return { clientKey, clientSecret, redirectUri };
}

// ============================================================================
// OAuth Flow Functions
// ============================================================================

/**
 * Generate authorization URL for TikTok OAuth with PKCE
 */
export async function getAuthorizationUrl(
  params: AuthorizationUrlParams
): Promise<AuthorizationUrlResult> {
  const { brandId, organizationId, scopes, redirectUri, includePublish, returnUrl } = params;

  const { clientKey, redirectUri: defaultRedirectUri } = getTikTokCredentials();
  const finalRedirectUri = redirectUri || defaultRedirectUri;

  // Generate PKCE values
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Create state with context
  const stateData = {
    brandId,
    organizationId,
    returnUrl,
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

  // Determine scopes
  const scopeList = scopes || (includePublish ? TIKTOK_CONFIG.extendedScopes : TIKTOK_CONFIG.defaultScopes);

  const searchParams = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: finalRedirectUri,
    response_type: "code",
    scope: scopeList.join(","),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return {
    url: `${TIKTOK_CONFIG.authorizationUrl}?${searchParams.toString()}`,
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
): Promise<TikTokTokenResponse> {
  const { clientKey, clientSecret, redirectUri: defaultRedirectUri } = getTikTokCredentials();
  const finalRedirectUri = redirectUri || defaultRedirectUri;

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
  const rateLimitStatus = await RateLimitService.checkRateLimit({
    platform: "tiktok",
    endpoint: "oauth",
  });
  if (!rateLimitStatus.canMakeRequest && rateLimitStatus.waitMs) {
    throw new Error(
      `Rate limited. Please wait ${Math.ceil(rateLimitStatus.waitMs / 1000)} seconds.`
    );
  }

  const response = await fetch(TIKTOK_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: finalRedirectUri,
      code_verifier: codeVerifier,
    }),
  });

  await RateLimitService.recordRequest({ platform: "tiktok", endpoint: "oauth" });

  if (!response.ok) {
    const error: TikTokError = await response.json();
    await RateLimitService.recordError({ platform: "tiktok", endpoint: "oauth" });
    throw new Error(
      `TikTok token exchange failed: ${error.error_description || error.error || "Unknown error"}`
    );
  }

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TikTokTokenResponse> {
  const { clientKey, clientSecret } = getTikTokCredentials();

  const rateLimitStatus = await RateLimitService.checkRateLimit({
    platform: "tiktok",
    endpoint: "oauth",
  });
  if (!rateLimitStatus.canMakeRequest && rateLimitStatus.waitMs) {
    throw new Error(
      `Rate limited. Please wait ${Math.ceil(rateLimitStatus.waitMs / 1000)} seconds.`
    );
  }

  const response = await fetch(TIKTOK_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  await RateLimitService.recordRequest({ platform: "tiktok", endpoint: "oauth" });

  if (!response.ok) {
    const error: TikTokError = await response.json();
    await RateLimitService.recordError({ platform: "tiktok", endpoint: "oauth" });
    throw new Error(
      `TikTok token refresh failed: ${error.error_description || error.error || "Unknown error"}`
    );
  }

  return response.json();
}

/**
 * Revoke access token
 */
export async function revokeToken(token: string): Promise<void> {
  const { clientKey, clientSecret } = getTikTokCredentials();

  const response = await fetch(TIKTOK_CONFIG.revokeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      token,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to revoke TikTok token: ${error}`);
  }
}

// ============================================================================
// API Helper Functions
// ============================================================================

async function tiktokApiRequest<T>(params: {
  accessToken: string;
  endpoint: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
}): Promise<T> {
  const { accessToken, endpoint, method = "GET", body } = params;

  const url = `${TIKTOK_CONFIG.apiBaseUrl}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  if (method === "POST" && body) {
    options.headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `TikTok API error: ${error.error?.message || JSON.stringify(error)}`
    );
  }

  return response.json();
}

async function rateLimitedRequest<T>(
  accessToken: string,
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>
): Promise<T> {
  const rateLimitStatus = await RateLimitService.checkRateLimit({
    platform: "tiktok",
    endpoint: "api",
  });

  if (!rateLimitStatus.canMakeRequest && rateLimitStatus.waitMs) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(rateLimitStatus.waitMs!, 30000))
    );
  }

  try {
    const result = await tiktokApiRequest<T>({ accessToken, endpoint, method, body });
    await RateLimitService.recordRequest({ platform: "tiktok", endpoint: "api" });
    return result;
  } catch (error) {
    await RateLimitService.recordError({ platform: "tiktok", endpoint: "api" });
    throw error;
  }
}

// ============================================================================
// Profile API
// ============================================================================

/**
 * Get user profile
 */
export async function getProfile(accessToken: string): Promise<TikTokUser> {
  const fields = [
    "open_id",
    "union_id",
    "avatar_url",
    "avatar_url_100",
    "avatar_large_url",
    "display_name",
    "bio_description",
    "profile_deep_link",
    "is_verified",
    "username",
    "follower_count",
    "following_count",
    "likes_count",
    "video_count",
  ].join(",");

  const response = await rateLimitedRequest<TikTokUserResponse>(
    accessToken,
    `/user/info/?fields=${fields}`
  );

  if (response.error?.code !== "ok" && response.error?.code) {
    throw new Error(`TikTok API error: ${response.error.message}`);
  }

  return response.data.user;
}

/**
 * Get user's videos
 */
export async function getUserVideos(params: {
  accessToken: string;
  maxCount?: number;
  cursor?: number;
}): Promise<TikTokVideosResponse> {
  const { accessToken, maxCount = 20, cursor } = params;

  const fields = [
    "id",
    "title",
    "video_description",
    "create_time",
    "cover_image_url",
    "share_url",
    "duration",
    "like_count",
    "comment_count",
    "share_count",
    "view_count",
  ].join(",");

  let endpoint = `/video/list/?fields=${fields}&max_count=${maxCount}`;
  if (cursor) {
    endpoint += `&cursor=${cursor}`;
  }

  return rateLimitedRequest<TikTokVideosResponse>(accessToken, endpoint, "POST");
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
  profile: TikTokUser;
}> {
  const { code, state, redirectUri } = params;

  // Decode state to get context
  let stateData: { brandId: string; organizationId: string; returnUrl?: string };
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
    scopes: tokenResponse.scope.split(","),
  };

  // Build account info
  const accountInfo: OAuthAccountInfo = {
    accountId: profile.open_id,
    accountName: profile.display_name || profile.username,
    accountHandle: profile.username,
    profileUrl: profile.profile_deep_link || `https://tiktok.com/@${profile.username}`,
    avatarUrl: profile.avatar_large_url || profile.avatar_url,
    followerCount: profile.follower_count,
    followingCount: profile.following_count,
  };

  // Save tokens using token service
  await TokenService.storeTokens({
    organizationId,
    brandId,
    platform: "tiktok",
    tokens,
    accountInfo,
  });

  return { tokens, accountInfo, profile };
}

// ============================================================================
// Export Provider
// ============================================================================

export const TikTokProvider = {
  // Configuration
  config: TIKTOK_CONFIG,

  // OAuth Flow
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
  completeOAuthFlow,

  // Profile
  getProfile,

  // Videos
  getUserVideos,
};

export default TikTokProvider;
