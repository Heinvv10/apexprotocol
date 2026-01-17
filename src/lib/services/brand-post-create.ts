/**
 * Brand Post-Creation Background Job
 *
 * Orchestrates all data population tasks after a brand is created:
 * 1. Populate social profiles from extracted links
 * 2. Populate competitors from extracted data
 * 3. Create default portfolio
 * 4. Initiate GEO monitoring (if enabled)
 *
 * This service is called automatically after brand creation completes.
 */

import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema/brands";
import { socialAccounts } from "@/lib/db/schema/social";
import { discoveredCompetitors } from "@/lib/db/schema/competitive";
import { portfolios, portfolioBrands } from "@/lib/db/schema/portfolios";
import { brandLocations } from "@/lib/db/schema/locations";
import { eq, and } from "drizzle-orm";
import type { Brand } from "@/stores";
import { runGEOMonitoringForBrand } from "./geo-monitor";
import { discoverManagementPeople } from "./people-discovery-filtered";

// ============================================================================
// Types
// ============================================================================

interface BrandPopulationResult {
  success: boolean;
  socialProfilesCreated: number;
  competitorsCreated: number;
  peopleDiscovered: number;
  locationsCreated: number;
  portfolioCreated: boolean;
  portfolioId?: string;
  engineRoomDataCollected: boolean;
  mentionsCollected?: number;
  errors: string[];
}

type SocialPlatform =
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
  | "threads"
  | "mastodon"
  | "bluesky";

// ============================================================================
// Platform Detection Helpers
// ============================================================================

/**
 * Detect platform from URL
 */
function detectPlatformFromUrl(url: string): SocialPlatform | null {
  const urlLower = url.toLowerCase();

  if (urlLower.includes("linkedin.com")) return "linkedin";
  if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) return "twitter";
  if (urlLower.includes("facebook.com")) return "facebook";
  if (urlLower.includes("instagram.com")) return "instagram";
  if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) return "youtube";
  if (urlLower.includes("tiktok.com")) return "tiktok";
  if (urlLower.includes("github.com")) return "github";
  if (urlLower.includes("pinterest.com")) return "pinterest";
  if (urlLower.includes("medium.com")) return "medium";
  if (urlLower.includes("reddit.com")) return "reddit";
  if (urlLower.includes("discord.gg") || urlLower.includes("discord.com")) return "discord";
  if (urlLower.includes("threads.net")) return "threads";
  if (urlLower.includes("mastodon")) return "mastodon";
  if (urlLower.includes("bsky.app")) return "bluesky";

  return null;
}

/**
 * Extract username/handle from URL
 */
function extractHandleFromUrl(url: string, platform: SocialPlatform): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    switch (platform) {
      case "twitter":
        // https://twitter.com/username or https://x.com/username
        const twitterMatch = pathname.match(/^\/([^\/\?]+)/);
        return twitterMatch ? `@${twitterMatch[1]}` : null;

      case "linkedin":
        // https://linkedin.com/company/name or https://linkedin.com/in/person
        const linkedinMatch = pathname.match(/^\/(company|in)\/([^\/\?]+)/);
        return linkedinMatch ? linkedinMatch[2] : null;

      case "instagram":
        // https://instagram.com/username
        const instagramMatch = pathname.match(/^\/([^\/\?]+)/);
        return instagramMatch ? `@${instagramMatch[1]}` : null;

      case "facebook":
        // https://facebook.com/pagename
        const facebookMatch = pathname.match(/^\/([^\/\?]+)/);
        return facebookMatch ? facebookMatch[1] : null;

      case "youtube":
        // https://youtube.com/@channel or https://youtube.com/c/channel
        const youtubeMatch = pathname.match(/^\/(@|c\/|channel\/)([^\/\?]+)/);
        return youtubeMatch ? youtubeMatch[2] : null;

      case "tiktok":
        // https://tiktok.com/@username
        const tiktokMatch = pathname.match(/^\/@([^\/\?]+)/);
        return tiktokMatch ? `@${tiktokMatch[1]}` : null;

      case "github":
        // https://github.com/username
        const githubMatch = pathname.match(/^\/([^\/\?]+)/);
        return githubMatch ? githubMatch[1] : null;

      default:
        // Generic fallback: first path segment
        const genericMatch = pathname.match(/^\/([^\/\?]+)/);
        return genericMatch ? genericMatch[1] : null;
    }
  } catch (error) {
    console.error(`Failed to extract handle from ${url}:`, error);
    return null;
  }
}

