/**
 * Facebook/Meta OAuth Provider
 * Handles OAuth 2.0 for Facebook Pages and Instagram Business accounts
 *
 * Facebook Graph API v18.0
 * Instagram is accessed through Facebook Business integration
 *
 * Required scopes:
 * - pages_manage_posts: Publish and manage Facebook Page posts
 * - pages_read_engagement: Read Page engagement data
 * - pages_read_user_content: Read user content on Pages
 * - pages_show_list: Show list of Pages user manages
 * - instagram_basic: Basic Instagram account info
 * - instagram_content_publish: Publish to Instagram
 * - instagram_manage_insights: Read Instagram insights
 *
 * @see https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
 * @see https://developers.facebook.com/docs/instagram-api/overview
 */

import { TokenService, type TokenData, type OAuthAccountInfo } from "../token-service";
import { RateLimitService } from "../rate-limit-service";

// ============================================================================
// Configuration
// ============================================================================

const FACEBOOK_CONFIG = {
  authorizationUrl: "https://www.facebook.com/v18.0/dialog/oauth",
  tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
  apiBaseUrl: "https://graph.facebook.com/v18.0",

  // Default scopes for Facebook Pages
  defaultScopes: [
    "pages_show_list",
    "pages_read_engagement",
    "pages_read_user_content",
    "pages_manage_posts",
    "public_profile",
  ],

  // Extended scopes including Instagram
  extendedScopes: [
    "pages_show_list",
    "pages_read_engagement",
    "pages_read_user_content",
    "pages_manage_posts",
    "public_profile",
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_insights",
  ],
};

// ============================================================================
// Types
// ============================================================================

interface FacebookUser {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
      width: number;
      height: number;
    };
  };
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  picture?: {
    data: {
      url: string;
    };
  };
  fan_count?: number;
  followers_count?: number;
  instagram_business_account?: {
    id: string;
  };
}

interface FacebookPagesResponse {
  data: FacebookPage[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

interface InstagramAccount {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface FacebookError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

interface AuthorizationUrlParams {
  brandId: string;
  organizationId: string;
  scopes?: string[];
  redirectUri?: string;
  includeInstagram?: boolean;
  returnUrl?: string;
}

interface AuthorizationUrlResult {
  url: string;
  state: string;
}

// ============================================================================
// Environment Configuration
// ============================================================================

function getFacebookCredentials(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri =
    process.env.FACEBOOK_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/facebook/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Facebook OAuth not configured: FACEBOOK_APP_ID and FACEBOOK_APP_SECRET required"
    );
  }

  return { clientId, clientSecret, redirectUri };
}

// ============================================================================
// OAuth Flow Functions
// ============================================================================

/**
 * Generate authorization URL for Facebook OAuth
 */
export async function getAuthorizationUrl(
  params: AuthorizationUrlParams
): Promise<AuthorizationUrlResult> {
  const { brandId, organizationId, scopes, redirectUri, includeInstagram, returnUrl } = params;

  const { clientId, redirectUri: defaultRedirectUri } = getFacebookCredentials();
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
  const scopeList = scopes || (includeInstagram ? FACEBOOK_CONFIG.extendedScopes : FACEBOOK_CONFIG.defaultScopes);

  const searchParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: finalRedirectUri,
    scope: scopeList.join(","),
    response_type: "code",
    state,
  });

  return {
    url: `${FACEBOOK_CONFIG.authorizationUrl}?${searchParams.toString()}`,
    state,
  };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri?: string
): Promise<FacebookTokenResponse> {
  const { clientId, clientSecret, redirectUri: defaultRedirectUri } = getFacebookCredentials();
  const finalRedirectUri = redirectUri || defaultRedirectUri;

  // Check rate limits
  const rateLimitStatus = await RateLimitService.checkRateLimit({
    platform: "facebook",
    endpoint: "oauth",
  });
  if (!rateLimitStatus.canMakeRequest && rateLimitStatus.waitMs) {
    throw new Error(
      `Rate limited. Please wait ${Math.ceil(rateLimitStatus.waitMs / 1000)} seconds.`
    );
  }

  const searchParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: finalRedirectUri,
    code,
  });

  const response = await fetch(
    `${FACEBOOK_CONFIG.tokenUrl}?${searchParams.toString()}`
  );

  await RateLimitService.recordRequest({ platform: "facebook", endpoint: "oauth" });

  if (!response.ok) {
    const error: FacebookError = await response.json();
    await RateLimitService.recordError({ platform: "facebook", endpoint: "oauth" });
    throw new Error(
      `Facebook token exchange failed: ${error.error?.message || "Unknown error"}`
    );
  }

  return response.json();
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
export async function getLongLivedToken(
  shortLivedToken: string
): Promise<FacebookTokenResponse> {
  const { clientId, clientSecret } = getFacebookCredentials();

  const searchParams = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(
    `${FACEBOOK_CONFIG.tokenUrl}?${searchParams.toString()}`
  );

  await RateLimitService.recordRequest({ platform: "facebook", endpoint: "oauth" });

  if (!response.ok) {
    const error: FacebookError = await response.json();
    throw new Error(
      `Failed to get long-lived token: ${error.error?.message || "Unknown error"}`
    );
  }

  return response.json();
}

