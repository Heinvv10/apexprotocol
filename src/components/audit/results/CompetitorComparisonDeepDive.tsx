"use client";

import * as React from "react";
import { Audit } from "@/hooks/useAudit";
import { useCompetitorComparison } from "@/hooks/useCompetitorComparison";
import { CompetitorComparisonCard } from "../competitor-comparison/CompetitorComparisonCard";
import { GapAnalysisCard } from "../competitor-comparison/GapAnalysisCard";
import { CompetitivePositioningCard } from "../competitor-comparison/CompetitivePositioningCard";
import { Zap } from "lucide-react";

interface CompetitorComparisonDeepDiveProps {
  audit: Audit;
}

export function CompetitorComparisonDeepDive({ audit }: CompetitorComparisonDeepDiveProps) {
  const competitorData = useCompetitorComparison(audit);

  if (!competitorData) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
          <Zap className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Loading competitor analysis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Competitor Comparison */}
      <CompetitorComparisonCard
        yourBrand={competitorData.yourBrand}
        competitors={competitorData.competitors}
        industryBenchmark={competitorData.industryBenchmark}
      />

      {/* Gap Analysis */}
      <GapAnalysisCard gaps={competitorData.gaps} />

      {/* Competitive Positioning */}
      <CompetitivePositioningCard
        overallRank={competitorData.positioning.overallRank}
        totalCompetitors={competitorData.positioning.totalCompetitors}
        percentilRank={competitorData.positioning.percentilRank}
        competitiveStatus={competitorData.positioning.competitiveStatus}
      />
    </div>
  );
}
