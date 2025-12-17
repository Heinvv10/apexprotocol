/**
 * Social Scan API Route
 *
 * Service-level social media scanning endpoint.
 * Uses Apex's own API keys to scan ANY brand's public social data.
 *
 * POST /api/social/scan - Trigger a brand scan
 * GET /api/social/scan - Get scanner status
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { serviceScanResults, brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  scanBrand,
  quickScan,
  getScannerStatus,
  getConfiguredPlatformNames,
  type ScannerPlatform,
  type BatchScanResult,
} from "@/lib/social-scanner";

// ============================================================================
// Request Validation
// ============================================================================

const scanRequestSchema = z.object({
  brandId: z.string().min(1, "Brand ID is required"),
  handles: z.object({
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    facebook: z.string().optional(),
  }),
  platforms: z.array(z.enum(["twitter", "youtube", "facebook"])).optional(),
  options: z.object({
    includeProfile: z.boolean().optional(),
    includePosts: z.boolean().optional(),
    includeMentions: z.boolean().optional(),
    postsLimit: z.number().min(1).max(100).optional(),
    mentionsLimit: z.number().min(1).max(100).optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  quickScan: z.boolean().optional(),
});

// ============================================================================
// GET - Scanner Status
// ============================================================================

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = getScannerStatus();

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        documentation: {
          twitter: "Set TWITTER_BEARER_TOKEN in environment",
          youtube: "Set YOUTUBE_API_KEY in environment",
          facebook: "Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in environment",
        },
      },
    });
  } catch (error) {
    console.error("Error getting scanner status:", error);
    return NextResponse.json(
      { error: "Failed to get scanner status" },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper: Save Scan Results to Database
// ============================================================================

async function saveScanResultsToDb(
  organizationId: string,
  brandId: string,
  result: BatchScanResult,
  handles: Record<string, string | undefined>
): Promise<void> {
  const now = new Date();
  const nextScan = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now

  for (const [platform, platformResult] of Object.entries(result.results)) {
    const handle = handles[platform];
    if (!handle) continue;

    // Calculate aggregated metrics from scan data
    const profile = platformResult.profile;
    const posts = platformResult.posts || [];
    const mentions = platformResult.mentions || [];

    // Calculate average engagement
    let avgLikes = 0;
    let avgComments = 0;
    let avgShares = 0;
    let avgViews = 0;
    let totalEngagement = 0;

    if (posts.length > 0) {
      avgLikes = Math.round(posts.reduce((sum, p) => sum + (p.metrics?.likes || 0), 0) / posts.length);
      avgComments = Math.round(posts.reduce((sum, p) => sum + (p.metrics?.comments || 0), 0) / posts.length);
      avgShares = Math.round(posts.reduce((sum, p) => sum + (p.metrics?.shares || 0), 0) / posts.length);
      avgViews = Math.round(posts.reduce((sum, p) => sum + (p.metrics?.views || 0), 0) / posts.length);
      totalEngagement = posts.reduce((sum, p) => {
        const m = p.metrics;
        return sum + (m?.likes || 0) + (m?.comments || 0) + (m?.shares || 0);
      }, 0);
    }

    // Calculate engagement rate
    const followerCount = profile?.followerCount || 0;
    const engagementRate = followerCount > 0 && posts.length > 0
      ? (totalEngagement / posts.length / followerCount) * 100
      : 0;

    // Calculate post frequency (posts per day based on date range)
    let postFrequency = 0;
    if (posts.length >= 2) {
      const dates = posts.map(p => new Date(p.publishedAt).getTime()).sort((a, b) => a - b);
      const dayRange = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24);
      if (dayRange > 0) {
        postFrequency = posts.length / dayRange;
      }
    }

    // Calculate sentiment breakdown
    let sentimentPositive = 0;
    let sentimentNeutral = 0;
    let sentimentNegative = 0;

    for (const mention of mentions) {
      if (mention.sentiment === "positive") sentimentPositive++;
      else if (mention.sentiment === "negative") sentimentNegative++;
      else sentimentNeutral++;
    }

    // Determine scan status
    const scanStatus = platformResult.error
      ? "failed"
      : profile && posts.length > 0
        ? "success"
        : profile
          ? "partial"
          : "failed";

    // Upsert scan result
    await db
      .insert(serviceScanResults)
      .values({
        organizationId,
        brandId,
        platform: platform as typeof serviceScanResults.platform.enumValues[number],
        platformAccountId: profile?.platformId || null,
        targetHandle: handle,
        profileData: profile ? {
          platformId: profile.platformId,
          handle: profile.username,
          displayName: profile.displayName,
          bio: profile.bio || undefined,
          followerCount: profile.followerCount,
          followingCount: profile.followingCount || 0,
          postCount: profile.postCount || 0,
          isVerified: profile.isVerified,
          profileUrl: profile.profileUrl,
          avatarUrl: profile.avatarUrl || undefined,
          platformSpecific: profile.platformSpecific,
        } : null,
        postsData: posts.map(p => ({
          postId: p.postId,
          content: p.content,
          postType: p.postType,
          publishedAt: p.publishedAt,
          engagement: {
            likes: p.metrics?.likes || 0,
            comments: p.metrics?.comments || 0,
            shares: p.metrics?.shares || 0,
            views: p.metrics?.views,
          },
          postUrl: p.postUrl,
        })),
        mentionsData: mentions.map(m => ({
          postId: m.mentionId,
          authorHandle: m.authorUsername,
          content: m.content,
          sentiment: m.sentiment,
          sentimentScore: m.sentimentScore,
          engagement: {
            likes: m.metrics?.likes || 0,
            comments: m.metrics?.comments || 0,
            shares: m.metrics?.shares || 0,
          },
          mentionedAt: m.mentionedAt,
          postUrl: m.postUrl,
        })),
        followerCount,
        followingCount: profile?.followingCount || 0,
        postCount: profile?.postCount || 0,
        engagementRate: Math.round(engagementRate * 100) / 100,
        avgLikes,
        avgComments,
        avgShares,
        avgViews,
        postFrequency: Math.round(postFrequency * 100) / 100,
        mentionsCount: mentions.length,
        sentimentPositive,
        sentimentNeutral,
        sentimentNegative,
        scanStatus,
        errorCode: platformResult.error ? "SCAN_ERROR" : null,
        errorMessage: platformResult.error || null,
        scannedAt: now,
        nextScanAt: nextScan,
      })
      .onConflictDoUpdate({
        target: [
          serviceScanResults.brandId,
          serviceScanResults.platform,
          serviceScanResults.targetHandle,
        ],
        set: {
          platformAccountId: profile?.platformId || null,
          profileData: profile ? {
            platformId: profile.platformId,
            handle: profile.username,
            displayName: profile.displayName,
            bio: profile.bio || undefined,
            followerCount: profile.followerCount,
            followingCount: profile.followingCount || 0,
            postCount: profile.postCount || 0,
            isVerified: profile.isVerified,
            profileUrl: profile.profileUrl,
            avatarUrl: profile.avatarUrl || undefined,
            platformSpecific: profile.platformSpecific,
          } : null,
          postsData: posts.map(p => ({
            postId: p.postId,
            content: p.content,
            postType: p.postType,
            publishedAt: p.publishedAt,
            engagement: {
              likes: p.metrics?.likes || 0,
              comments: p.metrics?.comments || 0,
              shares: p.metrics?.shares || 0,
              views: p.metrics?.views,
            },
            postUrl: p.postUrl,
          })),
          mentionsData: mentions.map(m => ({
            postId: m.mentionId,
            authorHandle: m.authorUsername,
            content: m.content,
            sentiment: m.sentiment,
            sentimentScore: m.sentimentScore,
            engagement: {
              likes: m.metrics?.likes || 0,
              comments: m.metrics?.comments || 0,
              shares: m.metrics?.shares || 0,
            },
            mentionedAt: m.mentionedAt,
            postUrl: m.postUrl,
          })),
          followerCount,
          followingCount: profile?.followingCount || 0,
          postCount: profile?.postCount || 0,
          engagementRate: Math.round(engagementRate * 100) / 100,
          avgLikes,
          avgComments,
          avgShares,
          avgViews,
          postFrequency: Math.round(postFrequency * 100) / 100,
          mentionsCount: mentions.length,
          sentimentPositive,
          sentimentNeutral,
          sentimentNegative,
          scanStatus,
          errorCode: platformResult.error ? "SCAN_ERROR" : null,
          errorMessage: platformResult.error || null,
          scannedAt: now,
          nextScanAt: nextScan,
          updatedAt: now,
        },
      });
  }
}

// ============================================================================
// POST - Trigger Scan
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const parseResult = scanRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { brandId, handles, platforms, options, quickScan: isQuickScan } = parseResult.data;

    // Verify brand exists and get organization ID
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const organizationId = brand.organizationId;

    // Check if any scanners are configured
    const configuredPlatforms = getConfiguredPlatformNames();
    if (configuredPlatforms.length === 0) {
      return NextResponse.json(
        {
          error: "No social scanners configured",
          message: "Set up API credentials for Twitter, YouTube, or Facebook to enable scanning.",
          documentation: {
            twitter: "Set TWITTER_BEARER_TOKEN in environment",
            youtube: "Set YOUTUBE_API_KEY in environment",
            facebook: "Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in environment",
          },
        },
        { status: 503 }
      );
    }

    // Check if any handles were provided
    const providedHandles = Object.entries(handles).filter(
      ([, value]) => value && value.trim().length > 0
    );

    if (providedHandles.length === 0) {
      return NextResponse.json(
        {
          error: "No social handles provided",
          message: "Provide at least one social handle to scan (twitter, youtube, or facebook).",
        },
        { status: 400 }
      );
    }

    // Perform scan
    if (isQuickScan) {
      // Quick scan - profiles only
      const results = await quickScan(handles);

      const resultsObject: Record<string, unknown> = {};
      results.forEach((value, key) => {
        resultsObject[key] = value;
      });

      return NextResponse.json({
        success: true,
        data: {
          type: "quick_scan",
          brandId,
          results: resultsObject,
          scannedAt: new Date().toISOString(),
        },
      });
    }

    // Full scan
    const result = await scanBrand({
      brandId,
      platforms: (platforms || []) as ScannerPlatform[],
      handles,
      options,
    });

    // Save results to database (async, don't block response)
    saveScanResultsToDb(organizationId, brandId, result, handles).catch((err) => {
      console.error("Error saving scan results to database:", err);
    });

    return NextResponse.json({
      success: true,
      data: {
        type: "full_scan",
        ...result,
        savedToDatabase: true,
      },
    });
  } catch (error) {
    console.error("Error performing social scan:", error);
    return NextResponse.json(
      {
        error: "Failed to perform social scan",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
