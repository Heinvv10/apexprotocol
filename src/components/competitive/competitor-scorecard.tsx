"use client";

import * as React from "react";
import {
  Loader2,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  LayoutGrid,
  Table2,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScoreBadge, getGrade, getScoreColor } from "./score-badge";
import { ScoreBreakdownChart } from "./score-breakdown-chart";
import { ScoreComparisonTable } from "./score-comparison-table";
import { IndustryLeaderBadge } from "./industry-leader-badge";
import { ScoreTooltip } from "@/components/ui/score-tooltip";
import type { ScoresResponse } from "@/app/api/competitive/scores/route";

interface CompetitorScorecardProps {
  brandId: string;
  onCompetitorClick?: (competitorName: string) => void;
  className?: string;
}

type ViewMode = "grid" | "table" | "chart";

// Score category labels
const SCORE_LABELS = {
  geoScore: { short: "GEO", long: "AI Visibility" },
  seoScore: { short: "SEO", long: "Technical SEO" },
  aeoScore: { short: "AEO", long: "Answer Engine" },
  smoScore: { short: "SMO", long: "Social Media" },
  ppoScore: { short: "PPO", long: "Personal Brand" },
};

// Competitor card component
function CompetitorCard({
  competitor,
  brandScores,
  onDeepDive,
}: {
  competitor: ScoresResponse["competitorScores"][0];
  brandScores: ScoresResponse["brandScore"];
  onDeepDive?: () => void;
}) {
  const { text: gradeColor } = getScoreColor(competitor.unifiedScore);
  const overallDelta = competitor.unifiedScore - brandScores.unifiedScore;

  return (
    <div className="card-tertiary p-4 hover:bg-white/5 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">
            {competitor.competitorName}
          </h4>
          {competitor.competitorDomain && (
            <a
              href={`https://${competitor.competitorDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              {competitor.competitorDomain}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex flex-col items-end">
          <ScoreBadge score={competitor.unifiedScore} size="sm" showGrade />
          <span
            className={cn(
              "text-[10px] font-medium mt-1",
              overallDelta > 0 ? "text-error" : overallDelta < 0 ? "text-success" : "text-muted-foreground"
            )}
          >
            {overallDelta > 0 ? "+" : ""}{overallDelta} vs you
          </span>
        </div>
      </div>

      {/* 5-score mini breakdown */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Object.entries(SCORE_LABELS).map(([key, labels]) => {
          const score = competitor[key as keyof typeof competitor] as number;
          const brandScore = brandScores[key as keyof typeof brandScores] as number;
          const delta = score - brandScore;
          const { text } = getScoreColor(score);

          return (
            <div key={key} className="text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                {labels.short}
              </div>
              <div className={cn("text-sm font-semibold", text)}>{score}</div>
              <div
                className={cn(
                  "text-[10px]",
                  delta > 0 ? "text-error" : delta < 0 ? "text-success" : "text-muted-foreground"
                )}
              >
                {delta > 0 ? "+" : ""}{delta}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confidence & data source */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-3">
        <span>
          Confidence: <span className="font-medium">{competitor.confidence}%</span>
        </span>
        <span className="capitalize">{competitor.dataSource} data</span>
      </div>

      {/* Deep dive button */}
      {onDeepDive && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs h-8"
          onClick={onDeepDive}
        >
          Deep Dive Analysis
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      )}
    </div>
  );
}

export function CompetitorScorecard({
  brandId,
  onCompetitorClick,
  className,
}: CompetitorScorecardProps) {
  const [data, setData] = React.useState<ScoresResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");

  // Fetch scores
  const fetchScores = React.useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const url = new URL(`/api/competitive/scores`, window.location.origin);
      url.searchParams.set("brandId", brandId);
      if (!refresh) {
        url.searchParams.set("useCache", "true");
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch scores");

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [brandId]);

  React.useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // Refresh scores
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch("/api/competitive/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, action: "refresh" }),
      });
      await fetchScores(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh scores");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("card-secondary p-6", className)}>
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("card-secondary p-6", className)}>
        <div className="flex flex-col items-center justify-center h-[400px] text-error">
          <p>{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => fetchScores()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data || data.competitorScores.length === 0) {
    return (
      <div className={cn("card-secondary p-6", className)}>
        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
          <p className="text-sm">No competitor data available</p>
          <p className="text-xs mt-1">Add competitors to see scorecard</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-secondary overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Competitor Scorecard
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {data.brandName} vs {data.competitorScores.length} competitors
              </p>
            </div>
            <IndustryLeaderBadge
              position={data.ranking.position}
              total={data.ranking.total}
              brandName={data.brandName}
              showDetails={false}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center rounded-lg border border-border/30 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "grid"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "table"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Table2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("chart")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "chart"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Brand score summary */}
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ScoreBadge score={data.brandScore.unifiedScore} size="lg" showGrade />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {data.brandName}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  Your Digital Presence Score
                  <ScoreTooltip kind="unified" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(SCORE_LABELS).map(([key, labels]) => {
                const score = data.brandScore[key as keyof typeof data.brandScore] as number;
                const { text } = getScoreColor(score);
                return (
                  <div key={key} className="text-center">
                    <div className="text-[10px] text-muted-foreground uppercase">
                      {labels.short}
                    </div>
                    <div className={cn("text-lg font-bold", text)}>{score}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="p-4">
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.competitorScores.map((competitor) => (
              <CompetitorCard
                key={competitor.competitorName}
                competitor={competitor}
                brandScores={data.brandScore}
                onDeepDive={
                  onCompetitorClick
                    ? () => onCompetitorClick(competitor.competitorName)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {viewMode === "table" && (
          <ScoreComparisonTable
            brandName={data.brandName}
            brandScores={data.brandScore}
            competitors={data.competitorScores.map((c) => ({
              name: c.competitorName,
              domain: c.competitorDomain,
              scores: {
                geoScore: c.geoScore,
                seoScore: c.seoScore,
                aeoScore: c.aeoScore,
                smoScore: c.smoScore,
                ppoScore: c.ppoScore,
                unifiedScore: c.unifiedScore,
              },
            }))}
          />
        )}

        {viewMode === "chart" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Main radar chart - brand vs average */}
            <div className="card-tertiary p-4">
              <h4 className="text-sm font-medium text-foreground mb-4">
                Your Position vs Competitors
              </h4>
              <ScoreBreakdownChart
                brandName={data.brandName}
                brandScores={data.brandScore}
              />
            </div>

            {/* Individual comparisons */}
            {data.competitorScores.slice(0, 3).map((competitor) => (
              <div key={competitor.competitorName} className="card-tertiary p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-foreground">
                    vs {competitor.competitorName}
                  </h4>
                  {onCompetitorClick && (
                    <button
                      onClick={() => onCompetitorClick(competitor.competitorName)}
                      className="text-xs text-primary hover:underline"
                    >
                      Deep Dive
                    </button>
                  )}
                </div>
                <ScoreBreakdownChart
                  brandName={data.brandName}
                  brandScores={data.brandScore}
                  competitorName={competitor.competitorName}
                  competitorScores={{
                    geoScore: competitor.geoScore,
                    seoScore: competitor.seoScore,
                    aeoScore: competitor.aeoScore,
                    smoScore: competitor.smoScore,
                    ppoScore: competitor.ppoScore,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border/30 text-xs text-muted-foreground flex items-center justify-between">
        <span>Last updated: {new Date(data.lastUpdated).toLocaleString()}</span>
        <span>
          Position: #{data.ranking.position} of {data.ranking.total} ({data.ranking.percentile}th percentile)
        </span>
      </div>
    </div>
  );
}
