/**
 * YouTube OAuth Provider
 * Handles Google OAuth 2.0 for YouTube Data API v3
 *
 * Required scopes:
 * - youtube.readonly: Read channel info, videos, playlists
 * - youtube.upload: Upload videos
 * - youtube.force-ssl: Required for all YouTube Data API requests
 * - yt-analytics.readonly: Read analytics
 *
 * @see https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps
 * @see https://developers.google.com/identity/protocols/oauth2/web-server
 */

import { TokenService, type TokenData, type OAuthAccountInfo } from "../token-service";
import { RateLimitService } from "../rate-limit-service";

// ============================================================================
// Configuration
// ============================================================================

const YOUTUBE_CONFIG = {
  authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  revokeUrl: "https://oauth2.googleapis.com/revoke",
  apiBaseUrl: "https://www.googleapis.com/youtube/v3",
  userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",

  // Default scopes for YouTube
  defaultScopes: [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ],

  // Extended scopes for full functionality (including uploads)
  extendedScopes: [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
};

// ============================================================================
// Types
// ============================================================================

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
    };
    country?: string;
  };
  statistics?: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
  contentDetails?: {
    relatedPlaylists?: {
      likes?: string;
      uploads?: string;
    };
  };
}

interface YouTubeChannelsResponse {
  kind: string;
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeChannel[];
}

interface YouTubeVideo {
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    channelTitle: string;
    categoryId: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

interface YouTubeVideosResponse {
  kind: string;
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeVideo[];
  nextPageToken?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
  id_token?: string;
}

interface GoogleError {
  error?: string;
  error_description?: string;
}

interface AuthorizationUrlParams {
  brandId: string;
  organizationId: string;
  scopes?: string[];
  redirectUri?: string;
  includeUploads?: boolean;
  returnUrl?: string;
}

interface AuthorizationUrlResult {
  url: string;
  state: string;
}

// ============================================================================
// Environment Configuration
// ============================================================================

function getYouTubeCredentials(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/youtube/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "YouTube OAuth not configured: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required"
    );
  }

  return { clientId, clientSecret, redirectUri };
}

// ============================================================================
// OAuth Flow Functions
// ============================================================================

/**
 * Generate authorization URL for Google OAuth
 */
export async function getAuthorizationUrl(
  params: AuthorizationUrlParams
): Promise<AuthorizationUrlResult> {
  const { brandId, organizationId, scopes, redirectUri, includeUploads, returnUrl } = params;

  const { clientId, redirectUri: defaultRedirectUri } = getYouTubeCredentials();
  const finalRedirectUri = redirectUri || defaultRedirectUri;

  // Create state with context
  const stateData = {
    brandId,
    organizationId,
    returnUrl,
    timestamp: Date.now(),
    nonce: crypto.randomUUID(),
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");

  // Determine scopes
  const scopeList = scopes || (includeUploads ? YOUTUBE_CONFIG.extendedScopes : YOUTUBE_CONFIG.defaultScopes);

  const searchParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: finalRedirectUri,
    response_type: "code",
    scope: scopeList.join(" "),
    access_type: "offline", // Request refresh token
    prompt: "consent", // Force consent to get refresh token
    state,
  });

  return {
    url: `${YOUTUBE_CONFIG.authorizationUrl}?${searchParams.toString()}`,
    state,
  };
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri?: string
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, redirectUri: defaultRedirectUri } = getYouTubeCredentials();
  const finalRedirectUri = redirectUri || defaultRedirectUri;

  // Check rate limits
  const rateLimitStatus = await RateLimitService.checkRateLimit({
    platform: "youtube",
    endpoint: "oauth",
  });
  if (!rateLimitStatus.canMakeRequest && rateLimitStatus.waitMs) {
    throw new Error(
      `Rate limited. Please wait ${Math.ceil(rateLimitStatus.waitMs / 1000)} seconds.`
    );
  }

  const response = await fetch(YOUTUBE_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: finalRedirectUri,
      grant_type: "authorization_code",
    }),
  });

  await RateLimitService.recordRequest({ platform: "youtube", endpoint: "oauth" });

  if (!response.ok) {
    const error: GoogleError = await response.json();
    await RateLimitService.recordError({ platform: "youtube", endpoint: "oauth" });
    throw new Error(
      `Google token exchange failed: ${error.error_description || error.error || "Unknown error"}`
    );
  }

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = getYouTubeCredentials();

  const rateLimitStatus = await RateLimitService.checkRateLimit({
    platform: "youtube",
    endpoint: "oauth",
  });
  if (!rateLimitStatus.canMakeRequest && rateLimitStatus.waitMs) {
    throw new Error(
      `Rate limited. Please wait ${Math.ceil(rateLimitStatus.waitMs / 1000)} seconds.`
    );
  }

  const response = await fetch(YOUTUBE_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  await RateLimitService.recordRequest({ platform: "youtube", endpoint: "oauth" });

  if (!response.ok) {
    const error: GoogleError = await response.json();
    await RateLimitService.recordError({ platform: "youtube", endpoint: "oauth" });
    throw new Error(
      `Google token refresh failed: ${error.error_description || error.error || "Unknown error"}`
    );
  }

  return response.json();
}

/**
 * Revoke access token
 */
