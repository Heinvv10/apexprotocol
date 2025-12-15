/**
 * Create - AI Suggestions API (F092)
 * Generate AI-powered content suggestions
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { routeMessage, LLMProvider } from "@/lib/ai/router";
import { getPrompt } from "@/lib/ai/prompts";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { trackUsage } from "@/lib/ai/token-tracker";

interface SuggestionRequest {
  type: "topics" | "titles" | "outline" | "improve" | "keywords" | "faq";
  brandId?: string;
  context?: string;
  existingContent?: string;
  targetKeywords?: string[];
  tone?: string;
  audience?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

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

    const body: SuggestionRequest = await request.json();
    const { type, brandId, context, existingContent, targetKeywords, tone, audience } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Suggestion type is required" },
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

    // Generate suggestions based on type
    const result = await generateSuggestion(type, {
      brandContext,
      context,
      existingContent,
      targetKeywords,
      tone,
      audience,
      orgId,
      userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Suggestion generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}

async function generateSuggestion(
  type: SuggestionRequest["type"],
  options: {
    brandContext?: string;
    context?: string;
    existingContent?: string;
    targetKeywords?: string[];
    tone?: string;
    audience?: string;
    orgId: string;
    userId: string;
  }
): Promise<{
  suggestions: string[] | Record<string, unknown>;
  type: string;
  tokens: number;
}> {
  const { brandContext, context, existingContent, targetKeywords, tone, audience, orgId, userId } = options;

  let systemPrompt = "";
  let userPrompt = "";

  switch (type) {
    case "topics":
      systemPrompt = `You are a content strategist specializing in AI-optimized content.
Generate topic ideas that are likely to be featured in AI search results.
${brandContext}`;
      userPrompt = `Generate 10 content topic ideas.
${context ? `Context: ${context}` : ""}
${targetKeywords?.length ? `Target keywords: ${targetKeywords.join(", ")}` : ""}
${audience ? `Target audience: ${audience}` : ""}

Format as a JSON array of objects with "title", "description", and "aiSearchPotential" (1-10 score).`;
      break;

    case "titles":
      systemPrompt = `You are a headline expert for AI-optimized content.
Create compelling titles that capture attention and rank well in AI search.
${brandContext}`;
      userPrompt = `Generate 10 title variations.
${context ? `Topic/Context: ${context}` : ""}
${targetKeywords?.length ? `Target keywords: ${targetKeywords.join(", ")}` : ""}
${tone ? `Tone: ${tone}` : ""}

Format as a JSON array of objects with "title", "type" (how-to, listicle, question, guide, etc), and "strength" (1-10).`;
      break;

    case "outline":
      systemPrompt = `You are a content architect creating comprehensive outlines for AI-optimized content.
Structure content for maximum AI search visibility and featured snippet potential.
${brandContext}`;
      userPrompt = `Create a detailed content outline.
${context ? `Topic: ${context}` : ""}
${targetKeywords?.length ? `Target keywords: ${targetKeywords.join(", ")}` : ""}
${audience ? `Target audience: ${audience}` : ""}

Format as JSON with "title", "introduction", "sections" (array with h2, h3, keyPoints), "conclusion", and "faqs".`;
      break;

    case "improve":
      systemPrompt = `You are a content optimization expert for AI search engines.
Analyze content and provide specific improvements for better AI visibility.
${brandContext}`;
      userPrompt = `Analyze and improve this content:
---
${existingContent || "No content provided"}
---
${targetKeywords?.length ? `Target keywords: ${targetKeywords.join(", ")}` : ""}

Provide JSON with "score" (1-100), "improvements" array, "missingKeywords", and "suggestedAdditions".`;
      break;

    case "keywords":
      systemPrompt = `You are an SEO and AI search keyword researcher.
Identify keywords and phrases that AI systems use when answering queries.
${brandContext}`;
      userPrompt = `Generate keyword suggestions.
${context ? `Topic/Context: ${context}` : ""}
${targetKeywords?.length ? `Seed keywords: ${targetKeywords.join(", ")}` : ""}
${audience ? `Target audience: ${audience}` : ""}

Format as JSON with "primary" (3-5), "secondary" (10-15), "longTail" (10), and "questions" (10 question keywords).`;
      break;

    case "faq":
      systemPrompt = `You are a FAQ expert for AI search optimization.
Create FAQs that AI assistants are likely to reference when answering related queries.
${brandContext}`;
      userPrompt = `Generate FAQ suggestions.
${context ? `Topic/Context: ${context}` : ""}
${existingContent ? `Based on content: ${existingContent.substring(0, 500)}...` : ""}
${targetKeywords?.length ? `Target keywords: ${targetKeywords.join(", ")}` : ""}

Format as JSON array with "question", "answer", and "aiRelevance" (1-10 score for AI search relevance).`;
      break;

    default:
      throw new Error(`Unknown suggestion type: ${type}`);
  }

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
    operation: `suggestion_${type}`,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  });

  // Parse JSON response
  let suggestions: string[] | Record<string, unknown>;
  try {
    // Extract JSON from response
    const jsonMatch = response.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.content.match(/\[[\s\S]*\]/) ||
                      response.content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      suggestions = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } else {
      suggestions = { raw: response.content };
    }
  } catch {
    suggestions = { raw: response.content };
  }

  return {
    suggestions,
    type,
    tokens: response.totalTokens,
  };
}
