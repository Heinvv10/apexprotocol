/**
 * Cron endpoint for scheduled social media scanning
 * Called by Vercel Cron or external scheduler every 6 hours
 *
 * Environment variables:
 * - CRON_SECRET: Secret token for authenticating cron requests
 * - SCAN_INTERVAL_HOURS: Hours between scans (default: 6)
 * - MAX_SCANS_PER_RUN: Maximum brands to scan per cron run (default: 50)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands, serviceScanResults, scanJobQueue } from "@/lib/db/schema";
import { eq, and, or, lte, isNull, sql, desc } from "drizzle-orm";
import { scanBrand, type BatchScanRequest } from "@/lib/social-scanner";
import { type ScannerPlatform } from "@/lib/social-scanner/types";

const SCAN_INTERVAL_HOURS = parseInt(process.env.SCAN_INTERVAL_HOURS || "6", 10);
const MAX_SCANS_PER_RUN = parseInt(process.env.MAX_SCANS_PER_RUN || "50", 10);

// Rate limiting delays between scans (in ms) to respect API limits
const INTER_SCAN_DELAY = 2000; // 2 seconds between brand scans
const INTER_PLATFORM_DELAY = 500; // 0.5 seconds between platform scans

/**
 * Verify the cron secret from the authorization header
 */
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // If no secret configured, only allow in development
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  // Support both "Bearer TOKEN" and just "TOKEN" formats
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  return token === cronSecret;
}

/**
 * Extract social handles from brand's socialLinks field
 */
function extractHandles(socialLinks: Record<string, string> | null): Record<string, string> {
  if (!socialLinks) return {};

  const handles: Record<string, string> = {};
  const supportedPlatforms = ["twitter", "youtube", "facebook"];

  for (const [platform, url] of Object.entries(socialLinks)) {
    const normalizedPlatform = platform.toLowerCase();
    if (!supportedPlatforms.includes(normalizedPlatform) || !url) continue;

    try {
      const cleanUrl = url.replace(/\/+$/, "");
      let handle: string | null = null;

      // Platform-specific extraction
      switch (normalizedPlatform) {
        case "twitter": {
          const twitterMatch = cleanUrl.match(/(?:twitter|x)\.com\/(@?\w+)/i);
          if (twitterMatch) handle = twitterMatch[1].replace(/^@/, "");
          break;
        }
        case "youtube": {
          const ytMatch = cleanUrl.match(/youtube\.com\/(?:@|channel\/|c\/|user\/)?([^\/\?]+)/i);
          if (ytMatch) handle = ytMatch[1];
          break;
        }
        case "facebook": {
          const fbMatch = cleanUrl.match(/(?:facebook|fb)\.com\/([^\/\?]+)/i);
          if (fbMatch) handle = fbMatch[1];
          break;
        }
      }

      if (handle) {
        handles[normalizedPlatform] = handle;
      }
    } catch {
      // Skip malformed URLs
    }
  }

  return handles;
}

/**
 * Get brands that need scanning
 */
async function getBrandsToScan(limit: number) {
  const now = new Date();
  const scanThreshold = new Date(now.getTime() - SCAN_INTERVAL_HOURS * 60 * 60 * 1000);

  // Get brands with social links where:
  // - Never scanned OR
  // - Last scan was before the threshold
  const brandsToScan = await db
    .select({
      id: brands.id,
      name: brands.name,
      organizationId: brands.organizationId,
      socialLinks: brands.socialLinks,
    })
    .from(brands)
    .where(
      and(
        // Has social links
        sql`${brands.socialLinks} IS NOT NULL AND ${brands.socialLinks}::text != '{}'`,
        // Check if needs scanning (via subquery on serviceScanResults)
        or(
          // Never scanned
          isNull(
            db
              .select({ scannedAt: serviceScanResults.scannedAt })
              .from(serviceScanResults)
              .where(eq(serviceScanResults.brandId, brands.id))
              .limit(1)
          ),
          // Or last scan is older than threshold
          lte(
            db
              .select({ scannedAt: serviceScanResults.scannedAt })
              .from(serviceScanResults)
              .where(eq(serviceScanResults.brandId, brands.id))
              .orderBy(desc(serviceScanResults.scannedAt))
              .limit(1),
            scanThreshold
          )
        )
      )
    )
    .limit(limit);

  return brandsToScan;
}

/**
 * Save scan results to database
 */