// ============================================================================
// 1. Social Profiles Population
// ============================================================================

/**
 * Populate social profiles table from brands.socialLinks JSON field
 */
export async function populateSocialProfiles(
  brandId: string,
  socialLinks: Record<string, string>
): Promise<number> {
  let createdCount = 0;
  const errors: string[] = [];

  for (const [key, url] of Object.entries(socialLinks)) {
    if (!url) continue;

    try {
      // Detect platform from URL
      const platform = detectPlatformFromUrl(url);
      if (!platform) {
        errors.push(`Could not detect platform for URL: ${url}`);
        continue;
      }

      // Extract handle/username
      const handle = extractHandleFromUrl(url, platform);

      // Check if account already exists
      const existing = await db.query.socialAccounts.findFirst({
        where: and(
          eq(socialAccounts.brandId, brandId),
          eq(socialAccounts.platform, platform)
        ),
      });

      if (existing) {
        console.log(`Social account for ${platform} already exists, skipping`);
        continue;
      }

      // Create social account record
      await db.insert(socialAccounts).values({
        brandId,
        platform,
        accountType: "company",
        accountId: handle || "unknown", // Placeholder until we fetch real data
        accountHandle: handle,
        profileUrl: url,
        isActive: true,
        connectionStatus: "connected",
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
      });

      createdCount++;
      console.log(`Created social account for ${platform}: ${url}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to create social account for ${url}: ${errorMessage}`);
      console.error(`Error creating social account for ${url}:`, error);
    }
  }

  if (errors.length > 0) {
    console.warn("Social profile creation errors:", errors);
  }

  return createdCount;
}

// ============================================================================
// 2. Competitors Population
// ============================================================================

/**
 * Populate discovered competitors table from brands.competitors JSON array
 */
export async function populateCompetitors(
  brandId: string,
  competitors: Array<{ name: string; url?: string; reason: string }>
): Promise<number> {
  let createdCount = 0;
  const errors: string[] = [];

  for (const competitor of competitors) {
    if (!competitor.name) continue;

    try {
      // Check if competitor already exists
      const existing = await db.query.discoveredCompetitors.findFirst({
        where: and(
          eq(discoveredCompetitors.brandId, brandId),
          eq(discoveredCompetitors.competitorName, competitor.name)
        ),
      });

      if (existing) {
        console.log(`Competitor ${competitor.name} already exists, skipping`);
        continue;
      }

      // Extract domain from URL if provided
      let domain: string | null = null;
      if (competitor.url) {
        try {
          const urlObj = new URL(competitor.url);
          domain = urlObj.hostname.replace(/^www\./, "");
        } catch {
          // Invalid URL, skip domain extraction
        }
      }

      // Create discovered competitor record (auto-confirmed since it came from AI scraping)
      await db.insert(discoveredCompetitors).values({
        brandId,
        competitorName: competitor.name,
        competitorDomain: domain,
        discoveryMethod: "ai_co_occurrence", // Discovered during AI analysis
        confidenceScore: 0.8, // High confidence from AI scraping
        status: "confirmed", // Auto-confirm since it's from brand scraping
        confirmedAt: new Date(),
        metadata: {
          discoveryReason: competitor.reason,
          discoveredDuringBrandCreation: true,
        },
      });

      createdCount++;
      console.log(`Created competitor record for ${competitor.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to create competitor ${competitor.name}: ${errorMessage}`);
      console.error(`Error creating competitor ${competitor.name}:`, error);
    }
  }

  if (errors.length > 0) {
    console.warn("Competitor creation errors:", errors);
  }

  return createdCount;
}

// ============================================================================
// 3. Locations Population
// ============================================================================

/**
 * Populate brand locations table from brands.locations JSONB field
 */
