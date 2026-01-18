"use client";

import * as React from "react";
import { AlertCircle, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Gap {
  dimension: string;
  yourScore: number;
  industryAverage: number;
  gap: number;
  gapPercentage: number;
  topCompetitor: number;
}

interface GapAnalysisCardProps {
  gaps: Gap[];
}

export function GapAnalysisCard({ gaps }: GapAnalysisCardProps) {
  const priorityGaps = gaps.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  const largestGap = priorityGaps[0];
  const highestScore = gaps.reduce((max, g) => (g.yourScore > max.yourScore ? g : max));

  return (
    <div className="card-secondary p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Gap Analysis vs Industry Benchmark</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Identify your strongest and weakest dimensions compared to industry average
        </p>
      </div>

      {/* Summary insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card-tertiary p-4 border rounded-lg space-y-2">
          <div className="text-xs text-muted-foreground">Your Strongest Area</div>
          <div className="text-lg font-bold text-success">{highestScore.dimension}</div>
          <div className="text-sm text-muted-foreground">
            <strong className="text-success">{highestScore.yourScore}</strong> vs industry avg{" "}
            <strong>{highestScore.industryAverage}</strong>
          </div>
        </div>

        <div className="card-tertiary p-4 border rounded-lg space-y-2">
          <div className="text-xs text-muted-foreground">Biggest Gap</div>
          <div className="text-lg font-bold text-error">{largestGap.dimension}</div>
          <div className="text-sm text-muted-foreground">
            <strong className="text-error">{largestGap.gap > 0 ? "+" : ""}{largestGap.gap}</strong> points (
            {largestGap.gapPercentage > 0 ? "+" : ""}{largestGap.gapPercentage}%)
          </div>
        </div>
      </div>

      {/* Gap breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Detailed Gap Analysis</h4>
        {priorityGaps.map((gap, idx) => {
          const isLeading = gap.yourScore > gap.industryAverage;
          const gapColor = isLeading ? "text-success" : "text-error";
          const gapIcon = isLeading ? "📈" : "📉";

          return (
            <div key={idx} className="card-tertiary p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{gap.dimension}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-2xl font-bold ${gapColor}`}>
                    {isLeading ? "+" : ""}{gap.gapPercentage}%
                  </div>
                  <div className="text-lg mt-1">{gapIcon}</div>
                </div>
              </div>

              {/* Score comparison */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Your Score</span>
                  <div className="font-semibold text-lg text-primary mt-1">{gap.yourScore}</div>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-muted-foreground">→</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Industry Avg</span>
                  <div className="font-semibold text-lg text-muted-foreground mt-1">
                    {gap.industryAverage}
                  </div>
                </div>
              </div>

              {/* Benchmark bars */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Your Position</div>
                <Progress value={(gap.yourScore / 100) * 100} className="h-2" />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Industry Average</div>
                <Progress value={(gap.industryAverage / 100) * 100} className="h-2 bg-muted/30" />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Top Competitor</div>
                <Progress value={(gap.topCompetitor / 100) * 100} className="h-2 bg-muted/20" />
              </div>

              {/* Gap summary */}
              {isLeading ? (
                <div className="bg-success/5 border border-success/20 rounded p-2 flex gap-2">
                  <span className="text-success flex-shrink-0 text-sm">✓</span>
                  <span className="text-xs text-muted-foreground">
                    You're performing <strong className="text-success">{Math.abs(gap.gap)} points</strong> above
                    industry average in this dimension
                  </span>
                </div>
              ) : (
                <div className="bg-error/5 border border-error/20 rounded p-2 flex gap-2">
                  <AlertCircle className="h-3 w-3 text-error flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground">
                    You're <strong className="text-error">{Math.abs(gap.gap)} points</strong> below
                    industry average - opportunity to improve
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-foreground mb-1">Gap Closure Strategy:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Focus on closing the largest gaps first (highest ROI)</li>
          <li>• Benchmark against top competitor in each dimension</li>
          <li>• Implement targeted improvements aligned with your strengths</li>
          <li>• Reaudit monthly to track progress toward industry average</li>
        </ul>
      </div>
    </div>
  );
}
