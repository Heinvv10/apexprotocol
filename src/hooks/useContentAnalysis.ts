import { useMemo } from "react";
import { Audit } from "./useAudit";

export interface ContentAnalysis {
  contentQuality: {
    pages: Array<{
      url: string;
      wordCount: number;
      readabilityScore: number;
      readabilityGrade: string;
      htagHierarchy: "valid" | "partial" | "invalid";
      keywordDensity: number;
    }>;
    averageWordCount: number;
    averageReadability: number;
    shortPages: number;
    poorReadability: number;
  };
  keywordOpportunities: Array<{
    opportunity: string;
    currentMentions: number;
    suggestedMentions: number;
    estimatedImpact: "high" | "medium" | "low";
    type: "lsi" | "semantic" | "related" | "long-tail";
  }>;
  indexationStatus: {
    totalDiscovered: number;
    indexed: number;
    notIndexed: number;
    indexationRate: number;
    reasonsForNonIndexation: Array<{
      reason: string;
      pageCount: number;
    }>;
  };
  backlinkSummary: {
    estimatedBacklinks: number;
    topReferrers: Array<{
      domain: string;
      backlinks: number;
      authority: number;
    }>;
    backlinksChange: number;
    backlinksTrend: "up" | "down" | "stable";
  };
}

/**
 * Extract and generate content analysis data from audit
 */
export function useContentAnalysis(audit: Audit | null): ContentAnalysis | null {
  return useMemo((): ContentAnalysis | null => {
    if (!audit) return null;

    const metadata = (audit.metadata as any) || {};
    const contentAnalysis = metadata.contentAnalysis;

    // If the audit wasn't run with the content-analysis module, the caller's
    // card should render its "not captured" placeholder rather than getting
    // fabricated word counts + fake keyword opportunities (the old hook
    // returned hard-coded constants like 2100/1850/3200 for every brand,
    // making the UI look like live analysis even without real data).
    if (!contentAnalysis) return null;

    // Content Quality Analysis — only include pages the crawler actually
    // analysed. The old version invented /about, /blog, and /contact with
    // completely fabricated word counts (1850 / 3200 / 450) and readability
    // scores for every brand. We now publish a single row for the audited
    // URL with the real numbers the worker persisted.
    const realWordCount = typeof contentAnalysis.averageWordCount === "number"
      ? contentAnalysis.averageWordCount
      : null;
    const realReadability = typeof contentAnalysis.averageReadability === "number"
      ? contentAnalysis.averageReadability
      : null;

    const pages =
      realWordCount !== null && realReadability !== null
        ? [
            {
              url: audit.url,
              wordCount: realWordCount,
              readabilityScore: realReadability,
              readabilityGrade: readabilityGradeFor(realReadability),
              htagHierarchy: contentAnalysis.headingHierarchyValid ? "valid" : "partial",
              // keywordDensity isn't currently captured by the worker. Omit
              // instead of defaulting to a bogus 2.3%.
              keywordDensity: 0,
            },
          ]
        : [];

    const contentQuality = {
      pages,
      averageWordCount: realWordCount ?? 0,
      averageReadability: realReadability ?? 0,
      shortPages: realWordCount !== null && realWordCount < 300 ? 1 : 0,
      poorReadability: realReadability !== null && realReadability < 60 ? 1 : 0,
    };

    // Keyword Opportunities / Indexation Status / Backlink Summary — none
    // of these are measured by the current audit engine. The previous hook
    // returned identical hardcoded arrays for every brand (e.g. the same
    // "solution" / "automation" / "ROI calculation" keywords, the same
    // 42 discovered / 38 indexed count, the same techcrunch.com /
    // forbes.com backlinks). Returning empty arrays / zeros here tells
    // each card to render its "not measured" empty state instead.
    const keywordOpportunities: ContentAnalysis["keywordOpportunities"] = [];
    const indexationStatus: ContentAnalysis["indexationStatus"] = {
      totalDiscovered: 0,
      indexed: 0,
      notIndexed: 0,
      indexationRate: 0,
      reasonsForNonIndexation: [],
    };
    const backlinkSummary: ContentAnalysis["backlinkSummary"] = {
      estimatedBacklinks: 0,
      topReferrers: [],
      backlinksChange: 0,
      backlinksTrend: "stable",
    };

    return {
      contentQuality,
      keywordOpportunities,
      indexationStatus,
      backlinkSummary,
    } as ContentAnalysis;
  }, [audit]);
}

function readabilityGradeFor(score: number): string {
  // Rough Flesch-Kincaid bucket mapping. Keeps the label informative
  // without pretending we ran a full FK calculation.
  if (score >= 90) return "5th Grade";
  if (score >= 80) return "6th Grade";
  if (score >= 70) return "7th Grade";
  if (score >= 60) return "8-9th Grade";
  if (score >= 50) return "10-12th Grade";
  if (score >= 30) return "College";
  return "College Graduate";
}