export async function populateLocations(
  brandId: string,
  locations: Array<{ type: string; address?: string; city?: string; state?: string; country?: string; postalCode?: string; phone?: string; email?: string }>
): Promise<number> {
  let createdCount = 0;
  const errors: string[] = [];

  for (const location of locations) {
    // Allow partial data - require at least one of: city, address, or country
    if (!location.city && !location.address && !location.country) continue;

    try {
      // Map location type from scraper to schema enum
      let locationType: "headquarters" | "branch" | "store" | "office" | "warehouse" | "factory" | "distribution_center" = "office";
      if (location.type === "headquarters") locationType = "headquarters";
      else if (location.type === "office") locationType = "office";
      else if (location.type === "regional") locationType = "branch";

      // Check if location already exists (by address or city+country)
      const existing = await db.query.brandLocations.findFirst({
        where: and(
          eq(brandLocations.brandId, brandId),
          location.address
            ? eq(brandLocations.address, location.address)
            : and(
                eq(brandLocations.city, location.city || ""),
                eq(brandLocations.country, location.country || "")
              )
        ),
      });

      if (existing) {
        console.log(`Location in ${location.city || location.address} already exists, skipping`);
        continue;
      }

      // Determine if this should be primary (first headquarters location)
      const isPrimary = location.type === "headquarters" && createdCount === 0;

      // Create brand location record
      await db.insert(brandLocations).values({
        brandId,
        name: location.city || location.address || "Office", // Use city as name if available
        address: location.address || null,
        city: location.city || null,
        state: location.state || null,
        country: location.country || null,
        postalCode: location.postalCode || null,
        phone: location.phone || null,
        email: location.email || null,
        locationType,
        isPrimary,
        isActive: true,
        isVerified: false, // Not verified until Google Places sync
      });

      createdCount++;
      console.log(`Created location record for ${location.city || location.address}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to create location ${location.city || location.address}: ${errorMessage}`);
      console.error(`Error creating location ${location.city || location.address}:`, error);
    }
  }

  if (errors.length > 0) {
    console.warn("Location creation errors:", errors);
  }

  return createdCount;
}

// ============================================================================
// 4. Default Portfolio Creation
// ============================================================================

/**
 * Ensure a default portfolio exists and add the brand to it
 */
export async function ensureDefaultPortfolio(
  organizationId: string,
  brandId: string
): Promise<{ created: boolean; portfolioId: string }> {
  try {
    // Check if brand is already in a portfolio
    const existingPortfolioBrand = await db.query.portfolioBrands.findFirst({
      where: eq(portfolioBrands.brandId, brandId),
    });

    if (existingPortfolioBrand) {
      console.log(`Brand ${brandId} already in portfolio ${existingPortfolioBrand.portfolioId}`);
      return {
        created: false,
        portfolioId: existingPortfolioBrand.portfolioId,
      };
    }

    // Find or create default portfolio
    let defaultPortfolio = await db.query.portfolios.findFirst({
      where: and(
        eq(portfolios.organizationId, organizationId),
        eq(portfolios.name, "All Brands")
      ),
    });

    if (!defaultPortfolio) {
      // Create default portfolio
      const [newPortfolio] = await db.insert(portfolios).values({
        organizationId,
        name: "All Brands",
        description: "Default portfolio containing all your brands",
        isActive: true,
      }).returning();

      defaultPortfolio = newPortfolio;
      console.log(`Created default portfolio for organization ${organizationId}`);
    }

    // Add brand to portfolio
    await db.insert(portfolioBrands).values({
      portfolioId: defaultPortfolio.id,
      brandId,
      displayOrder: 0,
      isHighlighted: false,
    });

    console.log(`Added brand ${brandId} to portfolio ${defaultPortfolio.id}`);

    return {
      created: true,
      portfolioId: defaultPortfolio.id,
    };
  } catch (error) {
    console.error("Error ensuring default portfolio:", error);
    throw error;
  }
}

// ============================================================================
// Main Orchestration Function
// ============================================================================

/**
 * Main function to populate all brand data after creation
 *
 * Called automatically after brand creation completes.
 * Runs all data population tasks in sequence.
 */