async function saveScanResults(
  brandId: string,
  organizationId: string,
  scanResult: Awaited<ReturnType<typeof scanBrand>>
) {
  const now = new Date();
  const nextScanAt = new Date(now.getTime() + SCAN_INTERVAL_HOURS * 60 * 60 * 1000);

  for (const [platform, platformResult] of Object.entries(scanResult.results)) {
    if (!platformResult || platformResult.status === "failed") continue;

    const profile = platformResult.profile;
    const posts = platformResult.recentPosts || [];
    const mentions = platformResult.mentions || [];

    // Calculate metrics
    let avgLikes = 0, avgComments = 0, avgShares = 0, avgViews = 0;
    if (posts.length > 0) {
      const totals = posts.reduce(
        (acc: { likes: number; comments: number; shares: number; views: number }, post) => ({
          likes: acc.likes + (post.metrics?.likes || 0),
          comments: acc.comments + (post.metrics?.comments || 0),
          shares: acc.shares + (post.metrics?.shares || 0),
          views: acc.views + (post.metrics?.views || 0),
        }),
        { likes: 0, comments: 0, shares: 0, views: 0 }
      );
      avgLikes = Math.round(totals.likes / posts.length);
      avgComments = Math.round(totals.comments / posts.length);
      avgShares = Math.round(totals.shares / posts.length);
      avgViews = Math.round(totals.views / posts.length);
    }

    // Calculate engagement rate
    const totalEngagement = avgLikes + avgComments + avgShares;
    const followerCount = profile?.followerCount || 0;
    const engagementRate = followerCount > 0 && posts.length > 0
      ? (totalEngagement / followerCount) * 100
      : 0;

    // Calculate sentiment breakdown
    let sentimentPositive = 0, sentimentNeutral = 0, sentimentNegative = 0;
    for (const mention of mentions) {
      switch (mention.sentiment) {
        case "positive": sentimentPositive++; break;
        case "neutral": sentimentNeutral++; break;
        case "negative": sentimentNegative++; break;
      }
    }

    // Calculate post frequency (posts per day)
    let postFrequency = 0;
    if (posts.length >= 2) {
      const dates = posts
        .map(p => new Date(p.publishedAt))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());
      if (dates.length >= 2) {
        const daysDiff = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
        postFrequency = daysDiff > 0 ? posts.length / daysDiff : 0;
      }
    }

    // Upsert scan result
    await db
      .insert(serviceScanResults)
      .values({
        organizationId,
        brandId,
        platform: platform as ScannerPlatform,
        platformAccountId: profile?.platformId || null,
        targetHandle: profile?.username || "",
        profileData: profile
          ? {
              platformId: profile.platformId,
              handle: profile.username,
              displayName: profile.displayName,
              bio: profile.bio || undefined,
              followerCount: profile.followerCount,
              followingCount: profile.followingCount,
              postCount: profile.postCount,
              isVerified: profile.isVerified,
              profileUrl: profile.profileUrl,
              avatarUrl: profile.avatarUrl || undefined,
              platformSpecific: profile.metadata,
            }
          : null,
        followerCount: profile?.followerCount || 0,
        followingCount: profile?.followingCount || null,
        postCount: profile?.postCount || null,
        engagementRate,
        avgLikes,
        avgComments,
        avgShares,
        avgViews,
        postFrequency,
        mentionsCount: mentions.length,
        sentimentPositive,
        sentimentNeutral,
        sentimentNegative,
        postsData: posts.length > 0
          ? posts.slice(0, 10).map(p => ({
              postId: p.postId,
              content: p.content.slice(0, 500),
              postType: "post",
              publishedAt: p.publishedAt instanceof Date ? p.publishedAt.toISOString() : String(p.publishedAt),
              engagement: {
                likes: p.metrics?.likes || 0,
                comments: p.metrics?.comments || 0,
                shares: p.metrics?.shares || 0,
                views: p.metrics?.views || undefined,
              },
              postUrl: p.postUrl,
            }))
          : null,
        mentionsData: mentions.length > 0
          ? mentions.slice(0, 10).map(m => ({
              postId: m.postId,
              authorHandle: m.authorUsername,
              content: m.content.slice(0, 500),
              sentiment: m.sentiment || undefined,
              engagement: {
                likes: m.metrics?.likes || 0,
                comments: m.metrics?.comments || 0,
                shares: m.metrics?.shares || 0,
              },
              mentionedAt: m.publishedAt instanceof Date ? m.publishedAt.toISOString() : String(m.publishedAt),
              postUrl: m.postUrl,
            }))
          : null,
        scanStatus: platformResult.status === "completed" ? "success" : "partial",
        errorMessage: platformResult.error?.message || null,
        scannedAt: now,
        nextScanAt,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [serviceScanResults.brandId, serviceScanResults.platform, serviceScanResults.targetHandle],
        set: {
          organizationId,
          platformAccountId: profile?.platformId || null,
          profileData: profile
            ? {
                platformId: profile.platformId,
                handle: profile.username,
                displayName: profile.displayName,
                bio: profile.bio || undefined,
                followerCount: profile.followerCount,
                followingCount: profile.followingCount,
                postCount: profile.postCount,
                isVerified: profile.isVerified,
                profileUrl: profile.profileUrl,
                avatarUrl: profile.avatarUrl || undefined,
                platformSpecific: profile.metadata,
              }
            : null,
          followerCount: profile?.followerCount || 0,
          followingCount: profile?.followingCount || null,
          postCount: profile?.postCount || null,
          engagementRate,
          avgLikes,
          avgComments,
          avgShares,
          avgViews,
          postFrequency,
          mentionsCount: mentions.length,
          sentimentPositive,
          sentimentNeutral,
          sentimentNegative,
          postsData: posts.length > 0
            ? posts.slice(0, 10).map(p => ({
                postId: p.postId,
                content: p.content.slice(0, 500),
                postType: "post",
                publishedAt: p.publishedAt instanceof Date ? p.publishedAt.toISOString() : String(p.publishedAt),
                engagement: {
                  likes: p.metrics?.likes || 0,
                  comments: p.metrics?.comments || 0,
                  shares: p.metrics?.shares || 0,
                  views: p.metrics?.views || undefined,
                },
                postUrl: p.postUrl,
              }))
            : null,
          mentionsData: mentions.length > 0
            ? mentions.slice(0, 10).map(m => ({
                postId: m.postId,
                authorHandle: m.authorUsername,
                content: m.content.slice(0, 500),
                sentiment: m.sentiment || undefined,
                engagement: {
                  likes: m.metrics?.likes || 0,
                  comments: m.metrics?.comments || 0,
                  shares: m.metrics?.shares || 0,
                },
                mentionedAt: m.publishedAt instanceof Date ? m.publishedAt.toISOString() : String(m.publishedAt),
                postUrl: m.postUrl,
              }))
            : null,
          scanStatus: platformResult.status === "completed" ? "success" : "partial",
          errorMessage: platformResult.error?.message || null,
          scannedAt: now,
          nextScanAt,
          updatedAt: now,
        },
      });
  }
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * GET handler for cron endpoint
 * Triggered by Vercel Cron or external scheduler
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results: {
    scanned: number;
    succeeded: number;
    failed: number;
    skipped: number;
    errors: string[];
    details: Array<{
      brandId: string;
      brandName: string;
      platforms: string[];
      status: string;
      error?: string;
    }>;
  } = {
    scanned: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    details: [],
  };

  try {
    // Get brands that need scanning
    const brandsToScan = await getBrandsToScan(MAX_SCANS_PER_RUN);

    if (brandsToScan.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No brands need scanning at this time",
        results: {
          ...results,
          duration: Date.now() - startTime,
        },
      });
    }

    // Process each brand with rate limiting
    for (const brand of brandsToScan) {
      const handles = extractHandles(brand.socialLinks as Record<string, string> | null);
      const platforms = Object.keys(handles) as ScannerPlatform[];

      if (platforms.length === 0) {
        results.skipped++;
        results.details.push({
          brandId: brand.id,
          brandName: brand.name,
          platforms: [],
          status: "skipped",
          error: "No valid social handles found",
        });
        continue;
      }

      try {
        // Create scan request
        const scanRequest: BatchScanRequest = {
          brandId: brand.id,
          handles: handles as Record<ScannerPlatform, string>,
          platforms,
          options: {
            includeProfile: true,
            includePosts: true,
            includeMentions: true,
            postsLimit: 20,
            mentionsLimit: 10,
          },
        };

        // Execute scan
        const scanResults = await scanBrand(scanRequest);

        // Save results to database
        await saveScanResults(brand.id, brand.organizationId, scanResults);

        // Track results
        results.scanned++;
        const successfulPlatforms = Object.entries(scanResults.results)
          .filter(([, r]) => r?.status === "completed")
          .map(([p]) => p);
        const failedPlatforms = Object.entries(scanResults.results)
          .filter(([, r]) => r?.status === "failed")
          .map(([p]) => p);

        if (failedPlatforms.length === 0) {
          results.succeeded++;
        } else if (successfulPlatforms.length > 0) {
          results.succeeded++; // Partial success
        } else {
          results.failed++;
        }

        results.details.push({
          brandId: brand.id,
          brandName: brand.name,
          platforms: successfulPlatforms,
          status: failedPlatforms.length === 0 ? "success" : "partial",
          error: failedPlatforms.length > 0
            ? `Failed platforms: ${failedPlatforms.join(", ")}`
            : undefined,
        });

        // Rate limiting delay between brands
        if (brandsToScan.indexOf(brand) < brandsToScan.length - 1) {
          await sleep(INTER_SCAN_DELAY);
        }
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Brand ${brand.id}: ${errorMessage}`);
        results.details.push({
          brandId: brand.id,
          brandName: brand.name,
          platforms,
          status: "failed",
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scanned ${results.scanned} brands`,
      results: {
        ...results,
        duration: Date.now() - startTime,
        brandsTotal: brandsToScan.length,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Cron job failed: ${errorMessage}`,
        results: {
          ...results,
          duration: Date.now() - startTime,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for manual trigger with custom options
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { maxBrands, brandIds } = body as {
      maxBrands?: number;
      brandIds?: string[];
    };

    // If specific brandIds provided, scan only those
    if (brandIds && Array.isArray(brandIds) && brandIds.length > 0) {
      const results = {
        scanned: 0,
        succeeded: 0,
        failed: 0,
        details: [] as Array<{ brandId: string; status: string; error?: string }>,
      };

      for (const brandId of brandIds) {
        const brand = await db.query.brands.findFirst({
          where: eq(brands.id, brandId),
        });

        if (!brand) {
          results.details.push({ brandId, status: "not_found" });
          continue;
        }

        const handles = extractHandles(brand.socialLinks as Record<string, string> | null);
        const platforms = Object.keys(handles) as ScannerPlatform[];

        if (platforms.length === 0) {
          results.details.push({ brandId, status: "no_handles" });
          continue;
        }

        try {
          const scanResults = await scanBrand({
            brandId,
            handles: handles as Record<ScannerPlatform, string>,
            platforms,
            options: {
              includeProfile: true,
              includePosts: true,
              includeMentions: true,
            },
          });

          await saveScanResults(brandId, brand.organizationId, scanResults);
          results.scanned++;
          results.succeeded++;
          results.details.push({ brandId, status: "success" });

          // Rate limiting
          if (brandIds.indexOf(brandId) < brandIds.length - 1) {
            await sleep(INTER_SCAN_DELAY);
          }
        } catch (error) {
          results.failed++;
          results.details.push({
            brandId,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Manually triggered scan for ${brandIds.length} brands`,
        results,
      });
    }

    // Otherwise, trigger normal cron-like scan with optional limit
    const limit = maxBrands && typeof maxBrands === "number"
      ? Math.min(maxBrands, MAX_SCANS_PER_RUN)
      : MAX_SCANS_PER_RUN;

    // Forward to GET handler logic
    const brandsToScan = await getBrandsToScan(limit);

    if (brandsToScan.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No brands need scanning",
        results: { scanned: 0, succeeded: 0, failed: 0 },
      });
    }

    // Process (same as GET but with custom limit)
    const results = {
      scanned: 0,
      succeeded: 0,
      failed: 0,
      details: [] as Array<{ brandId: string; brandName: string; status: string }>,
    };

    for (const brand of brandsToScan) {
      const handles = extractHandles(brand.socialLinks as Record<string, string> | null);
      const platforms = Object.keys(handles) as ScannerPlatform[];

      if (platforms.length === 0) continue;

      try {
        const scanResults = await scanBrand({
          brandId: brand.id,
          handles: handles as Record<ScannerPlatform, string>,
          platforms,
          options: {
            includeProfile: true,
            includePosts: true,
            includeMentions: true,
          },
        });

        await saveScanResults(brand.id, brand.organizationId, scanResults);
        results.scanned++;
        results.succeeded++;
        results.details.push({
          brandId: brand.id,
          brandName: brand.name,
          status: "success",
        });

        if (brandsToScan.indexOf(brand) < brandsToScan.length - 1) {
          await sleep(INTER_SCAN_DELAY);
        }
      } catch {
        results.failed++;
        results.details.push({
          brandId: brand.id,
          brandName: brand.name,
          status: "failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Manually triggered scan for ${results.scanned} brands`,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Manual trigger failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
