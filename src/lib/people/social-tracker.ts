/**
 * People Social Profile Tracker (Phase 7.2)
 *
 * Tracks and enriches social media profiles for brand people/leadership.
 * Fetches follower counts, engagement metrics, and profile data from
 * various social platforms.
 */

import type {
  BrandPerson,
  PersonSocialProfiles,
} from "@/lib/db/schema";

// ============================================================================
// Types
// ============================================================================

export interface SocialProfileUpdate {
  platform: keyof PersonSocialProfiles;
  url: string;
  handle?: string;
  followers?: number;
  lastUpdated: string;
}

export interface EnrichmentResult {
  personId: string;
  updatedProfiles: PersonSocialProfiles;
  totalFollowers: number;
  linkedinFollowers?: number;
  twitterFollowers?: number;
  errors: string[];
}

export interface ProfileMetrics {
  followers: number;
  following?: number;
  posts?: number;
  engagement?: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Patterns for extracting social URLs */
const SOCIAL_URL_PATTERNS: Record<keyof PersonSocialProfiles, RegExp[]> = {
  linkedin: [
    /linkedin\.com\/in\/([a-zA-Z0-9-]+)/i,
    /linkedin\.com\/pub\/([a-zA-Z0-9-]+)/i,
  ],
  twitter: [
    /twitter\.com\/([a-zA-Z0-9_]+)/i,
    /x\.com\/([a-zA-Z0-9_]+)/i,
  ],
  instagram: [/instagram\.com\/([a-zA-Z0-9_.]+)/i],
  youtube: [
    /youtube\.com\/(@[a-zA-Z0-9_-]+)/i,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/i,
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/i,
  ],
  tiktok: [/tiktok\.com\/@([a-zA-Z0-9_.]+)/i],
  github: [/github\.com\/([a-zA-Z0-9-]+)/i],
  medium: [
    /medium\.com\/@([a-zA-Z0-9_.]+)/i,
    /([a-zA-Z0-9-]+)\.medium\.com/i,
  ],
  personalWebsite: [/.+/], // Any URL
};

// ============================================================================
// Social Profile Extraction
// ============================================================================

/**
 * Extract handle from a social URL
 */
export function extractHandleFromUrl(
  url: string,
  platform: keyof PersonSocialProfiles
): string | null {
  const patterns = SOCIAL_URL_PATTERNS[platform];
  if (!patterns) return null;

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Detect platform from URL
 */
export function detectPlatformFromUrl(url: string): keyof PersonSocialProfiles | null {
  const urlLower = url.toLowerCase();

  if (urlLower.includes("linkedin.com")) return "linkedin";
  if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) return "twitter";
  if (urlLower.includes("instagram.com")) return "instagram";
  if (urlLower.includes("youtube.com")) return "youtube";
  if (urlLower.includes("tiktok.com")) return "tiktok";
  if (urlLower.includes("github.com")) return "github";
  if (urlLower.includes("medium.com")) return "medium";

  return null;
}

/**
 * Normalize a social URL to a consistent format
 */
export function normalizeSocialUrl(
  url: string,
  platform: keyof PersonSocialProfiles
): string {
  // Ensure URL has protocol
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);

    // Normalize to HTTPS
    parsed.protocol = "https:";

    // Remove trailing slashes
    let normalized = parsed.toString().replace(/\/+$/, "");

    // Specific normalizations
    if (platform === "twitter") {
      normalized = normalized.replace("twitter.com", "x.com");
    }

    return normalized;
  } catch {
    return url;
  }
}

// ============================================================================
// Profile Enrichment (API-based - placeholder implementations)
// ============================================================================

/**
 * Fetch LinkedIn profile metrics
 * Note: Requires LinkedIn API access or scraping service
 */
async function fetchLinkedInMetrics(url: string): Promise<ProfileMetrics | null> {
  // TODO: Implement with LinkedIn API or scraping service
  // LinkedIn's API is restrictive - may need proxy service
  // For now, return placeholder
  const handle = extractHandleFromUrl(url, "linkedin");
  if (!handle) return null;

  // Placeholder - in production, use API
  return {
    followers: 0, // Would be fetched from API
  };
}

/**
 * Fetch Twitter/X profile metrics
 * Note: Requires X API v2 access
 */
async function fetchTwitterMetrics(url: string): Promise<ProfileMetrics | null> {
  // TODO: Implement with X API v2
  // Requires elevated API access for follower counts
  const handle = extractHandleFromUrl(url, "twitter");
  if (!handle) return null;

  // Placeholder - in production, use X API
  return {
    followers: 0, // Would be fetched from API
  };
}

/**
 * Fetch GitHub profile metrics
 */
