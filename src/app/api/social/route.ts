/**
 * Social Media API Route (Phase 7.4)
 *
 * Handles social media data queries for the Social Dashboard.
 * Returns summary, accounts, mentions, and metrics data.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialAccounts, socialMentions, socialMetrics, socialScores } from "@/lib/db/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { getOrganizationId } from "@/lib/auth";
import { calculateSMOScore, type SMOScoreInput } from "@/lib/scoring/social-score";

export async function GET(req: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");
    const type = searchParams.get("type") || "summary";

    if (!brandId) {
      return NextResponse.json({ error: "brandId is required" }, { status: 400 });
    }

    switch (type) {
      case "summary":
        return await getSocialSummary(brandId);
      case "accounts":
        return await getSocialAccounts(brandId);
      case "mentions":
        return await getSocialMentions(brandId);
      case "metrics":
        return await getSocialMetrics(brandId);
      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }
  } catch (error) {
    console.error("Social API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch social data" },
      { status: 500 }
    );
  }
}

async function getSocialSummary(brandId: string) {
  // Get connected accounts
  const accounts = await db
    .select()
    .from(socialAccounts)
    .where(and(eq(socialAccounts.brandId, brandId), eq(socialAccounts.isActive, true)));

  // Get recent mentions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const mentions = await db
    .select()
    .from(socialMentions)
    .where(
      and(
        eq(socialMentions.brandId, brandId),
        gte(socialMentions.createdAt, thirtyDaysAgo)
      )
    );

  // Get latest social score
  const latestScore = await db
    .select()
    .from(socialScores)
    .where(eq(socialScores.brandId, brandId))
    .orderBy(desc(socialScores.date))
    .limit(1);

  // Calculate aggregates
  const totalFollowers = accounts.reduce((sum, acc) => sum + (acc.followersCount || 0), 0);
  const totalEngagements = mentions.reduce(
    (sum, m) => sum + (m.engagementLikes || 0) + (m.engagementShares || 0) + (m.engagementComments || 0),
    0
  );

  // Calculate average engagement rate
  const engagementRates = accounts.filter((a) => a.followersCount && a.followersCount > 0);
  const avgEngagementRate =
    engagementRates.length > 0
      ? mentions.reduce((sum, m) => {
          const total = (m.engagementLikes || 0) + (m.engagementShares || 0) + (m.engagementComments || 0);
          return sum + total;
        }, 0) / (totalFollowers || 1)
      : 0;

  // Calculate sentiment distribution
  const positiveMentions = mentions.filter((m) => m.sentiment === "positive").length;
  const negativeMentions = mentions.filter((m) => m.sentiment === "negative").length;
  const neutralMentions = mentions.filter((m) => m.sentiment === "neutral").length;

  // Calculate average sentiment score
  const sentimentScores = mentions.filter((m) => m.sentimentScore !== null);
  const avgSentiment =
    sentimentScores.length > 0
      ? sentimentScores.reduce((sum, m) => sum + (m.sentimentScore || 0), 0) / sentimentScores.length
      : 0;

  // Calculate SMO score if no stored score
  let smoScore = latestScore[0]?.overallScore || 0;
  let breakdown = {
    reach: latestScore[0]?.reachScore || 0,
    engagement: latestScore[0]?.engagementScore || 0,
    sentiment: latestScore[0]?.sentimentScore || 50,
    growth: latestScore[0]?.growthScore || 50,
    consistency: latestScore[0]?.consistencyScore || 0,
  };

  // If no stored score, calculate it
  if (!latestScore[0]) {
    const input: SMOScoreInput = {
      totalFollowers,
      totalEngagements,
      avgEngagementRate,
      avgSentiment,
      connectedAccounts: accounts.length,
      followerGrowth30d: 0, // Would need historical data
      postsLast30d: mentions.length, // Using mentions as proxy
    };
    const result = calculateSMOScore(input);
    smoScore = result.score;
    breakdown = result.breakdown;
  }

  // Determine trend (would need historical data for real trend)
  const smoTrend: "up" | "down" | "stable" = "stable";

  return NextResponse.json({
    brandId,
    brandName: "", // Would need to fetch from brands table
    summary: {
      smoScore,
      smoTrend,
      totalFollowers,
      totalEngagements,
      avgEngagementRate,
      avgSentiment,
      connectedAccounts: accounts.length,
      positiveMentions,
      negativeMentions,
      neutralMentions,
    },
    breakdown,
    lastUpdated: new Date().toISOString(),
  });
}

async function getSocialAccounts(brandId: string) {
  const accounts = await db
    .select()
    .from(socialAccounts)
    .where(eq(socialAccounts.brandId, brandId))
    .orderBy(desc(socialAccounts.followersCount));

  return NextResponse.json({
    accounts: accounts.map((acc) => ({
      id: acc.id,
      platform: acc.platform,
      accountHandle: acc.accountHandle || "",
      accountName: acc.accountName || "",
      profileUrl: acc.profileUrl || "",
      avatarUrl: acc.avatarUrl,
      followersCount: acc.followersCount || 0,
      followingCount: acc.followingCount || 0,
      postsCount: acc.postsCount || 0,
      engagementRate: 0.02, // Default; would calculate from metrics
      isActive: acc.isActive,
      isVerified: acc.isVerified || false,
      connectionStatus: acc.connectionStatus || "connected",
      lastSyncedAt: acc.lastSyncedAt?.toISOString() || null,
    })),
    total: accounts.length,
  });
}

async function getSocialMentions(brandId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const mentions = await db
    .select()
    .from(socialMentions)
    .where(
      and(
        eq(socialMentions.brandId, brandId),
        gte(socialMentions.createdAt, thirtyDaysAgo)
      )
    )
    .orderBy(desc(socialMentions.postTimestamp))
    .limit(50);

  return NextResponse.json({
    mentions: mentions.map((m) => ({
      id: m.id,
      platform: m.platform,
      authorHandle: m.authorHandle || "",
      authorName: m.authorName || "",
      authorAvatarUrl: m.authorAvatarUrl,
      content: m.content || "",
      sentiment: m.sentiment || "neutral",
      sentimentScore: m.sentimentScore || 0,
      engagementLikes: m.engagementLikes || 0,
      engagementShares: m.engagementShares || 0,
      engagementComments: m.engagementComments || 0,
      engagementViews: m.engagementViews || 0,
      postTimestamp: m.postTimestamp?.toISOString() || m.createdAt.toISOString(),
      postUrl: m.postUrl,
    })),
    total: mentions.length,
  });
}

async function getSocialMetrics(brandId: string) {
  // Get last 30 days of metrics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

  const metrics = await db
    .select()
    .from(socialMetrics)
    .where(
      and(
        eq(socialMetrics.brandId, brandId),
        gte(socialMetrics.date, dateStr)
      )
    )
    .orderBy(desc(socialMetrics.date));

  return NextResponse.json({
    metrics: metrics.map((m) => ({
      id: m.id,
      platform: m.platform,
      date: m.date,
      followersCount: m.followersCount || 0,
      followersGain: m.followersGain || 0,
      engagementRate: m.engagementRate || 0,
      impressions: m.impressions || 0,
      reach: m.reach || 0,
      mentionsCount: m.mentionsCount || 0,
      avgSentimentScore: m.avgSentimentScore || 0,
    })),
    total: metrics.length,
  });
}

// POST handler for connecting accounts (placeholder)
export async function POST(req: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, brandId, platform, accountData } = body;

    if (action === "connect") {
      // Placeholder for OAuth connection flow
      // In real implementation, this would initiate OAuth flow
      return NextResponse.json({
        message: "OAuth connection initiated",
        redirectUrl: `/api/social/oauth/${platform}?brandId=${brandId}`,
      });
    }

    if (action === "disconnect") {
      const { accountId } = body;
      await db
        .update(socialAccounts)
        .set({ isActive: false, connectionStatus: "disconnected" })
        .where(eq(socialAccounts.id, accountId));

      return NextResponse.json({ success: true, message: "Account disconnected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Social API POST error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
