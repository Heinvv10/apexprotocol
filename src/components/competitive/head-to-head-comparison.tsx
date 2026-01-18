"use client";

import * as React from "react";
import { Trophy, Target, Minus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreBadge, getScoreColor } from "./score-badge";
import { ScoreBreakdownChart } from "./score-breakdown-chart";

interface ComparisonResult {
  category: string;
  brandScore: number;
  competitorScore: number;
  gap: number;
  winner: "brand" | "competitor" | "tie";
  insight: string;
}

interface HeadToHeadComparisonProps {
  brandName: string;
  brandScore: {
    geoScore: number;
    seoScore: number;
    aeoScore: number;
    smoScore: number;
    ppoScore: number;
    unifiedScore: number;
    grade: string;
  };
  competitorName: string;
  competitorScore: {
    geoScore: number;
    seoScore: number;
    aeoScore: number;
    smoScore: number;
    ppoScore: number;
    unifiedScore: number;
    grade: string;
  };
  headToHead: {
    geoComparison: ComparisonResult;
    seoComparison: ComparisonResult;
    aeoComparison: ComparisonResult;
    smoComparison: ComparisonResult;
    ppoComparison: ComparisonResult;
    overallWinner: "brand" | "competitor" | "tie";
    brandWinCount: number;
    competitorWinCount: number;
  };
  className?: string;
}

// Winner badge component
function WinnerBadge({ winner }: { winner: "brand" | "competitor" | "tie" }) {
  if (winner === "tie") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted/30 text-muted-foreground">
        <Minus className="w-3 h-3" />
        Tie
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        winner === "brand"
          ? "bg-success/20 text-success"
          : "bg-error/20 text-error"
      )}
    >
      <Trophy className="w-3 h-3" />
      {winner === "brand" ? "You win" : "They win"}
    </span>
  );
}

// Comparison row
function ComparisonRow({
  comparison,
  brandName,
  competitorName,
}: {
  comparison: ComparisonResult;
  brandName: string;
  competitorName: string;
}) {
  const brandColor = getScoreColor(comparison.brandScore);
  const competitorColor = getScoreColor(comparison.competitorScore);

  return (
    <div className="p-4 border rounded-lg border-border/30 hover:bg-white/5 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-foreground">{comparison.category}</span>
        <WinnerBadge winner={comparison.winner} />
      </div>

      {/* Score bars */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-16 truncate">
            {brandName}
          </span>
          <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${comparison.brandScore}%` }}
            />
          </div>
          <span className={cn("text-sm font-semibold w-8 text-right", brandColor.text)}>
            {comparison.brandScore}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-16 truncate">
            {competitorName}
          </span>
          <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${comparison.competitorScore}%` }}
            />
          </div>
          <span className={cn("text-sm font-semibold w-8 text-right", competitorColor.text)}>
            {comparison.competitorScore}
          </span>
        </div>
      </div>

      {/* Gap indicator */}
      <div
        className={cn(
          "text-xs",
          comparison.gap > 0
            ? "text-success"
            : comparison.gap < 0
            ? "text-error"
            : "text-muted-foreground"
        )}
      >
        Gap: {comparison.gap > 0 ? "+" : ""}{comparison.gap} points
      </div>

      {/* Insight */}
      <p className="text-xs text-muted-foreground mt-2 italic">
        {comparison.insight}
      </p>
    </div>
  );
}

export function HeadToHeadComparison({
  brandName,
  brandScore,
  competitorName,
  competitorScore,
  headToHead,
  className,
}: HeadToHeadComparisonProps) {
  const comparisons = [
    headToHead.geoComparison,
    headToHead.seoComparison,
    headToHead.aeoComparison,
    headToHead.smoComparison,
    headToHead.ppoComparison,
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall winner card */}
      <div className="card-primary p-6">
        <div className="flex items-center justify-between">
          {/* Brand side */}
          <div className="flex items-center gap-4">
            <ScoreBadge score={brandScore.unifiedScore} size="lg" showGrade />
            <div>
              <div className="text-sm text-muted-foreground">You</div>
              <div className="text-lg font-bold text-foreground">{brandName}</div>
              <div className="text-xs text-muted-foreground">
                Grade: {brandScore.grade}
              </div>
            </div>
          </div>

          {/* VS indicator */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "text-3xl font-bold",
                headToHead.overallWinner === "brand"
                  ? "text-success"
                  : headToHead.overallWinner === "competitor"
                  ? "text-error"
                  : "text-muted-foreground"
              )}
            >
              VS
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-success font-bold">
                {headToHead.brandWinCount}
              </span>
              <span className="text-muted-foreground">-</span>
              <span className="text-error font-bold">
                {headToHead.competitorWinCount}
              </span>
            </div>
            <div className="mt-2">
              {headToHead.overallWinner === "brand" ? (
                <span className="text-sm font-medium text-success flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  You're winning!
                </span>
              ) : headToHead.overallWinner === "competitor" ? (
                <span className="text-sm font-medium text-error flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  Room to improve
                </span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  Evenly matched
                </span>
              )}
            </div>
          </div>

          {/* Competitor side */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Competitor</div>
              <div className="text-lg font-bold text-foreground">
                {competitorName}
              </div>
              <div className="text-xs text-muted-foreground">
                Grade: {competitorScore.grade}
              </div>
            </div>
            <ScoreBadge score={competitorScore.unifiedScore} size="lg" showGrade />
          </div>
        </div>
      </div>

      {/* Radar chart comparison */}
      <div className="card-secondary p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Score Comparison
        </h3>
        <ScoreBreakdownChart
          brandName={brandName}
          brandScores={{
            geoScore: brandScore.geoScore,
            seoScore: brandScore.seoScore,
            aeoScore: brandScore.aeoScore,
            smoScore: brandScore.smoScore,
            ppoScore: brandScore.ppoScore,
          }}
          competitorName={competitorName}
          competitorScores={{
            geoScore: competitorScore.geoScore,
            seoScore: competitorScore.seoScore,
            aeoScore: competitorScore.aeoScore,
            smoScore: competitorScore.smoScore,
            ppoScore: competitorScore.ppoScore,
          }}
        />
      </div>

      {/* Category comparisons */}
      <div className="card-secondary">
        <div className="p-4 border-b border-border/30">
          <h3 className="text-lg font-semibold text-foreground">
            Category Breakdown
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Detailed comparison across all metrics
          </p>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comparisons.map((comparison) => (
            <ComparisonRow
              key={comparison.category}
              comparison={comparison}
              brandName={brandName}
              competitorName={competitorName}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
