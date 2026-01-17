/**
 * OAuth Providers Index
 *
 * Exports all OAuth provider implementations for social platforms
 */

// LinkedIn OAuth Provider
export { LinkedInProvider } from "./linkedin";

// Twitter/X OAuth Provider
export { TwitterProvider } from "./twitter";

// Facebook OAuth Provider (also handles Instagram via Meta API)
export { FacebookProvider } from "./facebook";

// YouTube OAuth Provider (Google OAuth)
export { YouTubeProvider } from "./youtube";

// TikTok OAuth Provider
export { TikTokProvider } from "./tiktok";

// Provider factory for dynamic access
export type SupportedOAuthPlatform = "linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "tiktok";

import { LinkedInProvider } from "./linkedin";
import { TwitterProvider } from "./twitter";
import { FacebookProvider } from "./facebook";
import { YouTubeProvider } from "./youtube";
import { TikTokProvider } from "./tiktok";

export function getOAuthProvider(platform: SupportedOAuthPlatform) {
  switch (platform) {
    case "linkedin":
      return LinkedInProvider;
    case "twitter":
      return TwitterProvider;
    case "facebook":
      return FacebookProvider;
    case "instagram":
      // Instagram uses Facebook OAuth (Meta API)
      return FacebookProvider;
    case "youtube":
      return YouTubeProvider;
    case "tiktok":
      return TikTokProvider;
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
    case "facebook":
    case "instagram":
      // Instagram uses Facebook OAuth
      return !!(
        process.env.FACEBOOK_APP_ID &&
        process.env.FACEBOOK_APP_SECRET
      );
    case "youtube":
      return !!(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET
      );
    case "tiktok":
      return !!(
        process.env.TIKTOK_CLIENT_KEY &&
        process.env.TIKTOK_CLIENT_SECRET
      );
    default:
      return false;
  }
}

// Get all configured providers
export function getConfiguredProviders(): SupportedOAuthPlatform[] {
  const platforms: SupportedOAuthPlatform[] = ["linkedin", "twitter", "facebook", "instagram", "youtube", "tiktok"];
  return platforms.filter((p) => isOAuthConfigured(p));
}
