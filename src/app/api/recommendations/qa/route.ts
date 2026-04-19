import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * Q&A Format Converter API (F111)
 * POST /api/recommendations/qa - Convert content to Q&A format
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { z } from "zod";
import {
  convertToQA,
  optimizeQAForFeaturedSnippets,
  batchConvertToQA,
  mergeQAPairs,
} from "@/lib/recommendations";

// Request schema
const qaConvertSchema = z.object({
  content: z.string().min(1, "Content is required"),
  topicContext: z.string().optional(),
  maxPairs: z.number().min(1).max(50).default(20),
  minConfidence: z.number().min(0).max(1).default(0.5),
  optimizeForSnippets: z.boolean().default(true),
  generateSchema: z.boolean().default(true),
});

const batchQAConvertSchema = z.object({
  contents: z.array(z.object({
    id: z.string(),
    content: z.string(),
    topic: z.string().optional(),
  })),
  maxPairsPerContent: z.number().min(1).max(20).default(10),
  minConfidence: z.number().min(0).max(1).default(0.5),
  mergeResults: z.boolean().default(false),
  maxTotalPairs: z.number().min(1).max(100).default(50),
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

    const body = await request.json();

    // Check if it's batch conversion
    if (body.contents && Array.isArray(body.contents)) {
      return handleBatchConversion(body);
    }

    // Single content conversion
    return handleSingleConversion(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Q&A conversion failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleSingleConversion(body: unknown) {
  const {
    content,
    topicContext,
    maxPairs,
    minConfidence,
    optimizeForSnippets,
    generateSchema,
  } = qaConvertSchema.parse(body);

  // Convert content to Q&A
  const result = convertToQA(content, {
    maxPairs,
    minConfidence,
    topicContext,
  });

  // Optimize for featured snippets if requested
  let pairs = result.pairs;
  if (optimizeForSnippets) {
    pairs = optimizeQAForFeaturedSnippets(pairs);
  }

  // Group by confidence level
  const grouped = {
    high: pairs.filter((p) => p.confidence >= 0.8),
    medium: pairs.filter((p) => p.confidence >= 0.6 && p.confidence < 0.8),
    low: pairs.filter((p) => p.confidence < 0.6),
  };

  return NextResponse.json({
    success: true,
    summary: {
      totalPairs: pairs.length,
      highConfidence: grouped.high.length,
      mediumConfidence: grouped.medium.length,
      lowConfidence: grouped.low.length,
      coverage: result.coverage,
      hasSchema: generateSchema && result.faqSchema !== "",
    },
    pairs: pairs.map((p) => ({
      question: p.question,
      answer: p.answer,
      confidence: Math.round(p.confidence * 100) / 100,
      sourcePreview: p.sourceText.slice(0, 100),
    })),
    grouped,
    faqSchema: generateSchema ? result.faqSchema : null,
    recommendations: getQARecommendations(pairs, result.coverage),
  });
}

async function handleBatchConversion(body: unknown) {
  const {
    contents,
    maxPairsPerContent,
    minConfidence,
    mergeResults,
    maxTotalPairs,
  } = batchQAConvertSchema.parse(body);

  // Batch convert
  const results = batchConvertToQA(contents, {
    maxPairsPerContent,
    minConfidence,
  });

  if (mergeResults) {
    // Merge all pairs
    const allPairSets = Array.from(results.values()).map((r) => r.pairs);
    const mergedPairs = mergeQAPairs(allPairSets, {
      maxTotal: maxTotalPairs,
      minConfidence,
    });

    // Optimize merged pairs
    const optimizedPairs = optimizeQAForFeaturedSnippets(mergedPairs);

    return NextResponse.json({
      success: true,
      mode: "merged",
      summary: {
        sourcesProcessed: contents.length,
        totalPairs: optimizedPairs.length,
        averageCoverage:
          Array.from(results.values()).reduce((sum, r) => sum + r.coverage, 0) /
          results.size,
      },
      pairs: optimizedPairs.map((p) => ({
        question: p.question,
        answer: p.answer,
        confidence: Math.round(p.confidence * 100) / 100,
      })),
      faqSchema: generateMergedFAQSchema(optimizedPairs),
    });
  }

  // Return individual results
  const resultsArray = Array.from(results.entries()).map(([id, result]) => ({
    id,
    pairCount: result.pairs.length,
    coverage: result.coverage,
    pairs: result.pairs.map((p) => ({
      question: p.question,
      answer: p.answer,
      confidence: Math.round(p.confidence * 100) / 100,
    })),
    faqSchema: result.faqSchema,
  }));

  return NextResponse.json({
    success: true,
    mode: "individual",
    summary: {
      sourcesProcessed: contents.length,
      totalPairs: resultsArray.reduce((sum, r) => sum + r.pairCount, 0),
      averageCoverage:
        resultsArray.reduce((sum, r) => sum + r.coverage, 0) / resultsArray.length,
    },
    results: resultsArray,
  });
}

// Helper functions
function getQARecommendations(
  pairs: ReturnType<typeof convertToQA>["pairs"],
  coverage: number
): string[] {
  const recommendations: string[] = [];

  if (pairs.length < 5) {
    recommendations.push(
      "Consider adding more content to generate additional Q&A pairs"
    );
  }

  if (coverage < 50) {
    recommendations.push(
      "Low content coverage - restructure content with clear headings and definitions"
    );
  }

  const highConfidencePairs = pairs.filter((p) => p.confidence >= 0.8);
  if (highConfidencePairs.length < 3) {
    recommendations.push(
      "Add more explicit Q&A format content for higher confidence extraction"
    );
  }

  const avgAnswerLength =
    pairs.reduce((sum, p) => sum + p.answer.length, 0) / pairs.length;
  if (avgAnswerLength > 200) {
    recommendations.push(
      "Shorten answers to 40-60 words for optimal featured snippet length"
    );
  }

  if (avgAnswerLength < 30) {
    recommendations.push(
      "Expand answers to provide more comprehensive information"
    );
  }

  return recommendations;
}

function generateMergedFAQSchema(
  pairs: ReturnType<typeof convertToQA>["pairs"]
): string {
  if (pairs.length === 0) return "";

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((pair) => ({
      "@type": "Question",
      name: pair.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: pair.answer,
      },
    })),
  };

  return JSON.stringify(schema, null, 2);
}
