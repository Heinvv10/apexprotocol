"use client";

import * as React from "react";
import { Audit } from "@/hooks/useAudit";
import { useContentAnalysis } from "@/hooks/useContentAnalysis";
import { ContentAnalysisCard } from "../seo-content-analysis/ContentAnalysisCard";
import { KeywordOpportunitiesCard } from "../seo-content-analysis/KeywordOpportunitiesCard";
import { IndexationStatusCard } from "../seo-content-analysis/IndexationStatusCard";
import { BacklinkSummaryCard } from "../seo-content-analysis/BacklinkSummaryCard";
import { Brain } from "lucide-react";

interface SEOContentAnalysisDeepDiveProps {
  audit: Audit;
}

export function SEOContentAnalysisDeepDive({ audit }: SEOContentAnalysisDeepDiveProps) {
  const contentData = useContentAnalysis(audit);

  if (!contentData) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
          <Brain className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Loading SEO content analysis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Content Quality Analysis */}
      <ContentAnalysisCard
        pages={contentData.contentQuality.pages}
        averageWordCount={contentData.contentQuality.averageWordCount}
        averageReadability={contentData.contentQuality.averageReadability}
        shortPages={contentData.contentQuality.shortPages}
        poorReadability={contentData.contentQuality.poorReadability}
      />

      {/* Keyword Opportunities */}
      <KeywordOpportunitiesCard opportunities={contentData.keywordOpportunities} />

      {/* Indexation Status */}
      <IndexationStatusCard
        totalDiscovered={contentData.indexationStatus.totalDiscovered}
        indexed={contentData.indexationStatus.indexed}
        notIndexed={contentData.indexationStatus.notIndexed}
        indexationRate={contentData.indexationStatus.indexationRate}
        reasonsForNonIndexation={contentData.indexationStatus.reasonsForNonIndexation}
      />

      {/* Backlink Summary */}
      <BacklinkSummaryCard
        estimatedBacklinks={contentData.backlinkSummary.estimatedBacklinks}
        topReferrers={contentData.backlinkSummary.topReferrers}
        backlinksChange={contentData.backlinkSummary.backlinksChange}
        backlinksTrend={contentData.backlinkSummary.backlinksTrend}
      />
    </div>
  );
}
