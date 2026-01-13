import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Content - AI Suggestions API
 * Transform request format and generate content improvement suggestions
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { routeMessage, LLMProvider } from "@/lib/ai/router";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { trackUsage } from "@/lib/ai/token-tracker";

interface ContentSuggestionRequest {
  content: string;
  type?: string;
  brandId?: string;
  targetKeywords?: string[];
}

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
    const rateLimitResult = await checkRateLimit(orgId, "content_generation");
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

    const body: ContentSuggestionRequest = await request.json();
    const { content, type, brandId, targetKeywords } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Get brand context if provided
    let brandContext = "";
    if (brandId) {
      const brand = await db.query.brands.findFirst({
        where: eq(schema.brands.id, brandId),
      });
      if (brand) {
        const voiceSettings = brand.voice as { targetAudience?: string; tone?: string } | null;
        brandContext = `
Brand: ${brand.name}
Industry: ${brand.industry || "Not specified"}
Description: ${brand.description || ""}
Target Audience: ${voiceSettings?.targetAudience || "General"}
Voice: ${voiceSettings?.tone || "Professional"}
`;
      }
    }

    // Generate content improvement suggestions
    const result = await generateContentSuggestions({
      content,
      contentType: type || "general",
      brandContext,
      targetKeywords,
      orgId,
      userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}

async function generateContentSuggestions(options: {
  content: string;
  contentType: string;
  brandContext?: string;
  targetKeywords?: string[];
  orgId: string;
  userId: string;
}): Promise<{
  suggestions: Array<{
    type: string;
    original?: string;
    suggested: string;
    explanation: string;
    impact?: string;
  }>;
}> {
  const { content, contentType, brandContext, targetKeywords, orgId, userId } = options;

  const systemPrompt = `You are a content optimization expert for AI search engines and SEO.
Analyze content and provide specific, actionable suggestions for improvement.
Focus on GEO (Generative Engine Optimization), SEO, readability, and engagement.
${brandContext}`;

  const userPrompt = `Analyze this ${contentType} content and provide 3-5 specific improvement suggestions.

Content:
---
${content}
---
${targetKeywords?.length ? `Target keywords: ${targetKeywords.join(", ")}` : ""}

For each suggestion, provide:
1. type: Category of improvement (seo, readability, tone, structure, keywords, engagement)
2. suggested: The specific improvement or text to add/change
3. explanation: How this improves GEO/SEO metrics and why it matters
4. impact: high, medium, or low

Format your response as a JSON object with a "suggestions" array.
Example:
{
  "suggestions": [
    {
      "type": "seo",
      "suggested": "Add semantic keywords related to 'AI optimization' in the first paragraph",
      "explanation": "This helps AI systems understand topic relevance and improves featured snippet chances by 40%",
      "impact": "high"
    }
  ]
}`;

  // Route to appropriate LLM
  const response = await routeMessage(systemPrompt, userPrompt, {
    provider: "claude" as LLMProvider,
    maxTokens: 4000,
  });

  // Track usage
  await trackUsage({
    organizationId: orgId,
    userId,
    provider: response.provider,
    model: response.model,
    operation: "content_suggestions",
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  });

  // Parse JSON response
  let suggestions: Array<{
    type: string;
    original?: string;
    suggested: string;
    explanation: string;
    impact?: string;
  }> = [];

  try {
    // Extract JSON from response
    const jsonMatch = response.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.content.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      suggestions = parsed.suggestions || [];
    } else {
      // Fallback: try to parse the entire response
      const parsed = JSON.parse(response.content);
      suggestions = parsed.suggestions || [];
    }
  } catch {
    // If parsing fails, return a generic suggestion
    suggestions = [
      {
        type: "general",
        suggested: "Review and refine your content for clarity and engagement",
        explanation: "AI-powered analysis suggests improvements to enhance content quality",
        impact: "medium"
      }
    ];
  }

  return { suggestions };
}
