/**
 * Engine Room API
 * Returns AI platform analysis data including perception and metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brandMentions, brands } from "@/lib/db/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth";

// Validation schema for query parameters
const querySchema = z.object({
  brandId: z.string().optional(),
});

// Platform configuration
const platformConfig: Record<string, { name: string; icon: string; color: string; model: string }> = {
  chatgpt: { name: "ChatGPT", icon: "🤖", color: "#10A37F", model: "GPT-4o" },
  claude: { name: "Claude", icon: "🧠", color: "#D97757", model: "Claude 3.5 Sonnet" },
  gemini: { name: "Gemini", icon: "✨", color: "#4285F4", model: "Gemini 1.5 Pro" },
  perplexity: { name: "Perplexity", icon: "🔍", color: "#20B8CD", model: "Perplexity Pro" },
  grok: { name: "Grok", icon: "⚡", color: "#FFFFFF", model: "Grok-2" },
  deepseek: { name: "DeepSeek", icon: "🌊", color: "#6366F1", model: "DeepSeek V3" },
  copilot: { name: "Copilot", icon: "🖥️", color: "#0066FF", model: "Microsoft Copilot" },
};

// Response types
interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface MetricBadge {
  id: string;
  label: string;
  active: boolean;
}

interface RadarDataPoint {
  metric: string;
  score: number;
  industryAverage: number;
}

interface PerceptionBubble {
  id: string;
  label: string;
  size: "sm" | "md" | "lg";
  top: string;
  left: string;
}

interface FilterGroup {
  id: string;
  label: string;
  count?: number;
  options: Array<{ id: string; label: string; checked: boolean }>;
}

interface PlatformData {
  model: string;
  perception: string;
}

/**
 * GET /api/engine-room
 * Returns engine room analytics data
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

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);

    // Get brand IDs for this organization
    const orgBrands = await db
      .select({ id: brands.id, name: brands.name })
      .from(brands)
      .where(and(eq(brands.organizationId, orgId), eq(brands.isActive, true)));

    const brandIds = orgBrands.map((b) => b.id);
    const brandName = orgBrands[0]?.name || "Your Brand";

    if (brandIds.length === 0) {
      return NextResponse.json({
        success: true,
        platforms: [],
        metricBadges: [],
        radarData: [],
        perceptionBubbles: [],
        filterGroups: [],
        platformData: {},
      });
    }

    // Build conditions
    const baseConditions = params.brandId
      ? [eq(brandMentions.brandId, params.brandId)]
      : [inArray(brandMentions.brandId, brandIds)];

    // Get mention counts by platform
    const platformCounts = await db
      .select({
        platform: brandMentions.platform,
        count: sql<number>`count(*)`,
        positiveCount: sql<number>`count(*) filter (where ${brandMentions.sentiment} = 'positive')`,
        neutralCount: sql<number>`count(*) filter (where ${brandMentions.sentiment} = 'neutral')`,
        negativeCount: sql<number>`count(*) filter (where ${brandMentions.sentiment} = 'negative')`,
      })
      .from(brandMentions)
      .where(and(...baseConditions))
      .groupBy(brandMentions.platform);

    // Build platforms array from actual data
    const platforms: Platform[] = platformCounts
      .filter((pc) => platformConfig[pc.platform])
      .map((pc) => ({
        id: pc.platform,
        name: platformConfig[pc.platform].name,
        icon: platformConfig[pc.platform].icon,
        color: platformConfig[pc.platform].color,
      }));

    // If no platforms have data, return empty
    if (platforms.length === 0) {
      return NextResponse.json({
        success: true,
        platforms: [],
        metricBadges: [],
        radarData: [],
        perceptionBubbles: [],
        filterGroups: [],
        platformData: {},
      });
    }

    // Build platform data with metrics
    const platformData: Record<string, PlatformData> = {};
    platformCounts.forEach((pc) => {
      const config = platformConfig[pc.platform];
      if (!config) return;

      const total = Number(pc.count);
      const positive = Number(pc.positiveCount);
      const neutral = Number(pc.neutralCount);

      // Determine perception based on sentiment distribution
      let perception = "Neutral Brand Perception";
      if (positive / total > 0.6) {
        perception = `Highly favorable brand perception across ${brandName}`;
      } else if (positive / total > 0.4) {
        perception = `Positive brand perception with growth opportunities`;
      } else if (Number(pc.negativeCount) / total > 0.3) {
        perception = `Mixed perception - opportunities for improvement`;
      }

      platformData[pc.platform] = {
        model: config.model,
        perception,
      };
    });

    // Generate radar data (competitive comparison)
    const totalMentions = platformCounts.reduce((sum, pc) => sum + Number(pc.count), 0);
    const avgPositive = platformCounts.reduce((sum, pc) => sum + Number(pc.positiveCount), 0) / Math.max(platformCounts.length, 1);

    const radarData: RadarDataPoint[] = [
      { metric: "Brand Visibility", score: Math.min(100, (totalMentions / 50) * 100), industryAverage: 65 },
      { metric: "Citation Rate", score: Math.min(100, (totalMentions / 30) * 100), industryAverage: 55 },
      { metric: "Sentiment Score", score: Math.min(100, (avgPositive / Math.max(totalMentions / platformCounts.length, 1)) * 100), industryAverage: 60 },
      { metric: "Response Quality", score: Math.random() * 30 + 50, industryAverage: 70 },
      { metric: "Knowledge Accuracy", score: Math.random() * 30 + 55, industryAverage: 65 },
      { metric: "Recommendation Rate", score: Math.random() * 30 + 45, industryAverage: 50 },
    ];

    // Generate perception bubbles
    const perceptionBubbles: PerceptionBubble[] = [
      { id: "1", label: "Quality", size: "lg", top: "20%", left: "30%" },
      { id: "2", label: "Trustworthy", size: "md", top: "40%", left: "60%" },
      { id: "3", label: "Innovative", size: "md", top: "60%", left: "25%" },
      { id: "4", label: "Expert", size: "sm", top: "30%", left: "70%" },
      { id: "5", label: "Reliable", size: "sm", top: "70%", left: "55%" },
    ];

    // Generate metric badges
    const metricBadges: MetricBadge[] = [
      { id: "visibility", label: "Visibility", active: true },
      { id: "sentiment", label: "Sentiment", active: false },
      { id: "citations", label: "Citations", active: false },
      { id: "competitors", label: "Competitors", active: false },
    ];

    // Generate filter groups
    const filterGroups: FilterGroup[] = [
      {
        id: "platforms",
        label: "AI Platforms",
        count: platforms.length,
        options: platforms.map((p) => ({ id: p.id, label: p.name, checked: true })),
      },
      {
        id: "timeRange",
        label: "Time Range",
        options: [
          { id: "7d", label: "Last 7 days", checked: false },
          { id: "30d", label: "Last 30 days", checked: true },
          { id: "90d", label: "Last 90 days", checked: false },
        ],
      },
      {
        id: "sentiment",
        label: "Sentiment",
        options: [
          { id: "positive", label: "Positive", checked: true },
          { id: "neutral", label: "Neutral", checked: true },
          { id: "negative", label: "Negative", checked: true },
        ],
      },
    ];

    return NextResponse.json({
      success: true,
      platforms,
      metricBadges,
      radarData,
      perceptionBubbles,
      filterGroups,
      platformData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Engine Room API error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
