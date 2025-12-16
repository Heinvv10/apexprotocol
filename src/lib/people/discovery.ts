/**
 * People/Leadership Discovery Module (Phase 7.2)
 *
 * Auto-discovers team members and leadership from brand websites using
 * the Cheerio-based extraction module (Phase 7.0).
 *
 * Workflow:
 * 1. Fetch about/team/leadership pages using existing crawler
 * 2. Extract team data using Cheerio extractor
 * 3. Enrich with social profile data
 * 4. Optionally refine with AI classification
 */

import { createExtractor, extractTeamFromHtml, extractSocialsFromHtml } from "@/lib/crawling";
import type { TeamMember, SocialLink } from "@/lib/crawling";
import type {
  NewBrandPerson,
  PersonSocialProfiles,
  PersonExtractionMetadata,
} from "@/lib/db/schema";

// ============================================================================
// Types
// ============================================================================

export interface DiscoveryOptions {
  /** Base URL of the brand website */
  baseUrl: string;
  /** Brand ID to associate discovered people with */
  brandId: string;
  /** Whether to use AI to refine extraction */
  useAiRefinement?: boolean;
  /** Maximum pages to crawl */
  maxPages?: number;
  /** Custom page paths to try */
  customPaths?: string[];
}

export interface DiscoveredPerson {
  /** Extracted name */
  name: string;
  /** Job title/position */
  title?: string;
  /** Role category classification */
  roleCategory?: "c_suite" | "founder" | "board" | "key_employee" | "ambassador" | "advisor" | "investor";
  /** Biography text */
  bio?: string;
  /** Photo URL */
  photoUrl?: string;
  /** LinkedIn profile URL */
  linkedinUrl?: string;
  /** Twitter profile URL */
  twitterUrl?: string;
  /** Other social profiles */
  socialProfiles?: PersonSocialProfiles;
  /** Confidence score (0-1) */
  confidence: number;
  /** Source URL where person was found */
  sourceUrl: string;
}

