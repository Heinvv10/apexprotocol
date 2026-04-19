import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth/supabase-server";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

/**
 * Fetch metrics from WordPress API
 */
async function fetchWordPressMetrics(postId: number): Promise<{
  views: number;
  engagementScore: number;
} | null> {
  try {
    const wordpressUrl = process.env.WORDPRESS_URL;
    const wordpressUsername = process.env.WORDPRESS_USERNAME;
    const wordpressAppPassword = process.env.WORDPRESS_APP_PASSWORD;

    if (!wordpressUrl || !wordpressUsername || !wordpressAppPassword) {
      return null;
    }

    const credentials = `${wordpressUsername}:${wordpressAppPassword}`;
    const base64Credentials = Buffer.from(credentials).toString("base64");
    const authHeader = `Basic ${base64Credentials}`;

    const response = await fetch(
      `${wordpressUrl}/wp-json/wp/v2/posts/${postId}`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const post = await response.json();

    return {
      views: post.views || 0,
      engagementScore: post.comment_count || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Sync metrics for a content item from external platforms
 */
async function syncMetrics(
  contentId: string,
  orgId: string
): Promise<void> {
  const { db } = await import("@/lib/db");
  const { publishingHistory, contentMetrics } = await import("@/lib/db/schema");
  const { eq, and } = await import("drizzle-orm");

  const publishedPosts = await db
    .select()
    .from(publishingHistory)
    .where(eq(publishingHistory.contentId, contentId));

  for (const post of publishedPosts) {
    let metrics = null;

    if (post.platform === "wordpress") {
      const externalId = parseInt(post.externalId, 10);
      if (!isNaN(externalId)) {
        metrics = await fetchWordPressMetrics(externalId);
      }
    }

    if (metrics) {
      const existingMetric = await db
        .select()
        .from(contentMetrics)
        .where(
          and(
            eq(contentMetrics.contentId, contentId),
            eq(contentMetrics.platform, post.platform)
          )
        )
        .limit(1);

      if (existingMetric.length > 0) {
        await db
          .update(contentMetrics)
          .set({
            views: metrics.views,
            engagementScore: metrics.engagementScore,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(contentMetrics.contentId, contentId),
              eq(contentMetrics.platform, post.platform)
            )
          );
      } else {
        await db.insert(contentMetrics).values({
          contentId,
          platform: post.platform,
          views: metrics.views,
          engagementScore: metrics.engagementScore,
          lastSyncedAt: new Date(),
        });
      }
    }
  }
}

/**
 * GET /api/content/metrics
 * Fetches and syncs content performance data
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Database not configured. Please set DATABASE_URL." },
        { status: 503 }
      );
    }

    const { searchParams } = request.nextUrl;
    const contentId = searchParams.get("contentId");

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: "contentId query parameter is required" },
        { status: 400 }
      );
    }

    const { db } = await import("@/lib/db");
    const { contentItems, contentMetrics } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const content = await db
      .select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.id, contentId),
          eq(contentItems.organizationId, orgId)
        )
      )
      .limit(1);

    if (content.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    await syncMetrics(contentId, orgId);

    const metrics = await db
      .select()
      .from(contentMetrics)
      .where(eq(contentMetrics.contentId, contentId));

    const aggregatedMetrics = {
      totalViews: metrics.reduce((sum, m) => sum + m.views, 0),
      totalEngagement: metrics.reduce((sum, m) => sum + m.engagementScore, 0),
      byPlatform: metrics.map((m) => ({
        platform: m.platform,
        views: m.views,
        engagementScore: m.engagementScore,
        lastSyncedAt: m.lastSyncedAt,
      })),
    };

    return NextResponse.json({
      success: true,
      data: {
        contentId,
        metrics: aggregatedMetrics,
        lastSynced: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
