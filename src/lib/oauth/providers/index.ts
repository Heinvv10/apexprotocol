/**
 * OAuth Providers Index
 *
 * Exports all OAuth provider implementations for social platforms
 */

// LinkedIn OAuth Provider
export { LinkedInProvider } from "./linkedin";

// Twitter/X OAuth Provider
export { TwitterProvider } from "./twitter";

// Provider factory for dynamic access
export type SupportedOAuthPlatform = "linkedin" | "twitter";

import { LinkedInProvider } from "./linkedin";
import { TwitterProvider } from "./twitter";

export function getOAuthProvider(platform: SupportedOAuthPlatform) {
  switch (platform) {
    case "linkedin":
      return LinkedInProvider;
    case "twitter":
      return TwitterProvider;
    default:
      throw new Error(`OAuth provider not available for platform: ${platform}`);
  }
}

// Check if OAuth is configured for a platform
export function isOAuthConfigured(platform: SupportedOAuthPlatform): boolean {
  switch (platform) {
    case "linkedin":
      return !!(
        process.env.LINKEDIN_CLIENT_ID &&
        process.env.LINKEDIN_CLIENT_SECRET &&
        process.env.LINKEDIN_REDIRECT_URI
      );
    case "twitter":
      return !!(
        process.env.TWITTER_CLIENT_ID && process.env.TWITTER_REDIRECT_URI
      );
    default:
      return false;
  }
}

// Get all configured providers
export function getConfiguredProviders(): SupportedOAuthPlatform[] {
  const platforms: SupportedOAuthPlatform[] = ["linkedin", "twitter"];
  return platforms.filter((p) => isOAuthConfigured(p));
}
