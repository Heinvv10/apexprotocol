import { useMemo } from "react";
import { Audit } from "./useAudit";

export interface CompetitorData {
  name: string;
  domain: string;
  geoScore: number;
  seoScore: number;
  aeoScore: number;
  smoScore: number;
  ppoScore: number;
  unifiedScore: number;
  rank?: number;
  trend?: "up" | "down" | "stable";
}

export interface CompetitorComparison {
  yourBrand: {
    name: string;
    geoScore: number;
    seoScore: number;
    aeoScore: number;
    smoScore: number;
    ppoScore: number;
    unifiedScore: number;
  };
  competitors: CompetitorData[];
  industryBenchmark: {
    geoScore: number;
    seoScore: number;
    aeoScore: number;
    smoScore: number;
    ppoScore: number;
    unifiedScore: number;
  };
  gaps: {
    dimension: string;
    yourScore: number;
    industryAverage: number;
    gap: number;
    gapPercentage: number;
    topCompetitor: number;
  }[];
  positioning: {
    overallRank: number;
    totalCompetitors: number;
    percentilRank: number;
    competitiveStatus: "leader" | "competitive" | "lagging";
  };
}

/**
 * Generate competitor comparison data from audit
 */
export function useCompetitorComparison(audit: Audit | null): CompetitorComparison | null {
  return useMemo(() => {
    if (!audit) return null;

    // Only fabricate competitor data in explicit dev-demo mode. In prod and
    // regular local dev, no real competitor scores means show nothing — the
    // caller then renders an "analysis not available" placeholder instead of
    // a leaderboard topped by "leader.example.com".
    if (process.env.NEXT_PUBLIC_DEMO_COMPETITOR_DATA !== "true") return null;

    // Get scores from audit
    const geoScore = Math.round((audit.overallScore || 74) * 0.95);
    const seoScore = Math.round((audit.technicalScore || 72) * 0.98);
    const aeoScore = Math.round((audit.aiReadinessScore || 68) * 1.05);
    const smoScore = Math.round((audit.overallScore || 74) * 0.92);
    const ppoScore = Math.round((audit.contentScore || 70) * 1.02);
    const yourUnifiedScore = Math.round(
      (geoScore + seoScore + aeoScore + smoScore + ppoScore) / 5
    );

    // Your brand data
    const yourBrand = {
      name: "Your Brand",
      geoScore,
      seoScore,
      aeoScore,
      smoScore,
      ppoScore,
      unifiedScore: yourUnifiedScore,
    };

    // Simulated competitor data
    const competitors: CompetitorData[] = [
      {
        name: "Market Leader",
        domain: "leader.example.com",
        geoScore: 92,
        seoScore: 88,
        aeoScore: 85,
        smoScore: 90,
        ppoScore: 87,
        unifiedScore: 88,
        rank: 1,
        trend: "up",
      },
      {
        name: "Competitor A",
        domain: "competitor-a.example.com",
        geoScore: 82,
        seoScore: 80,
        aeoScore: 78,
        smoScore: 81,
        ppoScore: 79,
        unifiedScore: 80,
        rank: 2,
        trend: "stable",
      },
      {
        name: "Competitor B",
        domain: "competitor-b.example.com",
        geoScore: 78,
        seoScore: 76,
        aeoScore: 74,
        smoScore: 77,
        ppoScore: 75,
        unifiedScore: 76,
        rank: 3,
        trend: "down",
      },
      {
        name: "Emerging Player",
        domain: "emerging.example.com",
        geoScore: 72,
        seoScore: 70,
        aeoScore: 69,
        smoScore: 71,
        ppoScore: 68,
        unifiedScore: 70,
        rank: 4,
        trend: "up",
      },
    ];

    // Calculate industry benchmark (average of competitors)
    const allScores = [yourBrand, ...competitors];
    const industryBenchmark = {
      geoScore: Math.round(
        allScores.reduce((sum, c) => sum + c.geoScore, 0) / allScores.length
      ),
      seoScore: Math.round(
        allScores.reduce((sum, c) => sum + c.seoScore, 0) / allScores.length
      ),
      aeoScore: Math.round(
        allScores.reduce((sum, c) => sum + c.aeoScore, 0) / allScores.length
      ),
      smoScore: Math.round(
        allScores.reduce((sum, c) => sum + c.smoScore, 0) / allScores.length
      ),
      ppoScore: Math.round(
        allScores.reduce((sum, c) => sum + c.ppoScore, 0) / allScores.length
      ),
      unifiedScore: Math.round(
        allScores.reduce((sum, c) => sum + c.unifiedScore, 0) / allScores.length
      ),
    };

    // Calculate gaps
    const gaps = [
      {
        dimension: "GEO (Geographic Optimization)",
        yourScore: geoScore,
        industryAverage: industryBenchmark.geoScore,
        gap: geoScore - industryBenchmark.geoScore,
        gapPercentage: Math.round(
          ((geoScore - industryBenchmark.geoScore) / industryBenchmark.geoScore) * 100
        ),
        topCompetitor: 92,
      },
      {
        dimension: "SEO (Search Engine Optimization)",
        yourScore: seoScore,
        industryAverage: industryBenchmark.seoScore,
        gap: seoScore - industryBenchmark.seoScore,
        gapPercentage: Math.round(
          ((seoScore - industryBenchmark.seoScore) / industryBenchmark.seoScore) * 100
        ),
        topCompetitor: 88,
      },
      {
        dimension: "AEO (Answer Engine Optimization)",
        yourScore: aeoScore,
        industryAverage: industryBenchmark.aeoScore,
        gap: aeoScore - industryBenchmark.aeoScore,
        gapPercentage: Math.round(
          ((aeoScore - industryBenchmark.aeoScore) / industryBenchmark.aeoScore) * 100
        ),
        topCompetitor: 85,
      },
      {
        dimension: "SMO (Social Media Optimization)",
        yourScore: smoScore,
        industryAverage: industryBenchmark.smoScore,
        gap: smoScore - industryBenchmark.smoScore,
        gapPercentage: Math.round(
          ((smoScore - industryBenchmark.smoScore) / industryBenchmark.smoScore) * 100
        ),
        topCompetitor: 90,
      },
      {
        dimension: "PPO (Product & Performance Optimization)",
        yourScore: ppoScore,
        industryAverage: industryBenchmark.ppoScore,
        gap: ppoScore - industryBenchmark.ppoScore,
        gapPercentage: Math.round(
          ((ppoScore - industryBenchmark.ppoScore) / industryBenchmark.ppoScore) * 100
        ),
        topCompetitor: 87,
      },
    ];

    // Determine positioning
    const allUnifiedScores = allScores.map((c) => c.unifiedScore).sort((a, b) => b - a);
    const overallRank = allUnifiedScores.indexOf(yourUnifiedScore) + 1;
    const percentilRank = Math.round(((allUnifiedScores.length - overallRank + 1) / allUnifiedScores.length) * 100);

    let competitiveStatus: "leader" | "competitive" | "lagging" = "competitive";
    if (percentilRank >= 80) competitiveStatus = "leader";
    else if (percentilRank < 40) competitiveStatus = "lagging";

    const positioning = {
      overallRank,
      totalCompetitors: allScores.length,
      percentilRank,
      competitiveStatus,
    };

    return {
      yourBrand,
      competitors,
      industryBenchmark,
      gaps,
      positioning,
    };
  }, [audit]);
}