export async function populateBrandData(brandId: string): Promise<BrandPopulationResult> {
  const result: BrandPopulationResult = {
    success: false,
    socialProfilesCreated: 0,
    competitorsCreated: 0,
    peopleDiscovered: 0,
    locationsCreated: 0,
    portfolioCreated: false,
    engineRoomDataCollected: false,
    errors: [],
  };

  try {
    // Fetch the brand with all its data
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      result.errors.push(`Brand ${brandId} not found`);
      return result;
    }

    console.log(`Starting data population for brand: ${brand.name} (${brandId})`);

    // 1. Populate social profiles
    if (brand.socialLinks && Object.keys(brand.socialLinks).length > 0) {
      console.log(`Populating social profiles from ${Object.keys(brand.socialLinks).length} links...`);
      result.socialProfilesCreated = await populateSocialProfiles(
        brandId,
        brand.socialLinks as Record<string, string>
      );
      console.log(`✅ Created ${result.socialProfilesCreated} social profile(s)`);
    } else {
      console.log("No social links found, skipping social profile creation");
    }

    // 2. Populate competitors
    if (brand.competitors && Array.isArray(brand.competitors) && brand.competitors.length > 0) {
      console.log(`Populating ${brand.competitors.length} competitor(s)...`);
      result.competitorsCreated = await populateCompetitors(
        brandId,
        brand.competitors as Array<{ name: string; url?: string; reason: string }>
      );
      console.log(`✅ Created ${result.competitorsCreated} competitor record(s)`);
    } else {
      console.log("No competitors found, skipping competitor creation");
    }

    // 2.5. Populate locations from brands.locations JSONB field
    if (brand.locations && Array.isArray(brand.locations) && brand.locations.length > 0) {
      console.log(`Populating ${brand.locations.length} location(s) from scraped data...`);
      result.locationsCreated = await populateLocations(
        brandId,
        brand.locations as Array<{ type: string; address?: string; city?: string; state?: string; country?: string; postalCode?: string; phone?: string; email?: string }>
      );
      console.log(`✅ Created ${result.locationsCreated} location record(s)`);
    } else {
      console.log("No locations found in scraped data, skipping location creation");
    }

    // 2.6. Discover management-level people from website
    if (brand.domain) {
      console.log(`Discovering people from ${brand.domain}...`);
      const discoveryResult = await discoverManagementPeople(brandId, brand.domain);
      result.peopleDiscovered = discoveryResult.saved;

      // 2.7. LinkedIn enrichment if fewer than 5 people found
      if (result.peopleDiscovered < 5) {
        console.log(`Only ${result.peopleDiscovered} people found from website, enriching from LinkedIn...`);
        try {
          const { extractLinkedInPeople } = await import("./linkedin-scraper");
          const linkedinResult = await extractLinkedInPeople(brandId);

          if (linkedinResult.success && linkedinResult.peopleExtracted > 0) {
            result.peopleDiscovered += linkedinResult.peopleExtracted;
            console.log(`✅ Added ${linkedinResult.peopleExtracted} people from LinkedIn (total: ${result.peopleDiscovered})`);
          } else if (linkedinResult.errors.length > 0) {
            result.errors.push(`LinkedIn enrichment failed: ${linkedinResult.errors.join(', ')}`);
            console.warn(`LinkedIn enrichment failed: ${linkedinResult.errors.join(', ')}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errors.push(`LinkedIn enrichment error: ${errorMessage}`);
          console.error("LinkedIn enrichment error:", error);
        }
      } else {
        console.log(`Found ${result.peopleDiscovered} people from website, skipping LinkedIn enrichment`);
      }
    } else {
      console.log("No domain found, skipping people discovery");
    }

    // 3. Create default portfolio
    console.log("Ensuring default portfolio...");
    const portfolioResult = await ensureDefaultPortfolio(brand.organizationId, brandId);
    result.portfolioCreated = portfolioResult.created;
    result.portfolioId = portfolioResult.portfolioId;
    console.log(`✅ Portfolio ${portfolioResult.created ? "created" : "exists"}: ${portfolioResult.portfolioId}`);

    // 4. Engine Room data collection (GEO monitoring with real AI platform queries)
    if (brand.monitoringEnabled) {
      console.log(`Starting Engine Room data collection for ${brand.monitoringPlatforms?.length || 0} platform(s)...`);

      try {
        const monitoringResult = await runGEOMonitoringForBrand(brandId);
        result.engineRoomDataCollected = true;
        result.mentionsCollected = monitoringResult.mentionsCollected;

        if (monitoringResult.errors.length > 0) {
          result.errors.push(...monitoringResult.errors);
          console.warn(`Engine Room collection completed with ${monitoringResult.errors.length} error(s)`);
        }

        console.log(`✅ Engine Room data collected: ${monitoringResult.mentionsCollected} mentions across ${monitoringResult.platformsQueried} queries`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Engine Room collection failed: ${errorMessage}`);
        console.error("Engine Room collection error:", error);
      }
    } else {
      console.log("GEO monitoring not enabled, skipping Engine Room data collection");
    }

    result.success = true;
    console.log(`✅ Brand data population completed successfully for ${brand.name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Unexpected error: ${errorMessage}`);
    console.error("Error in populateBrandData:", error);
  }

  return result;
}
