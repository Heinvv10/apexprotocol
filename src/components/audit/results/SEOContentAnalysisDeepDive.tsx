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
        <p className="text-sm font-medium text-foreground">Content analysis not captured</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
          This audit didn&apos;t include word-count, readability, or keyword-opportunity scoring. Re-run with the content-analysis module enabled.
        </p>
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

      {/* Keyword Opportunities — only render when we actually measured
          something. The hook used to emit a hardcoded list of 5 keywords
          ("solution", "automation", "ROI calculation", etc.) for every
          brand; it now returns []. Hide the card entirely until the audit
          engine wires real keyword-gap analysis. */}
      {contentData.keywordOpportunities.length > 0 && (
        <KeywordOpportunitiesCard opportunities={contentData.keywordOpportunities} />
      )}

      {/* Indexation Status — requires Google Search Console integration
          which we don't currently do. The prior version reported a fake
          42/38/4 for every brand. Hide until we wire GSC. */}
      {contentData.indexationStatus.totalDiscovered > 0 && (
        <IndexationStatusCard
          totalDiscovered={contentData.indexationStatus.totalDiscovered}
          indexed={contentData.indexationStatus.indexed}
          notIndexed={contentData.indexationStatus.notIndexed}
          indexationRate={contentData.indexationStatus.indexationRate}
          reasonsForNonIndexation={contentData.indexationStatus.reasonsForNonIndexation}
        />
      )}

      {/* Backlink Summary — the prior version listed identical hardcoded
          referrers (techcrunch.com / forbes.com / medium.com) and a fake
          234 backlinks for every brand. Hide until we integrate a real
          backlink provider (Ahrefs / Moz / Majestic / etc). */}
      {contentData.backlinkSummary.estimatedBacklinks > 0 && (
        <BacklinkSummaryCard
          estimatedBacklinks={contentData.backlinkSummary.estimatedBacklinks}
          topReferrers={contentData.backlinkSummary.topReferrers}
          backlinksChange={contentData.backlinkSummary.backlinksChange}
          backlinksTrend={contentData.backlinkSummary.backlinksTrend}
        />
      )}
    </div>
  );
}
