/**
 * Social Media API Route (Phase 7.4)
 *
 * Handles social media data queries for the Social Dashboard.
 * Returns summary, accounts, mentions, and metrics data.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialAccounts, socialMentions, socialMetrics, socialScores, serviceScanResults } from "@/lib/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { getOrganizationId } from "@/lib/auth";
import {
  calculateSMOScore,
  calculateSMOFromServiceScan,
  type SMOScoreInput,
  type ServiceScanData,
} from "@/lib/scoring/social-score";

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
  // PRIORITY 1: Check for service scan results (no OAuth required)
  const scanResults = await db
    .select()
    .from(serviceScanResults)
    .where(eq(serviceScanResults.brandId, brandId))
    .orderBy(desc(serviceScanResults.scannedAt));

  // PRIORITY 2: Get OAuth-connected accounts
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

  // Get latest stored social score
  const latestScore = await db
    .select()
    .from(socialScores)
    .where(eq(socialScores.brandId, brandId))
    .orderBy(desc(socialScores.date))
    .limit(1);

  // Initialize variables
  let smoScore = 0;
  let breakdown = {
    reach: 0,
    engagement: 0,
    sentiment: 50,
    growth: 50,
    consistency: 0,
  };
  let totalFollowers = 0;
  let totalEngagements = 0;
  let avgEngagementRate = 0;
  let avgSentiment = 0;
  let connectedAccounts = 0;
  let positiveMentions = 0;
  let negativeMentions = 0;
  let neutralMentions = 0;
  let dataSource: "service_scan" | "oauth" | "stored" | "calculated" = "calculated";

  // USE SERVICE SCAN DATA IF AVAILABLE (Phase 8.6 Integration)
  if (scanResults.length > 0) {
    // Convert database results to ServiceScanData format
    const serviceScanData: ServiceScanData[] = scanResults.map((r) => ({
      platform: r.platform,
      handle: r.targetHandle,
      followerCount: r.followerCount || 0,
      followingCount: r.followingCount || 0,
      postCount: r.postCount || 0,
      engagementRate: r.engagementRate || 0,
      avgLikes: r.avgLikes || 0,
      avgComments: r.avgComments || 0,
      avgShares: r.avgShares || 0,
      avgViews: r.avgViews || 0,
      postFrequency: r.postFrequency || 0,
      mentionsCount: r.mentionsCount || 0,
      sentimentPositive: r.sentimentPositive || 0,
      sentimentNeutral: r.sentimentNeutral || 0,
      sentimentNegative: r.sentimentNegative || 0,
      scannedAt: r.scannedAt || new Date(),
    }));

    // Calculate SMO score from service scan data
    const result = calculateSMOFromServiceScan(serviceScanData);
    smoScore = result.score;
    breakdown = result.breakdown;

    // Aggregate metrics from service scan
    totalFollowers = serviceScanData.reduce((sum, s) => sum + s.followerCount, 0);
    totalEngagements = serviceScanData.reduce(
      (sum, s) => sum + (s.avgLikes + s.avgComments + s.avgShares) * s.postCount,
      0
    );
    avgEngagementRate = totalFollowers > 0
      ? serviceScanData.reduce((sum, s) => sum + s.engagementRate * s.followerCount, 0) / totalFollowers
      : 0;

    // Aggregate sentiment from service scan
    positiveMentions = serviceScanData.reduce((sum, s) => sum + s.sentimentPositive, 0);
    negativeMentions = serviceScanData.reduce((sum, s) => sum + s.sentimentNegative, 0);
    neutralMentions = serviceScanData.reduce((sum, s) => sum + s.sentimentNeutral, 0);

    const totalSentiment = positiveMentions + neutralMentions + negativeMentions;
    avgSentiment = totalSentiment > 0 ? (positiveMentions - negativeMentions) / totalSentiment : 0;

    connectedAccounts = serviceScanData.length;
    dataSource = "service_scan";
  }
  // FALL BACK TO STORED SCORE
  else if (latestScore[0]) {
    smoScore = latestScore[0].overallScore || 0;
    breakdown = {
      reach: latestScore[0].reachScore || 0,
      engagement: latestScore[0].engagementScore || 0,
      sentiment: latestScore[0].sentimentScore || 50,
      growth: latestScore[0].growthScore || 50,
      consistency: latestScore[0].consistencyScore || 0,
    };
    dataSource = "stored";

    // Calculate aggregates from OAuth accounts
    totalFollowers = accounts.reduce((sum, acc) => sum + (acc.followersCount || 0), 0);
    totalEngagements = mentions.reduce(
      (sum, m) => sum + (m.engagementLikes || 0) + (m.engagementShares || 0) + (m.engagementComments || 0),
      0
    );
    connectedAccounts = accounts.length;

    // Sentiment from mentions
    positiveMentions = mentions.filter((m) => m.sentiment === "positive").length;
    negativeMentions = mentions.filter((m) => m.sentiment === "negative").length;
    neutralMentions = mentions.filter((m) => m.sentiment === "neutral").length;
  }
  // FALL BACK TO OAUTH DATA AND CALCULATE
  else if (accounts.length > 0) {
    totalFollowers = accounts.reduce((sum, acc) => sum + (acc.followersCount || 0), 0);
    totalEngagements = mentions.reduce(
      (sum, m) => sum + (m.engagementLikes || 0) + (m.engagementShares || 0) + (m.engagementComments || 0),
      0
    );

    // Calculate average engagement rate
    avgEngagementRate = totalFollowers > 0
      ? mentions.reduce((sum, m) => {
          const total = (m.engagementLikes || 0) + (m.engagementShares || 0) + (m.engagementComments || 0);
          return sum + total;
        }, 0) / totalFollowers
      : 0;

    // Sentiment from mentions
    positiveMentions = mentions.filter((m) => m.sentiment === "positive").length;
    negativeMentions = mentions.filter((m) => m.sentiment === "negative").length;
    neutralMentions = mentions.filter((m) => m.sentiment === "neutral").length;

    // Calculate average sentiment
    const sentimentScores = mentions.filter((m) => m.sentimentScore !== null);
    avgSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((sum, m) => sum + (m.sentimentScore || 0), 0) / sentimentScores.length
      : 0;

    connectedAccounts = accounts.length;

    // Calculate SMO score
    const input: SMOScoreInput = {
      totalFollowers,
      totalEngagements,
      avgEngagementRate,
      avgSentiment,
      connectedAccounts,
      followerGrowth30d: 0,
      postsLast30d: mentions.length,
    };
    const result = calculateSMOScore(input);
    smoScore = result.score;
    breakdown = result.breakdown;
    dataSource = "oauth";
  }

  // Determine trend (would need historical data for real trend)
  const smoTrend: "up" | "down" | "stable" = "stable";

  return NextResponse.json({
    brandId,
    brandName: "",
    summary: {
      smoScore,
      smoTrend,
      totalFollowers,
      totalEngagements,
      avgEngagementRate,
      avgSentiment,
      connectedAccounts,
      positiveMentions,
      negativeMentions,
      neutralMentions,
    },
    breakdown,
    dataSource,
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
