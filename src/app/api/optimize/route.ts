import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/supabase-server";
import { analyzeContent, analyzeLargeContent } from "@/lib/ai/content-analyzer";

/**
 * Validation schema for content optimization request
 */
const optimizeRequestSchema = z.object({
  content: z.string().min(1, "Content is required"),
  config: z
    .object({
      model: z.string().optional(),
      maxTokens: z.number().optional(),
      minContentLength: z.number().optional(),
    })
    .optional(),
});

/**
 * POST /api/optimize
 * Analyzes content for GEO optimization opportunities
 *
 * Request body:
 * {
 *   content: string;
 *   config?: {
 *     model?: string;
 *     maxTokens?: number;
 *     minContentLength?: number;
 *   };
 * }
 *
 * Response:
 * {
 *   success: true;
 *   data: {
 *     suggestions: Suggestion[];
 *     overallScore: number;
 *     citationProbability: "high" | "medium" | "low";
 *     summary: string;
 *     tokenUsage: {
 *       prompt_tokens: number;
 *       completion_tokens: number;
 *       total_tokens: number;
 *     };
 *   };
 *   meta: {
 *     timestamp: string;
 *   };
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = optimizeRequestSchema.parse(body);

    // Determine if content is large (>10,000 characters)
    const isLargeContent = validatedData.content.length > 10000;

    // Analyze content using appropriate method
    const analysisResult = isLargeContent
      ? await analyzeLargeContent(validatedData.content, validatedData.config)
      : await analyzeContent(validatedData.content, validatedData.config);

    // Return success response with analysis results
    return NextResponse.json({
      success: true,
      data: analysisResult,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request parameters",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle content analyzer errors (e.g., content too short)
    if (error instanceof Error) {
      // Check for specific content length errors
      if (
        error.message.includes("Content too short") ||
        error.message.includes("at least 20 words")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            hint: "Please add more content to get meaningful optimization suggestions. We recommend at least 50 words for best results.",
          },
          { status: 400 }
        );
      }

      // Check for empty/no valid sections error
      if (error.message.includes("no sections long enough")) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            hint: "Try adding more paragraphs with meaningful content to enable analysis.",
          },
          { status: 400 }
        );
      }

      // Check for API-related errors (rate limits, etc.)
      if (
        error.message.includes("rate limit") ||
        error.message.includes("quota")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "API rate limit exceeded. Please try again later.",
          },
          { status: 429 }
        );
      }

      // Check for parsing errors
      if (error.message.includes("Failed to parse")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to process AI response. Please try again or contact support if the issue persists.",
          },
          { status: 500 }
        );
      }

      // Generic error handling
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    // Unknown error
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during content analysis",
      },
      { status: 500 }
    );
  }
}