// ============================================================================
// API Helper Functions
// ============================================================================

async function facebookApiRequest<T>(params: {
  accessToken: string;
  endpoint: string;
  method?: "GET" | "POST" | "DELETE";
  body?: Record<string, unknown>;
}): Promise<T> {
  const { accessToken, endpoint, method = "GET", body } = params;

  const url = new URL(`${FACEBOOK_CONFIG.apiBaseUrl}${endpoint}`);
  url.searchParams.set("access_token", accessToken);

  const options: RequestInit = { method };

  if (method === "POST" && body) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), options);

  if (!response.ok) {
    const error: FacebookError = await response.json();
    throw new Error(
      `Facebook API error: ${error.error?.message || "Unknown error"}`
    );
  }

  return response.json();
}

async function rateLimitedRequest<T>(
  accessToken: string,
  endpoint: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  body?: Record<string, unknown>
): Promise<T> {
  const endpointCategory = endpoint.split("/")[1] || "default";

  const rateLimitStatus = await RateLimitService.checkRateLimit({
    platform: "facebook",
    endpoint: endpointCategory,
  });

  if (!rateLimitStatus.canMakeRequest && rateLimitStatus.waitMs) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(rateLimitStatus.waitMs!, 30000))
    );
  }

  try {
    const result = await facebookApiRequest<T>({ accessToken, endpoint, method, body });
    await RateLimitService.recordRequest({ platform: "facebook", endpoint: endpointCategory });
    return result;
  } catch (error) {
    await RateLimitService.recordError({ platform: "facebook", endpoint: endpointCategory });
    throw error;
  }
}

// ============================================================================
// Profile & Pages API
// ============================================================================

/**
 * Get authenticated user profile
 */
export async function getProfile(accessToken: string): Promise<FacebookUser> {
  return rateLimitedRequest<FacebookUser>(
    accessToken,
    "/me?fields=id,name,email,picture.type(large)"
  );
}

/**
 * Get Pages managed by the user
 */
export async function getManagedPages(accessToken: string): Promise<FacebookPage[]> {
  const response = await rateLimitedRequest<FacebookPagesResponse>(
    accessToken,
    "/me/accounts?fields=id,name,access_token,category,picture,fan_count,followers_count,instagram_business_account"
  );

  return response.data || [];
}

/**
 * Get Page details by ID
 */
export async function getPageById(
  accessToken: string,
  pageId: string
): Promise<FacebookPage> {
  return rateLimitedRequest<FacebookPage>(
    accessToken,
    `/${pageId}?fields=id,name,access_token,category,picture,fan_count,followers_count,instagram_business_account`
  );
}

/**
 * Get Instagram Business account connected to a Page
 */
export async function getInstagramAccount(
  pageAccessToken: string,
  instagramBusinessAccountId: string
): Promise<InstagramAccount> {
  return rateLimitedRequest<InstagramAccount>(
    pageAccessToken,
    `/${instagramBusinessAccountId}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count`
  );
}

// ============================================================================
// Posting API
// ============================================================================

/**
 * Publish a post to a Facebook Page
 */
export async function publishPagePost(params: {
  pageAccessToken: string;
  pageId: string;
  message: string;
  link?: string;
}): Promise<{ id: string }> {
  const { pageAccessToken, pageId, message, link } = params;

  const body: Record<string, unknown> = { message };
  if (link) {
    body.link = link;
  }

  return rateLimitedRequest<{ id: string }>(
    pageAccessToken,
    `/${pageId}/feed`,
    "POST",
    body
  );
}

/**
 * Publish a photo post to a Facebook Page
 */
export async function publishPagePhoto(params: {
  pageAccessToken: string;
  pageId: string;
  url: string;
  caption?: string;
}): Promise<{ id: string; post_id: string }> {
  const { pageAccessToken, pageId, url, caption } = params;

  const body: Record<string, unknown> = { url };
  if (caption) {
    body.caption = caption;
  }

  return rateLimitedRequest<{ id: string; post_id: string }>(
    pageAccessToken,
    `/${pageId}/photos`,
    "POST",
    body
  );
}

/**
 * Publish a media post to Instagram Business account
 * Two-step process: 1) Create media container, 2) Publish container
 */
export async function publishInstagramMedia(params: {
  pageAccessToken: string;
  instagramAccountId: string;
  imageUrl: string;
  caption?: string;
}): Promise<{ id: string }> {
  const { pageAccessToken, instagramAccountId, imageUrl, caption } = params;

  // Step 1: Create media container
  const containerBody: Record<string, unknown> = {
    image_url: imageUrl,
  };
  if (caption) {
    containerBody.caption = caption;
  }

  const container = await rateLimitedRequest<{ id: string }>(
    pageAccessToken,
    `/${instagramAccountId}/media`,
    "POST",
    containerBody
  );

  // Step 2: Publish the container
  const published = await rateLimitedRequest<{ id: string }>(
    pageAccessToken,
    `/${instagramAccountId}/media_publish`,
    "POST",
    { creation_id: container.id }
  );

  return published;
}

