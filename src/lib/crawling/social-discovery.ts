/**
 * Social Link Discovery Patterns (Phase 7.0)
 *
 * Extracts social media profile links from website HTML.
 * Used by both brand discovery and people presence tracking.
 *
 * Supports: LinkedIn, Twitter/X, Facebook, Instagram, YouTube, TikTok, GitHub, etc.
 */

import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";

// ============================================================================
// Types
// ============================================================================

export type SocialPlatform =
  | "linkedin"
  | "twitter"
  | "facebook"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "github"
  | "pinterest"
  | "medium"
  | "reddit"
  | "discord"
  | "telegram"
  | "whatsapp"
  | "snapchat"
  | "threads"
  | "mastodon"
  | "bluesky"
  | "unknown";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  handle?: string; // @username or page name
  label?: string; // Link text or aria-label
  type?: "company" | "personal" | "unknown"; // Is this a company page or personal profile?
  confidence: number; // 0-1
}

export interface SocialExtractionResult {
  links: SocialLink[];
  foundInHeader: boolean;
  foundInFooter: boolean;
  foundInContent: boolean;
  confidence: number;
}

// ============================================================================
// Platform Detection Patterns
// ============================================================================

interface PlatformPattern {
  platform: SocialPlatform;
  hostPatterns: RegExp[];
  pathPatterns?: RegExp[];
  handleExtractor?: (url: string) => string | undefined;
  isCompanyPage?: (url: string) => boolean;
}

