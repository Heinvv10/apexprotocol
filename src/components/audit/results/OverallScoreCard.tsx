"use client";

import * as React from "react";
import { TrendingUp, AlertCircle } from "lucide-react";
import { Audit } from "@/hooks/useAudit";
import { ScoreTooltip } from "@/components/ui/score-tooltip";

interface OverallScoreCardProps {
  audit: Audit;
}

function getScoreGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: "A+", color: "text-success" };
  if (score >= 80) return { grade: "A", color: "text-success" };
  if (score >= 70) return { grade: "B", color: "text-warning" };
  if (score >= 60) return { grade: "C", color: "text-warning" };
  if (score >= 50) return { grade: "D", color: "text-error" };
  return { grade: "F", color: "text-error" };
}

export function OverallScoreCard({ audit }: OverallScoreCardProps) {
  const overallScore = audit.overallScore || 0;
  const { grade, color } = getScoreGrade(overallScore);

  return (
    <div className="card-primary p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">On-Page Audit Score</h3>
          <ScoreTooltip kind="audit" />
        </div>
        <TrendingUp className="h-5 w-5 text-primary" />
      </div>

      <div className="space-y-4">
        {/* Score Circle */}
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Background circle */}
            <svg className="absolute" width="160" height="160" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted-foreground/20"
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(overallScore / 100) * 2 * Math.PI * 70} ${2 * Math.PI * 70}`}
                strokeDashoffset="0"
                className={`${color} transition-all duration-500 -rotate-90 origin-center`}
                style={{ transform: "rotate(-90deg)" }}
              />
            </svg>
            {/* Score text */}
            <div className="text-center">
              <div className={`text-5xl font-bold ${color}`}>{overallScore}</div>
              <div className={`text-2xl font-bold ${color}`}>{grade}</div>
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="text-center space-y-1">
          <p className="text-muted-foreground text-sm">
            {overallScore >= 80 && "Excellent AI readiness"}
            {overallScore >= 60 && overallScore < 80 && "Good, but has room for improvement"}
            {overallScore >= 40 && overallScore < 60 && "Needs attention in key areas"}
            {overallScore < 40 && "Critical issues to address"}
          </p>
          {overallScore < 60 && (
            <div className="flex items-center justify-center gap-2 text-warning text-sm">
              <AlertCircle className="h-4 w-4" />
              Focus on critical and high issues
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
