/**
 * GEO Monitoring Background Job
 *
 * Queries AI platforms with brand GEO keywords and saves mentions to the database.
 * This service runs periodically (via cron job or API endpoint) to collect
 * brand visibility data across AI search engines.
 */

import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema/brands";
import { brandMentions, type BrandMention } from "@/lib/db/schema/mentions";
import { eq } from "drizzle-orm";
import { queryAIPlatform, type AIPlatformMention } from "./ai-platform-query";

// ============================================================================
// Types
// ============================================================================

interface GEOMonitoringResult {
  brandId: string;
  brandName: string;
  platformsQueried: number;
  mentionsCollected: number;
  errors: string[];
}

// Note: AI platform query functions moved to ai-platform-query.ts

// ============================================================================
// Main Monitoring Function
// ============================================================================

/**
 * Run GEO monitoring for a single brand
 *
 * Queries all enabled platforms with all GEO keywords and saves mentions.
 */
export async function runGEOMonitoringForBrand(
  brandId: string
): Promise<GEOMonitoringResult> {
  const result: GEOMonitoringResult = {
    brandId,
    brandName: "",
    platformsQueried: 0,
    mentionsCollected: 0,
    errors: [],
  };

  try {
    // Fetch brand
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      result.errors.push(`Brand ${brandId} not found`);
      return result;
    }

    result.brandName = brand.name;

    // Check if monitoring is enabled
    if (!brand.monitoringEnabled) {
      console.log(`GEO monitoring disabled for ${brand.name}, skipping`);
      return result;
    }

    // Get platforms and keywords
    const platforms = brand.monitoringPlatforms || [];
    const keywords = brand.geoKeywords || [];

    if (platforms.length === 0) {
      result.errors.push("No monitoring platforms configured");
      return result;
    }

    if (keywords.length === 0) {
      result.errors.push("No GEO keywords configured");
      return result;
    }

    console.log(`[GEO Monitor] Starting monitoring for ${brand.name}`);
    console.log(`  Platforms: ${platforms.join(", ")}`);
    console.log(`  Keywords: ${keywords.length} keyword(s)`);

    // Query each platform with each keyword
    for (const platform of platforms) {
      for (const keyword of keywords) {
        try {
          const mention = await queryAIPlatform(platform, brand.name, keyword);

          if (mention) {
            // Save mention to database
            await db.insert(brandMentions).values({
              brandId,
              platform: mention.platform,
              query: mention.query,
              response: mention.response,
              sentiment: mention.sentiment,
              position: mention.position,
              citationUrl: mention.citationUrl,
              competitors: mention.competitors,
              promptCategory: mention.promptCategory,
              topics: mention.topics,
              metadata: mention.metadata,
            });

            result.mentionsCollected++;
            console.log(`  ✅ Found mention on ${platform} for "${keyword}"`);
          }

          result.platformsQueried++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errors.push(`${platform}/${keyword}: ${errorMessage}`);
          console.error(`Error querying ${platform} with "${keyword}":`, error);
        }
      }
    }

    console.log(`[GEO Monitor] Completed for ${brand.name}:`);
    console.log(`  Platforms queried: ${result.platformsQueried}`);
    console.log(`  Mentions collected: ${result.mentionsCollected}`);
    console.log(`  Errors: ${result.errors.length}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Unexpected error: ${errorMessage}`);
    console.error("Error in runGEOMonitoringForBrand:", error);
  }

  return result;
}

/**
 * Run GEO monitoring for all active brands in the system
 *
 * This function would be called by a cron job or scheduled task.
 */
export async function runGEOMonitoringForAllBrands(): Promise<GEOMonitoringResult[]> {
  try {
    console.log("[GEO Monitor] Starting global monitoring run");

    // Get all brands with monitoring enabled
    const activeBrands = await db.query.brands.findMany({
      where: eq(brands.monitoringEnabled, true),
    });

    console.log(`Found ${activeBrands.length} brand(s) with monitoring enabled`);

    const results: GEOMonitoringResult[] = [];

    for (const brand of activeBrands) {
      const result = await runGEOMonitoringForBrand(brand.id);
      results.push(result);
    }

    const totalMentions = results.reduce((sum, r) => sum + r.mentionsCollected, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log("[GEO Monitor] Global monitoring completed:");
    console.log(`  Brands monitored: ${results.length}`);
    console.log(`  Total mentions: ${totalMentions}`);
    console.log(`  Total errors: ${totalErrors}`);

    return results;
  } catch (error) {
    console.error("Error in runGEOMonitoringForAllBrands:", error);
    throw error;
  }
}

/**
 * Calculate GEO score from mentions
 *
 * GEO score is calculated based on:
 * - Number of mentions across platforms
 * - Average position in responses (lower is better)
 * - Sentiment of mentions
 * - Platform diversity
 */
export function calculateGEOScore(mentions: BrandMention[]): number {
  if (mentions.length === 0) return 0;

  // Component scores (0-100 each)
  const visibilityScore = Math.min(100, (mentions.length / 10) * 100); // Max at 10 mentions

  const avgPosition = mentions.reduce((sum, m) => sum + (m.position || 5), 0) / mentions.length;
  const positionScore = Math.max(0, 100 - (avgPosition - 1) * 20); // Lower position = higher score

  const positiveMentions = mentions.filter(m => m.sentiment === "positive").length;
  const sentimentScore = (positiveMentions / mentions.length) * 100;

  const uniquePlatforms = new Set(mentions.map(m => m.platform)).size;
  const diversityScore = Math.min(100, (uniquePlatforms / 7) * 100); // Max at 7 platforms

  // Weighted average (visibility is most important)
  const geoScore = Math.round(
    visibilityScore * 0.4 +
    positionScore * 0.3 +
    sentimentScore * 0.2 +
    diversityScore * 0.1
  );

  return Math.min(100, Math.max(0, geoScore));
}
