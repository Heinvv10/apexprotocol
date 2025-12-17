/**
 * OAuth Module
 *
 * Complete OAuth 2.0 implementation for social platform integrations
 *
 * Components:
 * - Token Service: Secure token storage with AES-256-GCM encryption
 * - Rate Limit Service: Platform-specific rate limiting with backoff
 * - Sync Service: Background job management for data synchronization
 * - Providers: Platform-specific OAuth implementations (LinkedIn, Twitter)
 *
 * Usage:
 * ```typescript
 * import { LinkedInProvider, TwitterProvider, TokenService } from '@/lib/oauth';
 *
 * // Start OAuth flow
 * const { url, state } = await LinkedInProvider.getAuthorizationUrl({
 *   brandId,
 *   organizationId
 * });
 *
 * // Complete OAuth flow (in callback)
 * const result = await LinkedInProvider.completeOAuthFlow({ code, state });
 *
 * // Get tokens for API calls
 * const tokens = await TokenService.getTokens(brandId, 'linkedin');
 * ```
 */

// Token Management
export {
  TokenService,
  encryptToken,
  decryptToken,
  isTokenExpired,
  type SocialPlatform,
  type TokenData,
  type OAuthAccountInfo,
  type StoredToken,
} from "./token-service";

// Rate Limiting
export {
  RateLimitService,
  PLATFORM_RATE_LIMITS,
  withRateLimit,
} from "./rate-limit-service";

// Background Sync Jobs
export { SyncService } from "./sync-service";

// Platform Utilities
export {
  PLATFORM_INFO,
  getAllSupportedPlatforms,
  getImplementedPlatforms,
  isPlatformImplemented,
  supportsOAuth,
  supportsApi,
  getPlatformDisplayName,
  getPlatformColor,
  getPlatformIcon,
  getPlatformInfo,
  getPlatformConnectionInfo,
  isValidPlatform,
  getPlatformsGrouped,
  type AllSocialPlatform,
  type ImplementedOAuthPlatform,
} from "./platform-utils";

// OAuth Providers
export {
  // LinkedIn
  LinkedInProvider,
  // Twitter
  TwitterProvider,
  // Utilities
  getOAuthProvider,
  isOAuthConfigured,
  getConfiguredProviders,
  type SupportedOAuthPlatform,
} from "./providers";
