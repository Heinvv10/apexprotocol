"use client";

import * as React from "react";
import { Audit } from "@/hooks/useAudit";
import { useAIReadiness } from "@/hooks/useAIReadiness";
import { AIPlatformVisibility } from "../ai-readiness/AIPlatformVisibility";
import { AIContentOptimization } from "../ai-readiness/AIContentOptimization";
import { AICitationPotential } from "../ai-readiness/AICitationPotential";
import { LLMContentSuitability } from "../ai-readiness/LLMContentSuitability";
import { AlertCircle, Brain, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AIReadinessDeepDiveProps {
  audit: Audit;
}

export function AIReadinessDeepDive({ audit }: AIReadinessDeepDiveProps) {
  const aiData = useAIReadiness(audit);

  // The audit engine doesn't yet populate metadata.aiReadiness.score,
  // so useAIReadiness returns null. Render an honest empty state rather
  // than NaN-filled tiles.
  if (!aiData) {
    return (
      <div className="card-secondary p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
          <Brain className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">
          AI readiness analysis not captured
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          This audit didn&apos;t include platform-visibility or LLM-suitability
          scoring. Re-run with the AI Readiness module enabled to see citation
          potential and per-platform visibility.
        </p>
      </div>
    );
  }

  const avgPlatformScore =
    aiData.platformVisibility.length > 0
      ? Math.round(
          aiData.platformVisibility.reduce((sum, p) => sum + p.score, 0) /
            aiData.platformVisibility.length
        )
      : 0;

  const avgOptimizationScore =
    aiData.contentOptimization.length > 0
      ? Math.round(
          aiData.contentOptimization.reduce((sum, o) => sum + o.score, 0) /
            aiData.contentOptimization.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* AI Readiness Overview */}
      <div className="card-primary p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">AI Readiness Analysis</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Comprehensive analysis of your content's visibility and suitability for AI models and LLMs
            </p>
          </div>
          <Link href="https://www.apex.ai/ai-readiness-guide" target="_blank">
            <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
              <Zap className="h-4 w-4" />
              Learn More
            </Button>
          </Link>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card-secondary p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {aiData.citationPotential.overallScore}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Citation Score</div>
          </div>
          <div className="card-secondary p-3 text-center">
            <div className="text-2xl font-bold text-success">
              {avgPlatformScore}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Platform Score</div>
          </div>
          <div className="card-secondary p-3 text-center">
            <div className="text-2xl font-bold text-warning">
              {avgOptimizationScore}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Optimization
            </div>
          </div>
          <div className="card-secondary p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {aiData.llmSuitability.overallScore}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Suitability</div>
          </div>
        </div>

        {/* Key insight */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-muted-foreground">
              Your content's AI readiness score of{" "}
              <strong className="text-foreground">
                {aiData.citationPotential.overallScore}
              </strong>{" "}
              indicates{" "}
              {aiData.citationPotential.overallScore >= 80
                ? "excellent visibility"
                : aiData.citationPotential.overallScore >= 60
                ? "good visibility"
                : "moderate visibility"}{" "}
              across AI models. This affects your likelihood of being cited in
              AI-generated responses.
            </p>
          </div>
        </div>
      </div>

      {/* AI Platform Visibility */}
      <AIPlatformVisibility platforms={aiData.platformVisibility} />

      {/* AI Content Optimization */}
      <AIContentOptimization optimizations={aiData.contentOptimization} />

      {/* AI Citation Potential */}
      <AICitationPotential
        metrics={aiData.citationPotential.metrics}
        overallScore={aiData.citationPotential.overallScore}
        percentile={aiData.citationPotential.percentile}
      />

      {/* LLM Content Suitability */}
      <LLMContentSuitability
        factors={aiData.llmSuitability.factors}
        overallScore={aiData.llmSuitability.overallScore}
        recommendation={aiData.llmSuitability.recommendation}
      />

      {/* Next steps */}
      <div className="card-secondary p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Recommended Next Steps</h3>
          <p className="text-sm text-muted-foreground">
            Prioritized actions to improve your AI readiness
          </p>
        </div>

        <div className="space-y-2">
          {avgOptimizationScore < 80 && (
            <div className="card-tertiary p-4 border-l-2 border-l-warning space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-lg">1️⃣</span>
                <div>
                  <p className="font-medium text-sm">Optimize Content Structure</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add FAQ schema, improve heading hierarchy, and structure
                    content for AI readability
                  </p>
                </div>
              </div>
            </div>
          )}

          {aiData.llmSuitability.overallScore < 75 && (
            <div className="card-tertiary p-4 border-l-2 border-l-warning space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-lg">2️⃣</span>
                <div>
                  <p className="font-medium text-sm">Enhance LLM Suitability</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expand content depth, add credible citations, and improve
                    E-E-A-T signals
                  </p>
                </div>
              </div>
            </div>
          )}

          {avgPlatformScore < 85 && (
            <div className="card-tertiary p-4 border-l-2 border-l-warning space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-lg">3️⃣</span>
                <div>
                  <p className="font-medium text-sm">Increase Platform Visibility</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Build domain authority, ensure mobile optimization, and
                    maintain content freshness
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="card-tertiary p-4 border-l-2 border-l-success space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-lg">4️⃣</span>
              <div>
                <p className="font-medium text-sm">Monitor & Track Progress</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Schedule regular audits to track AI visibility and citation
                  metrics over time
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
