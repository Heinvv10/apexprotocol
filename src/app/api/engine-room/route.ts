/**
 * Engine Room API
 * Returns AI platform analysis data including perception and metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brandMentions, brands } from "@/lib/db/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/supabase-server";

// Validation schema for query parameters
const querySchema = z.object({
  brandId: z.string().optional(),
  timeRange: z.enum(['7d', '30d', '90d']).optional().default('30d'),
  platform: z.string().optional(), // Filter by specific platform (chatgpt, claude, gemini, etc.)
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

    // Calculate time range cutoff
    const timeRangeDays = params.timeRange === '7d' ? 7 : params.timeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRangeDays);

    // Build conditions
    const brandCondition = params.brandId
      ? eq(brandMentions.brandId, params.brandId)
      : inArray(brandMentions.brandId, brandIds);

    const timeCondition = sql`${brandMentions.timestamp} >= ${cutoffDate}`;

    // Add platform filter if specified
    const platformCondition = params.platform
      ? eq(brandMentions.platform, params.platform as any)
      : undefined;

    const baseConditions = platformCondition
      ? [brandCondition, timeCondition, platformCondition]
      : [brandCondition, timeCondition];

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

    // Calculate radar data from REAL database metrics
    const totalMentions = platformCounts.reduce((sum, pc) => sum + Number(pc.count), 0);
    const avgPositive = platformCounts.reduce((sum, pc) => sum + Number(pc.positiveCount), 0) / Math.max(platformCounts.length, 1);
    const avgMentionsPerPlatform = totalMentions / Math.max(platformCounts.length, 1);

    // Get citation count from database
    const citationCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(brandMentions)
      .where(and(...baseConditions, sql`${brandMentions.citationUrl} IS NOT NULL`));

    const totalCitations = Number(citationCount[0]?.count || 0);

    // Get position-based metrics (mentions where brand appears in top 3)
    const topPositionCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(brandMentions)
      .where(and(...baseConditions, sql`${brandMentions.position} <= 3`));

    const topPositions = Number(topPositionCount[0]?.count || 0);

    // Get recommendation count (mentions with "recommendation" prompt category)
    const recommendationCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(brandMentions)
      .where(and(...baseConditions, eq(brandMentions.promptCategory, "recommendation")));

    const recommendations = Number(recommendationCount[0]?.count || 0);

    // Calculate REAL metrics from database data
    const radarData: RadarDataPoint[] = [
      {
        metric: "Brand Visibility",
        score: Math.min(100, (totalMentions / 50) * 100), // More mentions = higher visibility
        industryAverage: 65
      },
      {
        metric: "Citation Rate",
        score: totalMentions > 0 ? Math.min(100, (totalCitations / totalMentions) * 100) : 0, // Real citation percentage
        industryAverage: 55
      },
      {
        metric: "Sentiment Score",
        score: totalMentions > 0 ? Math.min(100, (avgPositive / avgMentionsPerPlatform) * 100) : 0, // Real sentiment ratio
        industryAverage: 60
      },
      {
        metric: "Response Quality",
        score: totalMentions > 0 ? Math.min(100, (topPositions / totalMentions) * 100) : 0, // Brands in top 3 positions = quality
        industryAverage: 70
      },
      {
        metric: "Knowledge Accuracy",
        score: totalMentions > 0 ? Math.min(100, ((totalMentions - Number(platformCounts.reduce((sum, pc) => sum + Number(pc.negativeCount), 0))) / totalMentions) * 100) : 0, // Non-negative mentions = accurate
        industryAverage: 65
      },
      {
        metric: "Recommendation Rate",
        score: totalMentions > 0 ? Math.min(100, (recommendations / totalMentions) * 100) : 0, // Real recommendation percentage
        industryAverage: 50
      },
    ];

    // Extract perception keywords from REAL AI responses
    const perceptionKeywords = await db
      .select({ response: brandMentions.response })
      .from(brandMentions)
      .where(and(...baseConditions, eq(brandMentions.sentiment, "positive")))
      .limit(100);

    // Extract common positive keywords from responses
    const keywordCounts: Record<string, number> = {};
    const perceptionWords = [
      "quality", "trustworthy", "innovative", "expert", "reliable",
      "professional", "leading", "trusted", "excellent", "best",
      "fast", "efficient", "convenient", "comprehensive", "secure"
    ];

    perceptionKeywords.forEach((mention) => {
      const lowerResponse = mention.response.toLowerCase();
      perceptionWords.forEach((word) => {
        if (lowerResponse.includes(word)) {
          keywordCounts[word] = (keywordCounts[word] || 0) + 1;
        }
      });
    });

    // Sort keywords by frequency and take top 5
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Generate perception bubbles from REAL keyword frequency
    const perceptionBubbles: PerceptionBubble[] = topKeywords.length > 0
      ? topKeywords.map((keyword, index) => {
          const frequency = keyword[1];
          const maxFrequency = Math.max(...topKeywords.map((k) => k[1]));
          const size = frequency / maxFrequency > 0.7 ? "lg" : frequency / maxFrequency > 0.4 ? "md" : "sm";

          // Position bubbles in a circular pattern
          const angle = (index / topKeywords.length) * 2 * Math.PI;
          const radius = 35; // 35% from center
          const centerX = 50;
          const centerY = 50;

          return {
            id: String(index + 1),
            label: keyword[0].charAt(0).toUpperCase() + keyword[0].slice(1),
            size,
            top: `${centerY + radius * Math.sin(angle)}%`,
            left: `${centerX + radius * Math.cos(angle)}%`,
          };
        })
      : [
          // Fallback to generic bubbles if no positive mentions yet
          { id: "1", label: "Quality", size: "md", top: "50%", left: "50%" },
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
