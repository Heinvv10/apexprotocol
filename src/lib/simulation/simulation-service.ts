import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  simulations,
  simulationResults,
  brands,
} from "@/lib/db/schema";
import { AnalysisEngine } from "@/lib/ai/analysis-engine";
import type { AIPlatform, PlatformAnalysis } from "@/lib/ai/types";
import { buildBrandContext, buildEnrichedContext } from "./context-builder";
import { calculateConfidence } from "./confidence-calculator";
import type { PlatformSimulationResult, SimulationSummary } from "./types";

const MAX_CONCURRENT = 3;

/**
 * Run a simulation: compare baseline vs enriched brand context across platforms.
 * Updates progress in the DB after each platform completes.
 */
export async function runSimulation(simulationId: string): Promise<SimulationSummary> {
  // Load simulation from DB
  const [sim] = await db
    .select()
    .from(simulations)
    .where(eq(simulations.id, simulationId))
    .limit(1);

  if (!sim) {
    throw new Error(`Simulation ${simulationId} not found`);
  }

  // Load brand
  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.id, sim.brandId))
    .limit(1);

  if (!brand) {
    throw new Error(`Brand ${sim.brandId} not found`);
  }

  // Mark as running
  await db
    .update(simulations)
    .set({ status: "running", startedAt: new Date(), updatedAt: new Date() })
    .where(eq(simulations.id, simulationId));

  const platforms = (sim.platforms as string[]) || [];
  const baseContext = sim.brandContextSnapshot || buildBrandContext({
    name: brand.name,
    domain: brand.domain,
    description: brand.description,
    keywords: brand.keywords ?? undefined,
    industry: brand.industry,
  });
  const enrichedContext = buildEnrichedContext(
    baseContext,
    sim.contentTitle,
    sim.contentBody,
    sim.contentType
  );

  const isABTest = sim.type === "ab_test" && sim.variantBBody;
  const variantBContext = isABTest
    ? buildEnrichedContext(baseContext, sim.variantBTitle, sim.variantBBody!, sim.contentType)
    : null;

  const results: PlatformSimulationResult[] = [];
  let completedCount = 0;
  let failedCount = 0;

  // Process platforms with concurrency limit
  const platformQueue = [...platforms];
  const running: Promise<void>[] = [];

  async function processPlatform(platform: string): Promise<void> {
    const aiPlatform = platform as AIPlatform;
    let result: PlatformSimulationResult;

    try {
      const engine = new AnalysisEngine({
        brandName: brand.name,
        brandKeywords: (brand.keywords as string[]) || [],
        platforms: [aiPlatform],
        timeout: 45000,
      });

      // Run baseline analysis
      const baselineAnalysis = await engine.analyze({
        userId: sim.userId,
        brandId: sim.brandId,
        query: sim.query,
        brandContext: baseContext,
      });

      // Run enriched analysis (with draft content)
      const enrichedAnalysis = await engine.analyze({
        userId: sim.userId,
        brandId: sim.brandId,
        query: sim.query,
        brandContext: enrichedContext,
      });

      const baselinePlatform = baselineAnalysis.platforms[aiPlatform];
      const enrichedPlatform = enrichedAnalysis.platforms[aiPlatform];

      const baselineScore = baselinePlatform?.visibilityScore.total ?? 0;
      const enrichedScore = enrichedPlatform?.visibilityScore.total ?? 0;
      const baselineCitations = baselinePlatform?.visibilityScore.metrics.totalCitations ?? 0;
      const enrichedCitations = enrichedPlatform?.visibilityScore.metrics.totalCitations ?? 0;
      const baselineResponse = baselinePlatform?.response.content ?? "";
      const enrichedResponse = enrichedPlatform?.response.content ?? "";

      result = {
        platform: aiPlatform,
        status: "success",
        baseline: {
          score: baselineScore,
          citations: baselineCitations,
          response: baselineResponse,
          breakdown: baselinePlatform?.visibilityScore.breakdown ?? { mentionCount: 0, citationQuality: 0, prominence: 0 },
        },
        enriched: {
          score: enrichedScore,
          citations: enrichedCitations,
          response: enrichedResponse,
          breakdown: enrichedPlatform?.visibilityScore.breakdown ?? { mentionCount: 0, citationQuality: 0, prominence: 0 },
        },
        scoreDelta: enrichedScore - baselineScore,
        citationDelta: enrichedCitations - baselineCitations,
        confidence: calculateConfidence({
          baselineScore,
          enrichedScore,
          baselineCitations,
          enrichedCitations,
          baselineResponse,
          enrichedResponse,
          status: "success",
        }),
      };

      // Handle variant B for A/B tests
      if (isABTest && variantBContext) {
        const variantBAnalysis = await engine.analyze({
          userId: sim.userId,
          brandId: sim.brandId,
          query: sim.query,
          brandContext: variantBContext,
        });

        const variantBPlatform = variantBAnalysis.platforms[aiPlatform];
        const vbScore = variantBPlatform?.visibilityScore.total ?? 0;
        const vbCitations = variantBPlatform?.visibilityScore.metrics.totalCitations ?? 0;

        result.variantB = {
          score: vbScore,
          citations: vbCitations,
          response: variantBPlatform?.response.content ?? "",
          breakdown: variantBPlatform?.visibilityScore.breakdown ?? { mentionCount: 0, citationQuality: 0, prominence: 0 },
        };
        result.variantBScoreDelta = vbScore - baselineScore;
      }
    } catch (error) {
      failedCount++;
      result = {
        platform: aiPlatform,
        status: "failed",
        baseline: { score: 0, citations: 0, response: "", breakdown: { mentionCount: 0, citationQuality: 0, prominence: 0 } },
        enriched: { score: 0, citations: 0, response: "", breakdown: { mentionCount: 0, citationQuality: 0, prominence: 0 } },
        scoreDelta: 0,
        citationDelta: 0,
        confidence: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // Persist result
    await db.insert(simulationResults).values({
      simulationId,
      platform: result.platform,
      baselineScore: result.baseline.score,
      baselineCitations: result.baseline.citations,
      baselineResponse: result.baseline.response,
      baselineBreakdown: result.baseline.breakdown,
      enrichedScore: result.enriched.score,
      enrichedCitations: result.enriched.citations,
      enrichedResponse: result.enriched.response,
      enrichedBreakdown: result.enriched.breakdown,
      variantBScore: result.variantB?.score ?? null,
      variantBCitations: result.variantB?.citations ?? null,
      variantBResponse: result.variantB?.response ?? null,
      variantBBreakdown: result.variantB?.breakdown ?? null,
      scoreDelta: result.scoreDelta,
      citationDelta: result.citationDelta,
      variantBScoreDelta: result.variantBScoreDelta ?? null,
      confidence: result.confidence,
      status: result.status,
      metadata: result.error ? { error: result.error } : null,
    });

    results.push(result);
    completedCount++;

    // Update progress
    const progress = Math.round((completedCount / platforms.length) * 100);
    await db
      .update(simulations)
      .set({ progress, updatedAt: new Date() })
      .where(eq(simulations.id, simulationId));
  }

  // Process with concurrency limit using a simple pool
  for (let i = 0; i < platformQueue.length; i++) {
    const promise = processPlatform(platformQueue[i]).then(() => {
      const idx = running.indexOf(promise);
      if (idx !== -1) running.splice(idx, 1);
    });
    running.push(promise);

    if (running.length >= MAX_CONCURRENT) {
      await Promise.race(running);
    }
  }
  await Promise.all(running);

  // Determine final status
  const successCount = results.filter((r) => r.status === "success").length;
  let finalStatus: "completed" | "failed" | "partial";
  if (successCount === 0) {
    finalStatus = "failed";
  } else if (successCount < platforms.length) {
    finalStatus = "partial";
  } else {
    finalStatus = "completed";
  }

  await db
    .update(simulations)
    .set({
      status: finalStatus,
      progress: 100,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(simulations.id, simulationId));

  return buildSummary(simulationId, finalStatus, results, sim.type === "ab_test");
}

function buildSummary(
  id: string,
  status: string,
  results: PlatformSimulationResult[],
  isABTest: boolean
): SimulationSummary {
  const successful = results.filter((r) => r.status === "success");

  const avgScoreDelta =
    successful.length > 0
      ? successful.reduce((sum, r) => sum + r.scoreDelta, 0) / successful.length
      : 0;

  const avgConfidence =
    successful.length > 0
      ? successful.reduce((sum, r) => sum + r.confidence, 0) / successful.length
      : 0;

  let bestPlatform: string | undefined;
  let worstPlatform: string | undefined;
  let bestDelta = -Infinity;
  let worstDelta = Infinity;

  for (const r of successful) {
    if (r.scoreDelta > bestDelta) {
      bestDelta = r.scoreDelta;
      bestPlatform = r.platform;
    }
    if (r.scoreDelta < worstDelta) {
      worstDelta = r.scoreDelta;
      worstPlatform = r.platform;
    }
  }

  let abWinner: "a" | "b" | "tie" | undefined;
  if (isABTest && successful.length > 0) {
    const avgADelta = avgScoreDelta;
    const avgBDelta =
      successful.reduce((sum, r) => sum + (r.variantBScoreDelta ?? 0), 0) / successful.length;

    if (Math.abs(avgADelta - avgBDelta) < 2) {
      abWinner = "tie";
    } else {
      abWinner = avgADelta >= avgBDelta ? "a" : "b";
    }
  }

  return {
    id,
    status,
    progress: 100,
    avgScoreDelta: Math.round(avgScoreDelta * 10) / 10,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    platformResults: results,
    bestPlatform,
    worstPlatform,
    abWinner,
  };
}