export interface DiscoveryResult {
  /** List of discovered people */
  people: DiscoveredPerson[];
  /** URLs that were crawled */
  crawledUrls: string[];
  /** Total pages found with team content */
  pagesWithTeam: number;
  /** Overall discovery confidence */
  confidence: number;
  /** Any errors encountered */
  errors: string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Common paths where team/leadership info is found */
const TEAM_PAGE_PATHS = [
  "/about",
  "/about-us",
  "/about/team",
  "/about/leadership",
  "/team",
  "/our-team",
  "/leadership",
  "/management",
  "/people",
  "/company",
  "/company/team",
  "/company/leadership",
  "/meet-the-team",
  "/who-we-are",
  "/founders",
  "/executive-team",
  "/board",
  "/board-of-directors",
  "/advisors",
];

/** Role keywords for classification */
const ROLE_KEYWORDS: Record<string, string[]> = {
  c_suite: [
    "ceo", "chief executive", "cfo", "chief financial", "cto", "chief technology",
    "cmo", "chief marketing", "coo", "chief operating", "cpo", "chief product",
    "cio", "chief information", "chief", "president", "managing director",
  ],
  founder: [
    "founder", "co-founder", "cofounder", "founding", "started",
  ],
  board: [
    "board", "director", "chairman", "chairwoman", "non-executive",
  ],
  advisor: [
    "advisor", "adviser", "advisory", "consultant",
  ],
  investor: [
    "investor", "partner", "venture", "angel",
  ],
  key_employee: [
    "vp", "vice president", "head of", "director of", "lead", "senior", "manager",
  ],
};

// ============================================================================
// Main Discovery Function
// ============================================================================

/**
 * Discover people from a brand's website
 *
 * @example
 * const result = await discoverPeopleFromWebsite({
 *   baseUrl: "https://example.com",
 *   brandId: "brand_123",
 *   useAiRefinement: false,
 * });
 * console.log(result.people);
 */
export async function discoverPeopleFromWebsite(
  options: DiscoveryOptions
): Promise<DiscoveryResult> {
  const {
    baseUrl,
    brandId,
    useAiRefinement = false,
    maxPages = 5,
    customPaths = [],
  } = options;

  const result: DiscoveryResult = {
    people: [],
    crawledUrls: [],
    pagesWithTeam: 0,
    confidence: 0,
    errors: [],
  };

  // Normalize base URL
  const normalizedBase = normalizeUrl(baseUrl);
  if (!normalizedBase) {
    result.errors.push(`Invalid base URL: ${baseUrl}`);
    return result;
  }

  // Build list of URLs to try
  const pathsToTry = [...new Set([...customPaths, ...TEAM_PAGE_PATHS])];
  const urlsToTry = pathsToTry.map((path) => `${normalizedBase}${path}`);

  // Also try the base URL itself (might have team section)
  urlsToTry.unshift(normalizedBase);

  // Crawl pages and extract team data
  const allPeople: DiscoveredPerson[] = [];
  let pagesCrawled = 0;

  for (const url of urlsToTry) {
    if (pagesCrawled >= maxPages) break;

    try {
      const html = await fetchPage(url);
      if (!html) continue;

      pagesCrawled++;
      result.crawledUrls.push(url);

      // Extract team members using Cheerio
      const extractor = createExtractor(html);
      const teamResult = extractor.extractTeamMembers();
      const socialResult = extractor.extractSocialLinks();

      if (teamResult.members.length > 0) {
        result.pagesWithTeam++;

        // Convert to DiscoveredPerson format
        const people = teamResult.members.map((member) =>
          convertTeamMember(member, socialResult.links, url)
        );
        allPeople.push(...people);
      }
    } catch (error) {
      result.errors.push(`Error crawling ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Deduplicate people by name
  result.people = deduplicatePeople(allPeople);

  // Classify roles
  result.people = result.people.map(classifyRole);

  // Calculate overall confidence
  result.confidence = calculateDiscoveryConfidence(result);

  // Optionally refine with AI
  if (useAiRefinement && result.people.length > 0) {
    try {
      result.people = await refineWithAI(result.people, brandId);
    } catch (error) {
      result.errors.push(`AI refinement failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return result;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize a URL to consistent format
 */
function normalizeUrl(url: string): string | null {
  try {
    // Add protocol if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    const parsed = new URL(url);
    // Return base URL without trailing slash
    return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, "");
  } catch {
    return null;
  }
}

/**
 * Fetch a page's HTML content
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ApexBot/1.0 (People Discovery)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Convert TeamMember to DiscoveredPerson
 */
function convertTeamMember(
  member: TeamMember,
  socialLinks: SocialLink[],
  sourceUrl: string
): DiscoveredPerson {
  const person: DiscoveredPerson = {
    name: member.name,
    title: member.title || member.role,
    bio: member.bio,
    photoUrl: member.photo,
    linkedinUrl: member.linkedin,
    twitterUrl: member.twitter,
    confidence: member.confidence,
    sourceUrl,
    socialProfiles: {},
  };

  // Match social links to this person by checking if the link text/handle contains their name
  const nameParts = member.name.toLowerCase().split(/\s+/);
  const lastName = nameParts[nameParts.length - 1];
  const firstName = nameParts[0];

  for (const link of socialLinks) {
    // Check if this social link might belong to this person
    const handleLower = (link.handle || "").toLowerCase();
    const urlLower = link.url.toLowerCase();

    const mightBelongToPerson =
      handleLower.includes(lastName) ||
      handleLower.includes(firstName) ||
      urlLower.includes(lastName) ||
      urlLower.includes(firstName.replace(/[^a-z]/g, ""));

    if (mightBelongToPerson && link.type === "personal") {
      switch (link.platform) {
        case "linkedin":
          if (!person.linkedinUrl) {
            person.linkedinUrl = link.url;
            person.socialProfiles!.linkedin = {
              url: link.url,
              handle: link.handle,
            };
          }
          break;
        case "twitter":
          if (!person.twitterUrl) {
            person.twitterUrl = link.url;
            person.socialProfiles!.twitter = {
              url: link.url,
              handle: link.handle,
            };
          }
          break;
        case "github":
          person.socialProfiles!.github = {
            url: link.url,
            handle: link.handle,
          };
          break;
        case "instagram":
          person.socialProfiles!.instagram = {
            url: link.url,
            handle: link.handle,
          };
          break;
        case "youtube":
          person.socialProfiles!.youtube = {
            url: link.url,
            handle: link.handle,
          };
          break;
      }
    }
  }

  return person;
}

/**
 * Deduplicate people by name (keep highest confidence)
 */
function deduplicatePeople(people: DiscoveredPerson[]): DiscoveredPerson[] {
  const byName = new Map<string, DiscoveredPerson>();

  for (const person of people) {
    const key = person.name.toLowerCase().trim();
    const existing = byName.get(key);

    if (!existing || person.confidence > existing.confidence) {
      // Merge data from existing if available
      if (existing) {
        person.title = person.title || existing.title;
        person.bio = person.bio || existing.bio;
        person.photoUrl = person.photoUrl || existing.photoUrl;
        person.linkedinUrl = person.linkedinUrl || existing.linkedinUrl;
        person.twitterUrl = person.twitterUrl || existing.twitterUrl;
        person.socialProfiles = {
          ...existing.socialProfiles,
          ...person.socialProfiles,
        };
      }
      byName.set(key, person);
    }
  }

  return Array.from(byName.values());
}

/**
 * Classify a person's role based on their title
 */
function classifyRole(person: DiscoveredPerson): DiscoveredPerson {
  if (!person.title) return person;

  const titleLower = person.title.toLowerCase();

  // Check each role category
  for (const [category, keywords] of Object.entries(ROLE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        person.roleCategory = category as DiscoveredPerson["roleCategory"];
        return person;
      }
    }
  }

  // Default to key_employee if no match
  person.roleCategory = "key_employee";
  return person;
}

/**
 * Calculate overall discovery confidence
 */
function calculateDiscoveryConfidence(result: DiscoveryResult): number {
  if (result.people.length === 0) return 0;

  // Average confidence of all people
  const avgPersonConfidence =
    result.people.reduce((sum, p) => sum + p.confidence, 0) / result.people.length;

  // Bonus for finding multiple pages with team content
  const pageBonus = Math.min(result.pagesWithTeam * 0.1, 0.2);

  // Bonus for having multiple people (more reliable)
  const countBonus = Math.min(result.people.length * 0.02, 0.2);

  return Math.min(avgPersonConfidence + pageBonus + countBonus, 1);
}

/**
 * Refine discovered people using AI
 * This is a placeholder - implement with actual AI call
 */
async function refineWithAI(
  people: DiscoveredPerson[],
  _brandId: string
): Promise<DiscoveredPerson[]> {
  // TODO: Implement AI refinement
  // - Verify names are actual people names
  // - Improve role classification
  // - Extract additional context from bios
  // - Identify relationships between people

  return people;
}

// ============================================================================
// Conversion to Database Format
// ============================================================================

/**
 * Convert discovered people to database insert format
 */
export function convertToDbPeople(
  discovered: DiscoveredPerson[],
  brandId: string
): NewBrandPerson[] {
  return discovered.map((person, index) => ({
    brandId,
    name: person.name,
    title: person.title,
    roleCategory: person.roleCategory,
    bio: person.bio,
    photoUrl: person.photoUrl,
    linkedinUrl: person.linkedinUrl,
    twitterUrl: person.twitterUrl,
    socialProfiles: person.socialProfiles || {},
    discoveredFrom: "website_scrape" as const,
    extractionMetadata: {
      confidence: person.confidence,
      sourceUrl: person.sourceUrl,
      extractedAt: new Date().toISOString(),
    } as PersonExtractionMetadata,
    displayOrder: index,
    isActive: true,
    isVerified: false,
  }));
}

// ============================================================================
// Quick Helpers
// ============================================================================

/**
 * Quick extraction of team members from HTML
 * Convenience wrapper for simple use cases
 */
export function extractPeopleFromHtml(
  html: string,
  sourceUrl: string = ""
): DiscoveredPerson[] {
  const members = extractTeamFromHtml(html);
  const socials = extractSocialsFromHtml(html);

  return members.map((m) => convertTeamMember(m, socials, sourceUrl));
}

/**
 * Check if a URL likely contains team/people content
 */
export function isLikelyTeamUrl(url: string): boolean {
  const pathLower = url.toLowerCase();
  const teamKeywords = [
    "team", "about", "leadership", "people", "management",
    "founders", "executive", "board", "staff", "who-we-are",
  ];
  return teamKeywords.some((keyword) => pathLower.includes(keyword));
}
