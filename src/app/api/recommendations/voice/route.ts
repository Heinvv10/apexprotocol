import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Voice Search Readability API (F110)
 * POST /api/recommendations/voice - Analyze content for voice search optimization
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  calculateVoiceReadability,
  analyzeForVoiceSearch,
  optimizeForVoice,
  scoreForPlatform,
  isVoiceSearchReady,
} from "@/lib/recommendations";

// Request schema
const voiceReadabilitySchema = z.object({
  content: z.string().min(1, "Content is required"),
  optimize: z.boolean().default(false),
  platform: z.enum(["alexa", "google", "siri"]).optional(),
  checkReadiness: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const { content, optimize, platform, checkReadiness } =
      voiceReadabilitySchema.parse(body);

    // Calculate basic readability
    const readability = calculateVoiceReadability(content);

    // Full voice search analysis
    const analysis = analyzeForVoiceSearch(content);

    // Check voice search readiness
    let readiness = null;
    if (checkReadiness) {
      readiness = isVoiceSearchReady(content);
    }

    // Platform-specific scoring
    let platformScore = null;
    if (platform) {
      platformScore = scoreForPlatform(content, platform);
    }

    // Optimize content if requested
    let optimized = null;
    if (optimize) {
      optimized = optimizeForVoice(content);
    }

    return NextResponse.json({
      success: true,
      readability: {
        fleschKincaid: readability.fleschKincaid,
        fleschReadingEase: readability.fleschReadingEase,
        averageSentenceLength: readability.averageSentenceLength,
        averageSyllablesPerWord: readability.averageSyllablesPerWord,
        grade: readability.grade,
        gradeDescription: getGradeDescription(readability.grade),
      },
      voiceOptimization: {
        score: analysis.voiceOptimizationScore,
        recommendations: analysis.recommendations,
        suggestions: readability.suggestions.map((s) => ({
          original: s.original.slice(0, 100), // Truncate for response
          suggestion: s.suggestion.slice(0, 100),
          reason: s.reason,
        })),
      },
      readiness: readiness
        ? {
            ready: readiness.ready,
            score: readiness.score,
            issues: readiness.issues,
            passed: readiness.passed,
          }
        : null,
      platformScore: platformScore
        ? {
            platform,
            score: platformScore.score,
            tips: platformScore.platformSpecificTips,
          }
        : null,
      optimized: optimized
        ? {
            original: optimized.original.slice(0, 500),
            optimizedContent: optimized.optimized.slice(0, 500),
            changesCount: optimized.changes.length,
            changes: optimized.changes.slice(0, 10), // Limit changes returned
          }
        : null,
      summary: {
        voiceReady: readiness?.ready ?? analysis.voiceOptimizationScore >= 60,
        overallScore: analysis.voiceOptimizationScore,
        readingLevel: getReadingLevel(readability.fleschKincaid),
        improvementPotential: Math.max(0, 100 - analysis.voiceOptimizationScore),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Voice readability analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper functions
function getGradeDescription(
  grade: "excellent" | "good" | "average" | "poor"
): string {
  const descriptions = {
    excellent: "Excellent - Very easy to understand, ideal for voice",
    good: "Good - Easy to understand, suitable for voice",
    average: "Average - Moderate complexity, needs some optimization",
    poor: "Poor - Too complex for voice, needs significant optimization",
  };
  return descriptions[grade];
}

function getReadingLevel(fleschKincaid: number): string {
  if (fleschKincaid <= 5) return "Elementary (Grade 5 or below)";
  if (fleschKincaid <= 8) return "Middle School (Grade 6-8)";
  if (fleschKincaid <= 12) return "High School (Grade 9-12)";
  if (fleschKincaid <= 16) return "College (Grade 13-16)";
  return "Graduate (Above Grade 16)";
}
