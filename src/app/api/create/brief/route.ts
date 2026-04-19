import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * Content Brief Generation API
 * Phase 4: AI-powered content brief generation
 *
 * POST /api/create/brief - Generate a comprehensive content brief
 * POST /api/create/brief/analyze - Analyze existing content for citation potential
 * POST /api/create/brief/faq - Extract and generate FAQs from content
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import {
  generateContentBrief,
  analyzeForCitation,
  extractAndValidateFAQs,
  validateBriefQuality,
  type BrandContext,
  type ContentBrief,
} from "@/lib/content";

// Validation schemas
const generateBriefSchema = z.object({
  brandId: z.string(),
  targetKeyword: z.string().min(2, "Keyword must be at least 2 characters"),
  secondaryKeywords: z.array(z.string()).optional().default([]),
  contentType: z.enum([
    "blog_post",
    "landing_page",
    "product_description",
    "how_to_guide",
    "listicle",
    "comparison",
    "case_study",
    "press_release",
    "faq_page",
  ]),
  targetWordCount: z.number().min(300).max(10000).optional().default(1500),
  targetAudience: z.string().optional(),
});

const analyzeCitationSchema = z.object({
  content: z.string().min(100, "Content must be at least 100 characters"),
});

const extractFAQSchema = z.object({
  content: z.string().min(100, "Content must be at least 100 characters"),
  useAI: z.boolean().optional().default(false),
  targetCount: z.number().min(1).max(20).optional().default(10),
});

/**
 * POST /api/create/brief
 * Generate a comprehensive content brief
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(orgId, "content_generation");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          resetAt: rateLimitResult.resetAt.toISOString(),
          remaining: rateLimitResult.remaining,
        },
        { status: 429 }
      );
    }

    // Determine which operation based on request
    const url = new URL(request.url);
    const operation = url.searchParams.get("operation");

    const body = await request.json();

    switch (operation) {
      case "analyze":
        return handleCitationAnalysis(body);
      case "faq":
        return handleFAQExtraction(body, { orgId, userId });
      default:
        return handleBriefGeneration(body, orgId, { orgId, userId });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Brief generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content brief" },
      { status: 500 }
    );
  }
}

async function handleBriefGeneration(
  body: unknown,
  orgId: string,
  trackingInfo: { orgId: string; userId: string }
): Promise<NextResponse> {
  const data = generateBriefSchema.parse(body);

  // Get brand context
  const brand = await db.query.brands.findFirst({
    where: and(eq(brands.id, data.brandId), eq(brands.organizationId, orgId)),
  });

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  // Build brand context
  const voiceSettings = brand.voice as {
    tone?: string;
    targetAudience?: string;
    keyMessages?: string[];
    avoidTopics?: string[];
  } | null;

  const competitors = brand.competitors as Array<{
    name: string;
    url?: string;
  }> | null;

  const brandContext: BrandContext = {
    name: brand.name,
    industry: brand.industry ?? undefined,
    description: brand.description ?? undefined,
    voice: voiceSettings
      ? {
          tone: voiceSettings.tone,
          targetAudience: voiceSettings.targetAudience,
          keyMessages: voiceSettings.keyMessages,
          avoidTopics: voiceSettings.avoidTopics,
        }
      : undefined,
    keywords: (brand.keywords as string[]) ?? [],
    competitors: competitors ?? [],
  };

  // Generate content brief
  const brief: ContentBrief = await generateContentBrief(
    {
      brandId: data.brandId,
      targetKeyword: data.targetKeyword,
      secondaryKeywords: data.secondaryKeywords,
      contentType: data.contentType,
      brandContext,
      targetWordCount: data.targetWordCount,
      targetAudience: data.targetAudience,
    },
    trackingInfo
  );

  // Validate brief quality
  const qualityReport = validateBriefQuality(brief);

  return NextResponse.json({
    success: true,
    data: brief,
    quality: qualityReport,
  });
}

async function handleCitationAnalysis(body: unknown): Promise<NextResponse> {
  const data = analyzeCitationSchema.parse(body);

  // Analyze content for citation potential
  const analysis = analyzeForCitation(data.content);

  return NextResponse.json({
    success: true,
    data: analysis,
  });
}

async function handleFAQExtraction(
  body: unknown,
  trackingInfo?: { orgId: string; userId: string }
): Promise<NextResponse> {
  const data = extractFAQSchema.parse(body);

  // Extract and validate FAQs
  const result = await extractAndValidateFAQs(data.content, {
    useAI: data.useAI,
    targetCount: data.targetCount,
    trackingInfo,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
}