const PLATFORM_PATTERNS: PlatformPattern[] = [
  {
    platform: "linkedin",
    hostPatterns: [/linkedin\.com/i],
    pathPatterns: [/\/in\//, /\/company\//, /\/school\//, /\/pub\//],
    handleExtractor: (url) => {
      const match =
        url.match(/linkedin\.com\/in\/([^/?#]+)/i) ||
        url.match(/linkedin\.com\/company\/([^/?#]+)/i);
      return match?.[1];
    },
    isCompanyPage: (url) => /\/company\//i.test(url),
  },
  {
    platform: "twitter",
    hostPatterns: [/twitter\.com/i, /x\.com/i],
    handleExtractor: (url) => {
      const match = url.match(/(?:twitter\.com|x\.com)\/([^/?#]+)/i);
      const handle = match?.[1];
      // Skip non-profile paths
      if (
        handle &&
        !["intent", "share", "search", "hashtag", "i", "home"].includes(
          handle.toLowerCase()
        )
      ) {
        return handle;
      }
      return undefined;
    },
    isCompanyPage: () => false, // Twitter doesn't distinguish company vs personal
  },
  {
    platform: "facebook",
    hostPatterns: [/facebook\.com/i, /fb\.com/i],
    pathPatterns: [/^(?!\/sharer|\/share|\/dialog)/],
    handleExtractor: (url) => {
      const match = url.match(/facebook\.com\/([^/?#]+)/i);
      const handle = match?.[1];
      if (
        handle &&
        !["sharer", "share", "dialog", "plugins", "v1.0"].includes(
          handle.toLowerCase()
        )
      ) {
        return handle;
      }
      return undefined;
    },
    isCompanyPage: (url) =>
      /\/pages?\//i.test(url) || !/\/profile\.php/i.test(url),
  },
  {
    platform: "instagram",
    hostPatterns: [/instagram\.com/i],
    handleExtractor: (url) => {
      const match = url.match(/instagram\.com\/([^/?#]+)/i);
      const handle = match?.[1];
      if (
        handle &&
        !["p", "reel", "stories", "explore", "direct"].includes(
          handle.toLowerCase()
        )
      ) {
        return handle;
      }
      return undefined;
    },
  },
  {
    platform: "youtube",
    hostPatterns: [/youtube\.com/i, /youtu\.be/i],
    pathPatterns: [/\/(channel|c|user|@)/],
    handleExtractor: (url) => {
      const match =
        url.match(/youtube\.com\/@([^/?#]+)/i) ||
        url.match(/youtube\.com\/(?:channel|c|user)\/([^/?#]+)/i);
      return match?.[1];
    },
    isCompanyPage: () => true,
  },
  {
    platform: "tiktok",
    hostPatterns: [/tiktok\.com/i],
    handleExtractor: (url) => {
      const match = url.match(/tiktok\.com\/@([^/?#]+)/i);
      return match?.[1];
    },
  },
  {
    platform: "github",
    hostPatterns: [/github\.com/i],
    handleExtractor: (url) => {
      const match = url.match(/github\.com\/([^/?#]+)/i);
      const handle = match?.[1];
      if (
        handle &&
        !["orgs", "features", "pricing", "enterprise", "explore"].includes(
          handle.toLowerCase()
        )
      ) {
        return handle;
      }
      return undefined;
    },
    isCompanyPage: (url) => /\/orgs?\//i.test(url),
  },
  {
    platform: "pinterest",
    hostPatterns: [/pinterest\.com/i],
    handleExtractor: (url) => {
      const match = url.match(/pinterest\.com\/([^/?#]+)/i);
      const handle = match?.[1];
      if (handle && !["pin", "search"].includes(handle.toLowerCase())) {
        return handle;
      }
      return undefined;
    },
  },
  {
    platform: "medium",
    hostPatterns: [/medium\.com/i],
    handleExtractor: (url) => {
      const match = url.match(/medium\.com\/@([^/?#]+)/i);
      return match?.[1];
    },
  },
  {
    platform: "reddit",
    hostPatterns: [/reddit\.com/i],
    handleExtractor: (url) => {
      const match =
        url.match(/reddit\.com\/r\/([^/?#]+)/i) ||
        url.match(/reddit\.com\/user\/([^/?#]+)/i);
      return match?.[1];
    },
    isCompanyPage: (url) => /\/r\//i.test(url),
  },
  {
    platform: "discord",
    hostPatterns: [/discord\.(?:gg|com)/i],
    handleExtractor: (url) => {
      const match = url.match(/discord\.(?:gg|com\/invite)\/([^/?#]+)/i);
      return match?.[1];
    },
    isCompanyPage: () => true,
  },
  {
    platform: "telegram",
    hostPatterns: [/t\.me/i, /telegram\.(?:me|org)/i],
    handleExtractor: (url) => {
      const match = url.match(/t\.me\/([^/?#]+)/i);
      return match?.[1];
    },
  },
  {
    platform: "whatsapp",
    hostPatterns: [/wa\.me/i, /whatsapp\.com/i],
  },
  {
    platform: "threads",
    hostPatterns: [/threads\.net/i],
    handleExtractor: (url) => {
      const match = url.match(/threads\.net\/@([^/?#]+)/i);
      return match?.[1];
    },
  },
  {
    platform: "mastodon",
    hostPatterns: [/mastodon\./i, /mstdn\./i],
    handleExtractor: (url) => {
      const match = url.match(/@([^/?#]+)$/i);
      return match?.[1];
    },
  },
  {
    platform: "bluesky",
    hostPatterns: [/bsky\.app/i, /bluesky\.social/i],
    handleExtractor: (url) => {
      const match = url.match(/\/profile\/([^/?#]+)/i);
      return match?.[1];
    },
  },
];

// ============================================================================
// Selector Patterns for Finding Social Links
// ============================================================================

// Common locations for social links
const SOCIAL_CONTAINER_SELECTORS = [
  // Explicit social sections
  ".social",
  ".social-links",
  ".social-icons",
  ".social-media",
  ".social-buttons",
  "#social",
  '[class*="social"]',

  // Connect sections
  ".connect",
  ".follow-us",
  ".follow",

  // Header/Footer (common locations)
  "header",
  "footer",
  ".footer",
  ".site-footer",
  "#footer",

  // Contact sections
  ".contact",
  ".contact-info",
];

// Icon/link patterns that suggest social media
const SOCIAL_LINK_SELECTORS = [
  // SVG icons with social class
  'a:has(svg[class*="social"])',
  'a:has(svg[class*="icon"])',

  // Font Awesome icons
  'a:has(.fa-linkedin)',
  'a:has(.fa-twitter)',
  'a:has(.fa-facebook)',
  'a:has(.fa-instagram)',
  'a:has(.fa-youtube)',
  'a:has(.fa-tiktok)',
  'a:has(.fa-github)',

  // Explicit social links
  'a[href*="linkedin.com"]',
  'a[href*="twitter.com"]',
  'a[href*="x.com"]',
  'a[href*="facebook.com"]',
  'a[href*="instagram.com"]',
  'a[href*="youtube.com"]',
  'a[href*="tiktok.com"]',
  'a[href*="github.com"]',
  'a[href*="pinterest.com"]',
  'a[href*="medium.com"]',
  'a[href*="reddit.com"]',
  'a[href*="discord."]',
  'a[href*="t.me"]',
  'a[href*="wa.me"]',
  'a[href*="threads.net"]',
  'a[href*="bsky.app"]',

  // ARIA labels
  'a[aria-label*="LinkedIn"]',
  'a[aria-label*="Twitter"]',
  'a[aria-label*="Facebook"]',
  'a[aria-label*="Instagram"]',
  'a[aria-label*="YouTube"]',
  'a[aria-label*="TikTok"]',
  'a[aria-label*="GitHub"]',

  // Title attributes
  'a[title*="LinkedIn"]',
  'a[title*="Twitter"]',
  'a[title*="Facebook"]',
  'a[title*="Instagram"]',
];

// ============================================================================
// Main Extraction Function
// ============================================================================

/**
 * Extract social media links from HTML using Cheerio
 */
export function extractSocialPatterns($: CheerioAPI): SocialExtractionResult {
  const result: SocialExtractionResult = {
    links: [],
    foundInHeader: false,
    foundInFooter: false,
    foundInContent: false,
    confidence: 0,
  };

  const allLinks: SocialLink[] = [];
  const seenUrls = new Set<string>();

  // Step 1: Look in explicit social containers
  for (const containerSelector of SOCIAL_CONTAINER_SELECTORS) {
    $(containerSelector).each((_, container) => {
      const $container = $(container);
      const location = detectLocation($container);

      // Track where we found links
      if (location === "header") result.foundInHeader = true;
      if (location === "footer") result.foundInFooter = true;
      if (location === "content") result.foundInContent = true;

      // Find social links in this container
      $container.find("a[href]").each((_, link) => {
        const href = $(link).attr("href");
        if (!href || seenUrls.has(href)) return;

        const socialLink = parseSocialLink($, $(link), href);
        if (socialLink) {
          seenUrls.add(href);
          allLinks.push(socialLink);
        }
      });
    });
  }

  // Step 2: Find social links anywhere in the page
  for (const selector of SOCIAL_LINK_SELECTORS) {
    $(selector).each((_, link) => {
      const href = $(link).attr("href");
      if (!href || seenUrls.has(href)) return;

      const socialLink = parseSocialLink($, $(link), href);
      if (socialLink) {
        seenUrls.add(href);

        // Determine location
        const $link = $(link);
        if ($link.closest("header, .header").length > 0)
          result.foundInHeader = true;
        if ($link.closest("footer, .footer").length > 0)
          result.foundInFooter = true;
        if ($link.closest("main, article, .content").length > 0)
          result.foundInContent = true;

        allLinks.push(socialLink);
      }
    });
  }

  // Step 3: Deduplicate and sort by confidence
  result.links = deduplicateLinks(allLinks);

  // Step 4: Calculate overall confidence
  result.confidence = calculateOverallConfidence(result);

  return result;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse a link and extract social platform info
 */
function parseSocialLink(
  $: CheerioAPI,
  $link: Cheerio<AnyNode>,
  href: string
): SocialLink | null {
  // Normalize URL
  let url = href.trim();
  if (url.startsWith("//")) {
    url = "https:" + url;
  }

  // Skip non-social URLs
  if (!url.startsWith("http") && !url.startsWith("//")) {
    return null;
  }

  // Find matching platform
  const platform = detectPlatform(url);
  if (!platform) return null;

  // Extract handle if possible
  const patternConfig = PLATFORM_PATTERNS.find(
    (p) => p.platform === platform.platform
  );
  const handle = patternConfig?.handleExtractor?.(url);

  // Get label from link
  const label =
    $link.attr("aria-label") ||
    $link.attr("title") ||
    $link.text().trim() ||
    undefined;

  // Determine if company or personal
  const isCompany = patternConfig?.isCompanyPage?.(url);
  const type: SocialLink["type"] = isCompany === true
    ? "company"
    : isCompany === false
      ? "personal"
      : "unknown";

  // Calculate confidence
  let confidence = 0.5;

  // Boost confidence if handle was extracted
  if (handle) confidence += 0.2;

  // Boost if in footer/header (common locations)
  if ($link.closest("footer, header").length > 0) confidence += 0.15;

  // Boost if has social class
  const linkClass = $link.attr("class") || "";
  if (linkClass.includes("social")) confidence += 0.1;

  // Boost if has icon
  if ($link.find("svg, i, img").length > 0) confidence += 0.05;

  return {
    platform: platform.platform,
    url,
    handle,
    label,
    type,
    confidence: Math.min(confidence, 1),
  };
}

/**
 * Detect which social platform a URL belongs to
 */
function detectPlatform(
  url: string
): { platform: SocialPlatform } | null {
  for (const pattern of PLATFORM_PATTERNS) {
    const matchesHost = pattern.hostPatterns.some((re) => re.test(url));
    if (!matchesHost) continue;

    // Check path patterns if specified
    if (pattern.pathPatterns) {
      const matchesPath = pattern.pathPatterns.some((re) => re.test(url));
      if (!matchesPath) continue;
    }

    return { platform: pattern.platform };
  }

  return null;
}

/**
 * Detect location of element (header, footer, or content)
 */
function detectLocation(
  $el: Cheerio<AnyNode>
): "header" | "footer" | "content" {
  const parents = $el.parents();
  const parentsHtml = parents.toString().toLowerCase();

  if (
    parentsHtml.includes("header") ||
    $el.is("header") ||
    $el.hasClass("header")
  ) {
    return "header";
  }

  if (
    parentsHtml.includes("footer") ||
    $el.is("footer") ||
    $el.hasClass("footer")
  ) {
    return "footer";
  }

  return "content";
}

/**
 * Remove duplicate social links, keeping highest confidence
 */
function deduplicateLinks(links: SocialLink[]): SocialLink[] {
  const seen = new Map<string, SocialLink>();

  for (const link of links) {
    // Normalize URL for deduplication (remove trailing slashes, protocol variations)
    const normalizedUrl = link.url
      .toLowerCase()
      .replace(/\/$/, "")
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "");

    const existing = seen.get(normalizedUrl);
    if (!existing || link.confidence > existing.confidence) {
      seen.set(normalizedUrl, link);
    }
  }

  // Sort by platform priority, then confidence
  const platformPriority: Record<SocialPlatform, number> = {
    linkedin: 1,
    twitter: 2,
    facebook: 3,
    instagram: 4,
    youtube: 5,
    tiktok: 6,
    github: 7,
    medium: 8,
    pinterest: 9,
    reddit: 10,
    discord: 11,
    telegram: 12,
    whatsapp: 13,
    threads: 14,
    mastodon: 15,
    bluesky: 16,
    snapchat: 17,
    unknown: 99,
  };

  return Array.from(seen.values()).sort((a, b) => {
    const priorityDiff =
      (platformPriority[a.platform] || 99) -
      (platformPriority[b.platform] || 99);
    if (priorityDiff !== 0) return priorityDiff;
    return b.confidence - a.confidence;
  });
}

/**
 * Calculate overall extraction confidence
 */
function calculateOverallConfidence(result: SocialExtractionResult): number {
  if (result.links.length === 0) return 0;

  let confidence = 0;

  // Base confidence from average link confidence
  const avgLinkConfidence =
    result.links.reduce((sum, l) => sum + l.confidence, 0) / result.links.length;
  confidence += avgLinkConfidence * 0.5;

  // Bonus for finding in typical locations
  if (result.foundInFooter) confidence += 0.2;
  if (result.foundInHeader) confidence += 0.15;

  // Bonus for finding multiple platforms
  const uniquePlatforms = new Set(result.links.map((l) => l.platform));
  if (uniquePlatforms.size >= 3) confidence += 0.1;
  if (uniquePlatforms.size >= 5) confidence += 0.05;

  return Math.min(confidence, 1);
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get social links for a specific platform
 */
export function getSocialByPlatform(
  result: SocialExtractionResult,
  platform: SocialPlatform
): SocialLink | undefined {
  return result.links.find((l) => l.platform === platform);
}

/**
 * Get all LinkedIn links (company + personal)
 */
export function getLinkedInLinks(
  result: SocialExtractionResult
): SocialLink[] {
  return result.links.filter((l) => l.platform === "linkedin");
}

/**
 * Check if social links are present
 */
export function hasSocialLinks(result: SocialExtractionResult): boolean {
  return result.links.length > 0;
}

/**
 * Get handles as a simple map
 */
export function getSocialHandles(
  result: SocialExtractionResult
): Record<SocialPlatform, string | undefined> {
  const handles: Partial<Record<SocialPlatform, string>> = {};
  for (const link of result.links) {
    if (link.handle && !handles[link.platform]) {
      handles[link.platform] = link.handle;
    }
  }
  return handles as Record<SocialPlatform, string | undefined>;
}
