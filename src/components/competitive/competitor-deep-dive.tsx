"use client";

import * as React from "react";
import {
  Loader2,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  LineChart,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HeadToHeadComparison } from "./head-to-head-comparison";
import { StrengthsWeaknessesCard } from "./strengths-weaknesses-card";
import { BeatingCompetitorGuide } from "./beating-competitor-guide";
import { RoadmapGenerator } from "./roadmap-generator";
import type { DeepDiveResponse } from "@/app/api/competitive/deep-dive/[competitorName]/route";

interface CompetitorDeepDiveProps {
  brandId: string;
  competitorName: string;
  onBack?: () => void;
  className?: string;
}

export function CompetitorDeepDive({
  brandId,
  competitorName,
  onBack,
  className,
}: CompetitorDeepDiveProps) {
  const [data, setData] = React.useState<DeepDiveResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showRoadmapGenerator, setShowRoadmapGenerator] = React.useState(false);

  // Fetch deep dive data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(
        `/api/competitive/deep-dive/${encodeURIComponent(competitorName)}`,
        window.location.origin
      );
      url.searchParams.set("brandId", brandId);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch competitor analysis");

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [brandId, competitorName]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

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
            onClick={fetchData}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn("card-secondary p-6", className)}>
        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
          <p>No data available for this competitor</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="card-secondary p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    {data.competitor.name}
                  </h1>
                  {data.competitor.domain && (
                    <a
                      href={`https://${data.competitor.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Deep dive analysis vs {data.brand.name}
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Head to head comparison */}
        {data.competitor.scores && (
          <HeadToHeadComparison
            brandName={data.brand.name}
            brandScore={{
              ...data.brand.scores,
              grade: data.brand.scores.grade,
            }}
            competitorName={data.competitor.name}
            competitorScore={{
              ...data.competitor.scores,
              grade: data.competitor.scores.grade,
            }}
            headToHead={data.headToHead}
          />
        )}

        {/* SWOT Analysis */}
        <StrengthsWeaknessesCard
          strengths={data.strengths}
          weaknesses={data.weaknesses}
          opportunities={data.opportunities}
          threats={data.threats}
          competitorName={data.competitor.name}
        />

        {/* Action plan */}
        <BeatingCompetitorGuide
          competitorName={data.competitor.name}
          actionPlan={data.actionPlan}
          onGenerateRoadmap={() => setShowRoadmapGenerator(true)}
        />

        {/* Historical trend */}
        {data.historicalTrend.length > 0 && (
          <div className="card-secondary">
            <div className="p-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Historical Trend
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Competitor score over time (last 30 days)
              </p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {data.historicalTrend.slice(0, 8).map((point, index) => {
                  const prevPoint = data.historicalTrend[index + 1];
                  const trend = prevPoint && point.competitorScore !== undefined
                    ? (point.competitorScore || 0) - (prevPoint.competitorScore || 0)
                    : 0;

                  return (
                    <div
                      key={point.date}
                      className="p-3 rounded-lg bg-muted/20 border border-border/30"
                    >
                      <div className="text-xs text-muted-foreground">
                        {new Date(point.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-lg font-semibold text-foreground">
                          {point.competitorScore || "N/A"}
                        </span>
                        {trend !== 0 && (
                          <span
                            className={cn(
                              "flex items-center text-xs",
                              trend > 0 ? "text-error" : "text-success"
                            )}
                          >
                            {trend > 0 ? (
                              <TrendingUp className="w-3 h-3 mr-0.5" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-0.5" />
                            )}
                            {Math.abs(trend)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {data.historicalTrend.length > 8 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Showing latest 8 data points
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Roadmap generator modal */}
      <RoadmapGenerator
        brandId={brandId}
        competitors={data.competitor.scores ? [{
          name: data.competitor.name,
          unifiedScore: data.competitor.scores.unifiedScore,
        }] : []}
        currentScore={data.brand.scores.unifiedScore}
        open={showRoadmapGenerator}
        onOpenChange={setShowRoadmapGenerator}
      />
    </>
  );
}