async function fetchGitHubMetrics(url: string): Promise<ProfileMetrics | null> {
  const handle = extractHandleFromUrl(url, "github");
  if (!handle) return null;

  try {
    // GitHub's public API doesn't require authentication for basic user data
    const response = await fetch(`https://api.github.com/users/${handle}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "ApexBot/1.0",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      followers: data.followers || 0,
      following: data.following || 0,
      posts: data.public_repos || 0,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Main Enrichment Functions
// ============================================================================

/**
 * Enrich a person's social profiles with metrics
 */
export async function enrichPersonSocialProfiles(
  person: BrandPerson
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    personId: person.id,
    updatedProfiles: { ...(person.socialProfiles || {}) },
    totalFollowers: 0,
    errors: [],
  };

  const now = new Date().toISOString();

  // LinkedIn enrichment
  if (person.linkedinUrl) {
    try {
      const metrics = await fetchLinkedInMetrics(person.linkedinUrl);
      if (metrics) {
        result.updatedProfiles.linkedin = {
          url: person.linkedinUrl,
          handle: extractHandleFromUrl(person.linkedinUrl, "linkedin") || undefined,
          followers: metrics.followers,
          lastUpdated: now,
        };
        result.linkedinFollowers = metrics.followers;
        result.totalFollowers += metrics.followers;
      }
    } catch (error) {
      result.errors.push(`LinkedIn: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Twitter enrichment
  if (person.twitterUrl) {
    try {
      const metrics = await fetchTwitterMetrics(person.twitterUrl);
      if (metrics) {
        result.updatedProfiles.twitter = {
          url: person.twitterUrl,
          handle: extractHandleFromUrl(person.twitterUrl, "twitter") || undefined,
          followers: metrics.followers,
          lastUpdated: now,
        };
        result.twitterFollowers = metrics.followers;
        result.totalFollowers += metrics.followers;
      }
    } catch (error) {
      result.errors.push(`Twitter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // GitHub enrichment (this one actually works with public API)
  if (result.updatedProfiles.github?.url) {
    try {
      const metrics = await fetchGitHubMetrics(result.updatedProfiles.github.url);
      if (metrics) {
        result.updatedProfiles.github = {
          ...result.updatedProfiles.github,
          followers: metrics.followers,
          lastUpdated: now,
        };
        result.totalFollowers += metrics.followers;
      }
    } catch (error) {
      result.errors.push(`GitHub: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Sum up followers from all platforms
  const profiles = result.updatedProfiles;
  result.totalFollowers =
    (profiles.linkedin?.followers || 0) +
    (profiles.twitter?.followers || 0) +
    (profiles.instagram?.followers || 0) +
    (profiles.youtube?.subscribers || 0) +
    (profiles.tiktok?.followers || 0) +
    (profiles.github?.followers || 0) +
    (profiles.medium?.followers || 0);

  return result;
}

/**
 * Batch enrich multiple people's social profiles
 */
export async function batchEnrichSocialProfiles(
  people: BrandPerson[],
  options: { concurrency?: number } = {}
): Promise<EnrichmentResult[]> {
  const { concurrency = 3 } = options;
  const results: EnrichmentResult[] = [];

  // Process in batches to avoid rate limits
  for (let i = 0; i < people.length; i += concurrency) {
    const batch = people.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((person) => enrichPersonSocialProfiles(person))
    );
    results.push(...batchResults);

    // Rate limiting delay between batches
    if (i + concurrency < people.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// ============================================================================
// Social Score Calculation
// ============================================================================

/**
 * Calculate a person's social reach score (0-100)
 */
export function calculateSocialReachScore(person: BrandPerson): number {
  const totalFollowers = person.totalSocialFollowers || 0;

  // Logarithmic scale with caps
  // 100 followers = ~20 score
  // 1,000 followers = ~40 score
  // 10,000 followers = ~60 score
  // 100,000 followers = ~80 score
  // 1,000,000 followers = ~100 score

  if (totalFollowers === 0) return 0;
  if (totalFollowers >= 1_000_000) return 100;

  const score = Math.log10(totalFollowers) * 16.67; // ~100 at 1M
  return Math.min(Math.round(score), 100);
}

/**
 * Calculate platform diversity score (0-100)
 * Higher score for presence on multiple platforms
 */
export function calculatePlatformDiversityScore(
  profiles: PersonSocialProfiles
): number {
  const platformCount = Object.values(profiles).filter(
    (p) => p && p.url
  ).length;

  // Score based on platform count
  // 1 platform = 20
  // 2 platforms = 40
  // 3 platforms = 60
  // 4 platforms = 80
  // 5+ platforms = 100

  return Math.min(platformCount * 20, 100);
}

/**
 * Check if any profiles need refreshing (older than threshold)
 */
export function profilesNeedRefresh(
  profiles: PersonSocialProfiles,
  maxAgeMs: number = 7 * 24 * 60 * 60 * 1000 // 7 days default
): boolean {
  const now = Date.now();

  for (const profile of Object.values(profiles)) {
    if (!profile?.lastUpdated) return true;

    const lastUpdated = new Date(profile.lastUpdated).getTime();
    if (now - lastUpdated > maxAgeMs) return true;
  }

  return false;
}