export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(
    `${YOUTUBE_CONFIG.revokeUrl}?token=${encodeURIComponent(token)}`,
    { method: "POST" }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to revoke Google token: ${error}`);
  }
}

// ============================================================================
// API Helper Functions
// ============================================================================

async function googleApiRequest<T>(params: {
  accessToken: string;
  url: string;
  method?: "GET" | "POST" | "DELETE";
  body?: Record<string, unknown>;
}): Promise<T> {
  const { accessToken, url, method = "GET", body } = params;

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
      `Google API error: ${error.error?.message || JSON.stringify(error)}`
    );
  }

  return response.json();
}

async function rateLimitedRequest<T>(
  accessToken: string,
  url: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  body?: Record<string, unknown>
): Promise<T> {
  const rateLimitStatus = await RateLimitService.checkRateLimit({
    platform: "youtube",
    endpoint: "api",
  });

  if (!rateLimitStatus.canMakeRequest && rateLimitStatus.waitMs) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(rateLimitStatus.waitMs!, 30000))
    );
  }

  try {
    const result = await googleApiRequest<T>({ accessToken, url, method, body });
    await RateLimitService.recordRequest({ platform: "youtube", endpoint: "api" });
    return result;
  } catch (error) {
    await RateLimitService.recordError({ platform: "youtube", endpoint: "api" });
    throw error;
  }
}

// ============================================================================
// Profile & Channel API
// ============================================================================

/**
 * Get Google user info
 */
export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  return rateLimitedRequest<GoogleUserInfo>(
    accessToken,
    YOUTUBE_CONFIG.userInfoUrl
  );
}

/**
 * Get authenticated user's YouTube channel
 */
export async function getMyChannel(accessToken: string): Promise<YouTubeChannel | null> {
  const response = await rateLimitedRequest<YouTubeChannelsResponse>(
    accessToken,
    `${YOUTUBE_CONFIG.apiBaseUrl}/channels?part=snippet,statistics,contentDetails&mine=true`
  );

  return response.items?.[0] || null;
}

/**
 * Get channel by ID
 */
export async function getChannelById(
  accessToken: string,
  channelId: string
): Promise<YouTubeChannel | null> {
  const response = await rateLimitedRequest<YouTubeChannelsResponse>(
    accessToken,
    `${YOUTUBE_CONFIG.apiBaseUrl}/channels?part=snippet,statistics,contentDetails&id=${channelId}`
  );

  return response.items?.[0] || null;
}

/**
 * Get channel's recent videos
 */
export async function getChannelVideos(params: {
  accessToken: string;
  channelId: string;
  maxResults?: number;
  pageToken?: string;
}): Promise<YouTubeVideosResponse> {
  const { accessToken, channelId, maxResults = 10, pageToken } = params;

  let url = `${YOUTUBE_CONFIG.apiBaseUrl}/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${maxResults}`;
  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  return rateLimitedRequest<YouTubeVideosResponse>(accessToken, url);
}

/**
 * Get video details by ID
 */
export async function getVideoById(
  accessToken: string,
  videoId: string
): Promise<YouTubeVideo | null> {
  const response = await rateLimitedRequest<YouTubeVideosResponse>(
    accessToken,
    `${YOUTUBE_CONFIG.apiBaseUrl}/videos?part=snippet,statistics&id=${videoId}`
  );

  return response.items?.[0] || null;
}

// ============================================================================
// Complete OAuth Flow
// ============================================================================

/**
 * Complete OAuth flow - exchange code, get profile, get channel, save tokens
 */
export async function completeOAuthFlow(params: {
  code: string;
  state: string;
  redirectUri?: string;
}): Promise<{
  tokens: TokenData;
  accountInfo: OAuthAccountInfo;
  userInfo: GoogleUserInfo;
  channel: YouTubeChannel | null;
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
  const tokenResponse = await exchangeCodeForTokens(code, redirectUri);

  // Get user info
  const userInfo = await getUserInfo(tokenResponse.access_token);

  // Get YouTube channel
  const channel = await getMyChannel(tokenResponse.access_token);

  // Build token data
  const tokens: TokenData = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    tokenType: tokenResponse.token_type,
    expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
    scopes: tokenResponse.scope.split(" "),
  };

  // Build account info - prefer channel info if available
  const accountInfo: OAuthAccountInfo = {
    accountId: channel?.id || userInfo.id,
    accountName: channel?.snippet?.title || userInfo.name,
    accountHandle: channel?.snippet?.customUrl?.replace("@", "") || undefined,
    profileUrl: channel
      ? `https://youtube.com/channel/${channel.id}`
      : undefined,
    avatarUrl:
      channel?.snippet?.thumbnails?.high?.url ||
      channel?.snippet?.thumbnails?.default?.url ||
      userInfo.picture,
    followerCount: channel?.statistics?.subscriberCount
      ? parseInt(channel.statistics.subscriberCount, 10)
      : undefined,
  };

  // Save tokens using token service
  await TokenService.storeTokens({
    organizationId,
    brandId,
    platform: "youtube",
    tokens,
    accountInfo,
  });

  return { tokens, accountInfo, userInfo, channel };
}

// ============================================================================
// Export Provider
// ============================================================================

export const YouTubeProvider = {
  // Configuration
  config: YOUTUBE_CONFIG,

  // OAuth Flow
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
  completeOAuthFlow,

  // Profile & Channel
  getUserInfo,
  getMyChannel,
  getChannelById,

  // Videos
  getChannelVideos,
  getVideoById,
};

export default YouTubeProvider;
