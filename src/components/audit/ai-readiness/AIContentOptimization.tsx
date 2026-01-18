"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ContentOptimization {
  title: string;
  description: string;
  status: "optimized" | "partial" | "needs-improvement";
  score: number;
  recommendation: string;
  impact: "high" | "medium" | "low";
  icon: string;
}

interface AIContentOptimizationProps {
  optimizations: ContentOptimization[];
}

export function AIContentOptimization({
  optimizations,
}: AIContentOptimizationProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimized":
        return "bg-success/10 border-success/20";
      case "partial":
        return "bg-warning/10 border-warning/20";
      case "needs-improvement":
        return "bg-error/10 border-error/20";
      default:
        return "bg-muted/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "optimized":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "partial":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case "needs-improvement":
        return <AlertCircle className="h-4 w-4 text-error" />;
      default:
        return null;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "high":
        return "🔴 High Impact";
      case "medium":
        return "🟡 Medium Impact";
      case "low":
        return "🟢 Low Impact";
      default:
        return "Impact";
    }
  };

  const optimizedCount = optimizations.filter(
    (o) => o.status === "optimized"
  ).length;
  const averageScore =
    optimizations.length > 0
      ? Math.round(
          optimizations.reduce((sum, o) => sum + o.score, 0) /
            optimizations.length
        )
      : 0;

  return (
    <div className="card-secondary p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">AI Content Optimization</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Content structure optimizations to improve AI readability and citation
          potential
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-tertiary p-3 text-center">
          <div className="text-2xl font-bold text-success">{optimizedCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Optimized</div>
        </div>
        <div className="card-tertiary p-3 text-center">
          <div className="text-2xl font-bold text-primary">{averageScore}</div>
          <div className="text-xs text-muted-foreground mt-1">Avg Score</div>
        </div>
        <div className="card-tertiary p-3 text-center">
          <div className="text-2xl font-bold text-warning">
            {optimizations.length - optimizedCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            To Improve
          </div>
        </div>
      </div>

      {/* Optimization items */}
      <div className="space-y-3">
        {optimizations.map((opt, idx) => (
          <div
            key={idx}
            className={`card-tertiary p-4 border rounded-lg space-y-3 ${getStatusColor(
              opt.status
            )}`}
          >
            <div className="flex items-start gap-3">
              <div className="text-xl flex-shrink-0">{opt.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{opt.title}</span>
                  {getStatusIcon(opt.status)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {opt.description}
                </p>
              </div>
            </div>

            {/* Score bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Optimization Level</span>
                <span className="font-semibold">{opt.score}%</span>
              </div>
              <Progress value={opt.score} className="h-2" />
            </div>

            {/* Recommendation and impact */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="text-xs">
                <p className="font-medium text-muted-foreground mb-1">
                  Recommendation:
                </p>
                <p className="text-muted-foreground italic">{opt.recommendation}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded bg-muted/50 text-muted-foreground">
                  {getImpactBadge(opt.impact)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Tip:</strong> Well-structured content with clear headings,
          FAQs, and schema markup is more likely to be selected by LLMs for
          citation and inclusion in AI responses.
        </p>
      </div>
    </div>
  );
}
