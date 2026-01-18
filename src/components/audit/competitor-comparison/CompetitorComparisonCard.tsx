"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CompetitorData {
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

interface CompetitorComparisonCardProps {
  yourBrand: {
    name: string;
    unifiedScore: number;
    geoScore: number;
    seoScore: number;
    aeoScore: number;
    smoScore: number;
    ppoScore: number;
  };
  competitors: CompetitorData[];
  industryBenchmark: {
    unifiedScore: number;
  };
}

export function CompetitorComparisonCard({
  yourBrand,
  competitors,
  industryBenchmark,
}: CompetitorComparisonCardProps) {
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-error" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCompetitiveStatus = (score: number, benchmark: number) => {
    const diff = score - benchmark;
    if (diff > 5) return { icon: "📈", color: "text-success", label: "Leading" };
    if (diff > -5) return { icon: "➡️", color: "text-warning", label: "Competitive" };
    return { icon: "📉", color: "text-error", label: "Lagging" };
  };

  const allBrands = [yourBrand, ...competitors] as (CompetitorData & { name?: string })[];
  const sortedBrands = [...allBrands].sort((a, b) => b.unifiedScore - a.unifiedScore);

  return (
    <div className="card-secondary p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Competitor Comparison</h3>
        <p className="text-sm text-muted-foreground">
          Head-to-head comparison with top competitors and industry benchmark
        </p>
      </div>

      {/* Overall ranking */}
      <div className="card-tertiary p-6 border bg-gradient-to-br from-primary/5 to-muted/5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-3xl font-bold text-primary">{yourBrand.unifiedScore}</div>
            <div className="text-sm text-muted-foreground mt-2">Your Unified Score</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-muted-foreground">
              {industryBenchmark.unifiedScore}
            </div>
            <div className="text-sm text-muted-foreground mt-2">Industry Average</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            You are{" "}
            <strong className={yourBrand.unifiedScore > industryBenchmark.unifiedScore ? "text-success" : "text-error"}>
              {Math.abs(yourBrand.unifiedScore - industryBenchmark.unifiedScore)} points{" "}
              {yourBrand.unifiedScore > industryBenchmark.unifiedScore ? "above" : "below"}
            </strong>{" "}
            the industry average
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Score Breakdown (5 Dimensions)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "GEO", score: yourBrand.geoScore },
            { label: "SEO", score: yourBrand.seoScore },
            { label: "AEO", score: yourBrand.aeoScore },
            { label: "SMO", score: yourBrand.smoScore },
            { label: "PPO", score: yourBrand.ppoScore },
          ].map((dim, idx) => (
            <div key={idx} className="card-tertiary p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{dim.label}</span>
                <span className="text-lg font-bold text-primary">{dim.score}</span>
              </div>
              <div className="w-full bg-muted/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-success h-full rounded-full"
                  style={{ width: `${(dim.score / 100) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitor rankings */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Competitive Ranking</h4>
        {sortedBrands.map((brand, idx) => {
          const status = getCompetitiveStatus(
            brand.unifiedScore,
            industryBenchmark.unifiedScore
          );
          const isYourBrand = brand.name === yourBrand.name;

          return (
            <div
              key={idx}
              className={`p-4 border rounded-lg ${isYourBrand ? "card-tertiary border-primary bg-primary/5" : "card-tertiary"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-lg font-bold text-muted-foreground w-6">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isYourBrand ? "text-primary" : ""}`}>
                      {brand.name}
                    </p>
                    {brand.domain && (
                      <p className="text-xs text-muted-foreground truncate">{brand.domain}</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-primary">{brand.unifiedScore}</div>
                  {brand.trend && <div className="mt-1 flex justify-end">{getTrendIcon(brand.trend)}</div>}
                </div>
              </div>

              {/* Status indicator */}
              <div className="mt-3 flex items-center gap-2">
                <span className={`text-lg ${status.color}`}>{status.icon}</span>
                <span className="text-xs text-muted-foreground">{status.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Insight:</strong> Your brand ranks{" "}
          <strong className="text-primary">
            #{sortedBrands.findIndex((b) => b.name === yourBrand.name) + 1} of {sortedBrands.length}
          </strong>{" "}
          in your competitive set. Focus on high-impact improvements to close the gap with leaders.
        </p>
      </div>
    </div>
  );
}
