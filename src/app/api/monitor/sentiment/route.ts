import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * Monitor - Sentiment Analysis API (F091)
 * Analyze sentiment of brand mentions using AI
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { db, schema } from "@/lib/db";
import { eq, and, isNull } from "drizzle-orm";
import { analyzeSentiment } from "@/lib/ai/claude";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { trackUsage } from "@/lib/ai/token-tracker";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(orgId, "sentiment_analysis");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          resetAt: rateLimitResult.resetAt.toISOString(),
          remaining: rateLimitResult.remaining
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { mentionIds, brandId, text } = body;

    // Option 1: Analyze specific mention IDs
    if (mentionIds && Array.isArray(mentionIds) && mentionIds.length > 0) {
      const results = await analyzeMentionsBatch(mentionIds, orgId, userId);
      return NextResponse.json({ results, analyzed: results.length });
    }

    // Option 2: Analyze mentions for a brand that don't have sentiment
    if (brandId) {
      const unanalyzedMentions = await db.query.brandMentions.findMany({
        where: and(
          eq(schema.brandMentions.brandId, brandId),
          isNull(schema.brandMentions.sentiment)
        ),
        limit: 50, // Process in batches
      });

      const results = await analyzeMentionsBatch(
        unanalyzedMentions.map(m => m.id),
        orgId,
        userId
      );

      return NextResponse.json({
        results,
        analyzed: results.length,
        remaining: unanalyzedMentions.length - results.length
      });
    }

    // Option 3: Analyze raw text
    if (text && typeof text === "string") {
      const analysis = await analyzeSentiment(text);

      // Track usage
      await trackUsage({
        organizationId: orgId,
        userId,
        provider: "claude",
        model: "claude-sonnet-4-20250514",
        operation: "sentiment_analysis",
        inputTokens: analysis.usage?.input_tokens || 0,
        outputTokens: analysis.usage?.output_tokens || 0,
      });

      return NextResponse.json({
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
      });
    }

    return NextResponse.json(
      { error: "Invalid request. Provide mentionIds, brandId, or text." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze sentiment" },
      { status: 500 }
    );
  }
}

async function analyzeMentionsBatch(
  mentionIds: string[],
  orgId: string,
  userId: string
): Promise<Array<{ id: string; sentiment: string; confidence: number }>> {
  const results: Array<{ id: string; sentiment: string; confidence: number }> = [];

  for (const mentionId of mentionIds) {
    try {
      // Get mention
      const mention = await db.query.brandMentions.findFirst({
        where: eq(schema.brandMentions.id, mentionId),
      });

      if (!mention || !mention.response) continue;

      // Analyze sentiment
      const analysis = await analyzeSentiment(mention.response);

      // Map sentiment to valid enum values (schema uses positive/neutral/negative)
      const mappedSentiment = analysis.sentiment === "mixed" ? "neutral" : analysis.sentiment;

      // Update mention with sentiment
      await db.update(schema.brandMentions)
        .set({
          sentiment: mappedSentiment as "positive" | "negative" | "neutral",
        })
        .where(eq(schema.brandMentions.id, mentionId));

      // Track usage
      await trackUsage({
        organizationId: orgId,
        userId,
        provider: "claude",
        model: "claude-sonnet-4-20250514",
        operation: "sentiment_analysis",
        inputTokens: analysis.usage?.input_tokens || 0,
        outputTokens: analysis.usage?.output_tokens || 0,
      });

      results.push({
        id: mentionId,
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
      });
    } catch (error) {
      console.error(`Error analyzing mention ${mentionId}:`, error);
    }
  }

  return results;
}

// GET - Get sentiment statistics for a brand
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Get sentiment distribution
    const mentions = await db.query.brandMentions.findMany({
      where: eq(schema.brandMentions.brandId, brandId),
      columns: {
        sentiment: true,
      },
    });

    const stats = {
      total: mentions.length,
      positive: mentions.filter(m => m.sentiment === "positive").length,
      negative: mentions.filter(m => m.sentiment === "negative").length,
      neutral: mentions.filter(m => m.sentiment === "neutral").length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching sentiment stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch sentiment statistics" },
      { status: 500 }
    );
  }
}