// ============================================================================
// Complete OAuth Flow
// ============================================================================

/**
 * Complete OAuth flow - exchange code, get long-lived token, get profile
 */
export async function completeOAuthFlow(params: {
  code: string;
  state: string;
  redirectUri?: string;
}): Promise<{
  tokens: TokenData;
  accountInfo: OAuthAccountInfo;
  profile: FacebookUser;
  pages: FacebookPage[];
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

  // Exchange code for short-lived token
  const shortLivedToken = await exchangeCodeForTokens(code, redirectUri);

  // Exchange for long-lived token (60 days)
  const longLivedToken = await getLongLivedToken(shortLivedToken.access_token);

  // Get user profile
  const profile = await getProfile(longLivedToken.access_token);

  // Get managed pages
  const pages = await getManagedPages(longLivedToken.access_token);

  // Build token data
  const tokens: TokenData = {
    accessToken: longLivedToken.access_token,
    refreshToken: null, // Facebook doesn't use refresh tokens - reauth before expiry
    tokenType: longLivedToken.token_type || "Bearer",
    expiresAt: longLivedToken.expires_in
      ? new Date(Date.now() + longLivedToken.expires_in * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Default 60 days
    scopes: FACEBOOK_CONFIG.defaultScopes,
  };

  // Build account info
  const accountInfo: OAuthAccountInfo = {
    accountId: profile.id,
    accountName: profile.name,
    accountHandle: undefined, // Facebook users don't have handles like @username
    profileUrl: `https://facebook.com/${profile.id}`,
    avatarUrl: profile.picture?.data?.url,
  };

  // Save tokens using token service
  await TokenService.storeTokens({
    organizationId,
    brandId,
    platform: "facebook",
    tokens,
    accountInfo,
  });

  return { tokens, accountInfo, profile, pages };
}

/**
 * Store Page access token (used after selecting which Page to manage)
 */
export async function storePageConnection(params: {
  organizationId: string;
  brandId: string;
  page: FacebookPage;
}): Promise<void> {
  const { organizationId, brandId, page } = params;

  const tokens: TokenData = {
    accessToken: page.access_token,
    refreshToken: null,
    tokenType: "Bearer",
    expiresAt: null, // Page tokens don't expire when exchanged from long-lived user token
    scopes: FACEBOOK_CONFIG.defaultScopes,
  };

  const accountInfo: OAuthAccountInfo = {
    accountId: page.id,
    accountName: page.name,
    accountHandle: undefined,
    profileUrl: `https://facebook.com/${page.id}`,
    avatarUrl: page.picture?.data?.url,
    followerCount: page.followers_count || page.fan_count,
  };

  await TokenService.storeTokens({
    organizationId,
    brandId,
    platform: "facebook",
    tokens,
    accountInfo,
  });
}

/**
 * Store Instagram connection (requires Page with linked IG account)
 */
export async function storeInstagramConnection(params: {
  organizationId: string;
  brandId: string;
  pageAccessToken: string;
  instagramAccount: InstagramAccount;
}): Promise<void> {
  const { organizationId, brandId, pageAccessToken, instagramAccount } = params;

  const tokens: TokenData = {
    accessToken: pageAccessToken,
    refreshToken: null,
    tokenType: "Bearer",
    expiresAt: null,
    scopes: FACEBOOK_CONFIG.extendedScopes,
  };

  const accountInfo: OAuthAccountInfo = {
    accountId: instagramAccount.id,
    accountName: instagramAccount.name || instagramAccount.username,
    accountHandle: instagramAccount.username,
    profileUrl: `https://instagram.com/${instagramAccount.username}`,
    avatarUrl: instagramAccount.profile_picture_url,
    followerCount: instagramAccount.followers_count,
    followingCount: instagramAccount.follows_count,
  };

  await TokenService.storeTokens({
    organizationId,
    brandId,
    platform: "instagram",
    tokens,
    accountInfo,
  });
}

// ============================================================================
// Export Provider
// ============================================================================

export const FacebookProvider = {
  // Configuration
  config: FACEBOOK_CONFIG,

  // OAuth Flow
  getAuthorizationUrl,
  exchangeCodeForTokens,
  getLongLivedToken,
  completeOAuthFlow,

  // Profile & Pages
  getProfile,
  getManagedPages,
  getPageById,
  getInstagramAccount,

  // Store connections
  storePageConnection,
  storeInstagramConnection,

  // Publishing
  publishPagePost,
  publishPagePhoto,
  publishInstagramMedia,
};

export default FacebookProvider;
