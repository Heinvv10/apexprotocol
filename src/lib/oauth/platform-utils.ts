/**
 * Platform Utilities
 *
 * Helper functions and types for managing social platform connections
 */

import { socialPlatformEnum } from "@/lib/db/schema";

// ============================================================================
// Types
// ============================================================================

// All social platforms supported in the database
export type AllSocialPlatform = (typeof socialPlatformEnum.enumValues)[number];

// Platforms with OAuth integration implemented
export type ImplementedOAuthPlatform = "linkedin" | "twitter";

// Connection status for a platform
export interface OAuthConnectionStatus {
  platform: AllSocialPlatform;
  isConnected: boolean;
  accountId?: string;
  accountName?: string;
  accountHandle?: string;
  profileUrl?: string;
  avatarUrl?: string;
  connectedAt?: Date;
  expiresAt?: Date | null;
  status: "active" | "expired" | "revoked" | "error" | "pending" | "not_connected";
  needsReconnect: boolean;
}

// Platform metadata
export interface PlatformInfo {
  displayName: string;
  color: string;
  icon?: string;
  description: string;
  oauthSupported: boolean;
  apiSupported: boolean;
  scopes?: string[];
}

// ============================================================================
// Platform Metadata
// ============================================================================

export const PLATFORM_INFO: Record<AllSocialPlatform, PlatformInfo> = {
  linkedin: {
    displayName: "LinkedIn",
    color: "#0A66C2",
    icon: "linkedin",
    description: "Professional networking and B2B engagement",
    oauthSupported: true,
    apiSupported: true,
    scopes: ["openid", "profile", "email", "w_member_social"],
  },
  twitter: {
    displayName: "Twitter / X",
    color: "#1DA1F2",
    icon: "twitter",
    description: "Real-time conversations and brand mentions",
    oauthSupported: true,
    apiSupported: true,
    scopes: ["tweet.read", "users.read", "offline.access"],
  },
  instagram: {
    displayName: "Instagram",
    color: "#E4405F",
    icon: "instagram",
    description: "Visual content and engagement tracking",
    oauthSupported: false, // Requires Facebook Business integration
    apiSupported: true,
  },
  facebook: {
    displayName: "Facebook",
    color: "#1877F2",
    icon: "facebook",
    description: "Page management and audience insights",
    oauthSupported: false, // Coming soon
    apiSupported: true,
  },
  youtube: {
    displayName: "YouTube",
    color: "#FF0000",
    icon: "youtube",
    description: "Video content and channel analytics",
    oauthSupported: false, // Coming soon
    apiSupported: true,
  },
  tiktok: {
    displayName: "TikTok",
    color: "#000000",
    icon: "tiktok",
    description: "Short-form video and trending content",
    oauthSupported: false, // Coming soon
    apiSupported: true,
  },
  pinterest: {
    displayName: "Pinterest",
    color: "#BD081C",
    icon: "pinterest",
    description: "Visual discovery and inspiration",
    oauthSupported: false,
    apiSupported: false,
  },
  github: {
    displayName: "GitHub",
    color: "#181717",
    icon: "github",
    description: "Developer community and open source",
    oauthSupported: false,
    apiSupported: true,
  },
  medium: {
    displayName: "Medium",
    color: "#000000",
    icon: "medium",
    description: "Long-form content and thought leadership",
    oauthSupported: false,
    apiSupported: false,
  },
  reddit: {
    displayName: "Reddit",
    color: "#FF4500",
    icon: "reddit",
    description: "Community discussions and brand mentions",
    oauthSupported: false,
    apiSupported: true,
  },
  discord: {
    displayName: "Discord",
    color: "#5865F2",
    icon: "discord",
    description: "Community management and engagement",
    oauthSupported: false,
    apiSupported: false,
  },
  threads: {
    displayName: "Threads",
    color: "#000000",
    icon: "threads",
    description: "Text-based conversations",
    oauthSupported: false,
    apiSupported: false,
  },
  bluesky: {
    displayName: "Bluesky",
    color: "#0085FF",
    icon: "bluesky",
    description: "Decentralized social networking",
    oauthSupported: false,
    apiSupported: true,
  },
  mastodon: {
    displayName: "Mastodon",
    color: "#6364FF",
    icon: "mastodon",
    description: "Decentralized social networking",
    oauthSupported: false,
    apiSupported: true,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all social platforms supported in the database
 */
export function getAllSupportedPlatforms(): AllSocialPlatform[] {
  return socialPlatformEnum.enumValues as unknown as AllSocialPlatform[];
}

/**
 * Get platforms with OAuth integration implemented
 */
export function getImplementedPlatforms(): ImplementedOAuthPlatform[] {
  return ["linkedin", "twitter"];
}

/**
 * Check if a platform has OAuth implemented
 */
export function isPlatformImplemented(platform: string): platform is ImplementedOAuthPlatform {
  return getImplementedPlatforms().includes(platform as ImplementedOAuthPlatform);
}

/**
 * Check if a platform supports OAuth (even if not implemented yet)
 */
export function supportsOAuth(platform: string): boolean {
  const info = PLATFORM_INFO[platform as AllSocialPlatform];
  return info?.oauthSupported ?? false;
}

/**
 * Check if a platform has API support
 */
export function supportsApi(platform: string): boolean {
  const info = PLATFORM_INFO[platform as AllSocialPlatform];
  return info?.apiSupported ?? false;
}

/**
 * Get display name for a platform
 */
export function getPlatformDisplayName(platform: AllSocialPlatform): string {
  return PLATFORM_INFO[platform]?.displayName ?? platform;
}

/**
 * Get brand color for a platform
 */
export function getPlatformColor(platform: AllSocialPlatform): string {
  return PLATFORM_INFO[platform]?.color ?? "#6B7280";
}

/**
 * Get icon name for a platform
 */
export function getPlatformIcon(platform: AllSocialPlatform): string {
  return PLATFORM_INFO[platform]?.icon ?? "globe";
}

/**
 * Get full platform info
 */
export function getPlatformInfo(platform: AllSocialPlatform): PlatformInfo {
  return PLATFORM_INFO[platform];
}

/**
 * Get connection info for a platform (for UI display)
 */
export function getPlatformConnectionInfo(platform: AllSocialPlatform): {
  displayName: string;
  description: string;
  isImplemented: boolean;
  comingSoon: boolean;
} {
  const info = PLATFORM_INFO[platform];
  const isImplemented = isPlatformImplemented(platform);

  return {
    displayName: info?.displayName ?? platform,
    description: info?.description ?? "Social platform",
    isImplemented,
    comingSoon: info?.oauthSupported && !isImplemented,
  };
}

/**
 * Validate a platform string
 */
export function isValidPlatform(platform: string): platform is AllSocialPlatform {
  return getAllSupportedPlatforms().includes(platform as AllSocialPlatform);
}

/**
 * Get platforms grouped by implementation status
 */
export function getPlatformsGrouped(): {
  implemented: AllSocialPlatform[];
  comingSoon: AllSocialPlatform[];
  notSupported: AllSocialPlatform[];
} {
  const all = getAllSupportedPlatforms();
  const implemented: AllSocialPlatform[] = [];
  const comingSoon: AllSocialPlatform[] = [];
  const notSupported: AllSocialPlatform[] = [];

  for (const platform of all) {
    if (isPlatformImplemented(platform)) {
      implemented.push(platform);
    } else if (supportsOAuth(platform)) {
      comingSoon.push(platform);
    } else {
      notSupported.push(platform);
    }
  }

  return { implemented, comingSoon, notSupported };
}
