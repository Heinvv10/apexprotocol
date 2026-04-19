/**
 * Twitter Mentions API Route
 *
 * Endpoint for fetching and storing Twitter/X brand mentions.
 * Uses Twitter API v2 search endpoint via the TwitterScanner.
 *
 * POST /api/social/twitter/mentions - Fetch and store mentions for a brand
 * GET /api/social/twitter/mentions - Get stored mentions for a brand
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId, getUserId } from "@/lib/auth/supabase-server";
import { z } from "zod";
import { db } from "@/lib/db";
import { socialMentions, brands } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TwitterScanner, type BrandMention } from "@/lib/social-scanner";

// ============================================================================
// Request Validation
// ============================================================================

const mentionsRequestSchema = z.object({
  brandId: z.string().min(1, "Brand ID is required"),
  keywords: z.array(z.string().min(1)).min(1, "At least one keyword is required"),
  options: z.object({
    limit: z.number().min(1).max(100).optional(),
    since: z.string().datetime().optional(),
  }).optional(),
});

const getMentionsQuerySchema = z.object({
  brandId: z.string().min(1, "Brand ID is required"),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

// ============================================================================
// GET - Retrieve Stored Mentions
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const limitParam = searchParams.get("limit");

    const parseResult = getMentionsQuerySchema.safeParse({
      brandId,
      limit: limitParam ? parseInt(limitParam, 10) : undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { brandId: validBrandId, limit } = parseResult.data;

    // Verify brand exists
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, validBrandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Fetch stored mentions
    const mentions = await db
      .select()
      .from(socialMentions)
      .where(
        and(
          eq(socialMentions.brandId, validBrandId),
          eq(socialMentions.platform, "twitter")
        )
      )
      .orderBy(desc(socialMentions.postTimestamp))
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: {
        brandId: validBrandId,
        platform: "twitter",
        mentions: mentions.map((m) => ({
          id: m.id,
          postId: m.postId,
          postUrl: m.postUrl,
          authorHandle: m.authorHandle,
          authorName: m.authorName,
          authorFollowers: m.authorFollowers,
          content: m.content,
          sentiment: m.sentiment,
          sentimentScore: m.sentimentScore,
          engagement: {
            likes: m.engagementLikes,
            shares: m.engagementShares,
            comments: m.engagementComments,
            views: m.engagementViews,
          },
          postTimestamp: m.postTimestamp?.toISOString(),
          createdAt: m.createdAt.toISOString(),
        })),
        total: mentions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching Twitter mentions:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentions" },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper: Store Mentions in Database
// ============================================================================

async function storeMentionsToDb(
  brandId: string,
  mentions: BrandMention[]
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const mention of mentions) {
    // Check if mention already exists
    const existing = await db.query.socialMentions.findFirst({
      where: and(
        eq(socialMentions.brandId, brandId),
        eq(socialMentions.postId, mention.postId)
      ),
    });

    if (existing) {
      // Update engagement metrics
      await db
        .update(socialMentions)
        .set({
          engagementLikes: mention.metrics?.likes || 0,
          engagementShares: mention.metrics?.shares || 0,
          engagementComments: mention.metrics?.comments || 0,
          engagementViews: mention.metrics?.views || 0,
        })
        .where(eq(socialMentions.id, existing.id));
      updated++;
    } else {
      // Insert new mention
      await db.insert(socialMentions).values({
        brandId,
        platform: "twitter",
        postId: mention.postId,
        postUrl: mention.postUrl,
        authorHandle: mention.authorUsername,
        authorName: mention.authorDisplayName,
        authorFollowers: mention.authorFollowers,
        content: mention.content,
        contentType: "text",
        sentiment: (mention.sentiment === "positive" || mention.sentiment === "neutral" || mention.sentiment === "negative")
          ? mention.sentiment
          : null,
        engagementLikes: mention.metrics?.likes || 0,
        engagementShares: mention.metrics?.shares || 0,
        engagementComments: mention.metrics?.comments || 0,
        engagementViews: mention.metrics?.views || 0,
        postTimestamp: mention.publishedAt instanceof Date
          ? mention.publishedAt
          : new Date(mention.publishedAt),
      });
      inserted++;
    }
  }

  return { inserted, updated };
}

// ============================================================================
// POST - Fetch and Store Mentions
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const parseResult = mentionsRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { brandId, keywords, options } = parseResult.data;

    // Verify brand exists
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Check if Twitter scanner is configured
    if (!TwitterScanner.isConfigured()) {
      return NextResponse.json(
        {
          error: "Twitter scanner not configured",
          message: "Set TWITTER_BEARER_TOKEN environment variable to enable Twitter mention scanning.",
          documentation: "https://developer.twitter.com/en/docs/authentication/oauth-2-0/bearer-tokens",
        },
        { status: 503 }
      );
    }

    // Search for mentions using TwitterScanner
    const searchOptions = {
      limit: options?.limit || 50,
      since: options?.since ? new Date(options.since) : undefined,
    };

    const result = await TwitterScanner.searchMentions(keywords, searchOptions);

    // Handle rate limit errors
    if (!result.success && result.error?.code === "RATE_LIMIT_EXCEEDED") {
      const retryAfter = result.error.retryAfter || 900; // Default to 15 minutes
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Twitter API rate limit reached. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
          retryAfter,
        },
        { status: 429 }
      );
    }

    // Handle other errors
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to fetch mentions",
          message: result.error?.message || "Unknown error occurred",
          code: result.error?.code,
          retryable: result.error?.retryable,
        },
        { status: 503 }
      );
    }

    const mentions = result.data || [];

    // Store mentions in database
    const storageResult = await storeMentionsToDb(brandId, mentions);

    return NextResponse.json({
      success: true,
      data: {
        brandId,
        platform: "twitter",
        keywords,
        mentions: mentions.map((m) => ({
          postId: m.postId,
          postUrl: m.postUrl,
          authorHandle: m.authorUsername,
          authorName: m.authorDisplayName,
          authorFollowers: m.authorFollowers,
          content: m.content,
          sentiment: m.sentiment,
          engagement: {
            likes: m.metrics?.likes || 0,
            shares: m.metrics?.shares || 0,
            comments: m.metrics?.comments || 0,
            views: m.metrics?.views || 0,
          },
          publishedAt: m.publishedAt instanceof Date
            ? m.publishedAt.toISOString()
            : m.publishedAt,
          matchedKeywords: m.matchedKeywords,
        })),
        summary: {
          fetched: mentions.length,
          inserted: storageResult.inserted,
          updated: storageResult.updated,
        },
        pagination: result.pagination,
        scannedAt: result.scannedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching Twitter mentions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch mentions",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
