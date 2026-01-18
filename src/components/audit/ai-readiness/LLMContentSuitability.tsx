"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SuitabilityFactor {
  name: string;
  score: number;
  description: string;
  examples?: string[];
  icon: string;
}

interface LLMContentSuitabilityProps {
  factors: SuitabilityFactor[];
  overallScore: number;
  recommendation: string;
}

export function LLMContentSuitability({
  factors,
  overallScore,
  recommendation,
}: LLMContentSuitabilityProps) {
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { icon: "✅", color: "text-success" };
    if (score >= 60) return { icon: "🟡", color: "text-warning" };
    if (score >= 40) return { icon: "⚠️", color: "text-error" };
    return { icon: "❌", color: "text-error" };
  };

  const getSuitabilityLevel = (score: number) => {
    if (score >= 85) return "Highly Suitable";
    if (score >= 70) return "Suitable";
    if (score >= 50) return "Somewhat Suitable";
    if (score >= 35) return "Marginally Suitable";
    return "Not Suitable";
  };

  const getSuitabilityColor = (score: number) => {
    if (score >= 85) return "bg-success/10 border-success/20";
    if (score >= 70) return "bg-success/5 border-success/10";
    if (score >= 50) return "bg-warning/10 border-warning/20";
    if (score >= 35) return "bg-error/5 border-error/10";
    return "bg-error/10 border-error/20";
  };

  const topFactors = factors.sort((a, b) => b.score - a.score).slice(0, 3);
  const needsImprovement = factors.filter((f) => f.score < 60);

  return (
    <div className="card-secondary p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">LLM Content Suitability</h3>
        <p className="text-sm text-muted-foreground">
          How well your content aligns with LLM training and citation standards
        </p>
      </div>

      {/* Overall suitability */}
      <div className={`card-tertiary p-6 border rounded-lg space-y-4 ${getSuitabilityColor(overallScore)}`}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-4xl font-bold">{overallScore}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Suitability Score
            </div>
          </div>
          <div className="flex items-center justify-end">
            <div className="text-center">
              <div className="text-3xl mb-2">
                {getScoreStatus(overallScore).icon}
              </div>
              <div className={`text-lg font-semibold ${getScoreStatus(overallScore).color}`}>
                {getSuitabilityLevel(overallScore)}
              </div>
            </div>
          </div>
        </div>

        <Progress value={overallScore} className="h-3" />

        <p className="text-sm text-muted-foreground italic">{recommendation}</p>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Suitability Factors</h4>
        {factors.map((factor, idx) => {
          const status = getScoreStatus(factor.score);
          return (
            <div key={idx} className="card-tertiary p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-xl flex-shrink-0">{factor.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{factor.name}</span>
                      <span className="text-lg">{status.icon}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {factor.description}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl font-bold">{factor.score}</div>
                  <div className="text-xs text-muted-foreground">%</div>
                </div>
              </div>

              {/* Score bar */}
              <Progress value={factor.score} className="h-2" />

              {/* Examples if provided */}
              {factor.examples && factor.examples.length > 0 && (
                <div className="pt-2 border-t border-border/50 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Examples:
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {factor.examples.map((example, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick insights */}
      {needsImprovement.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-foreground">
            Areas for Improvement:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {needsImprovement.map((factor, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-warning flex-shrink-0">•</span>
                <span>{factor.name} ({factor.score}%)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top strengths */}
      {topFactors.length > 0 && (
        <div className="bg-success/5 border border-success/20 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-foreground">
            Content Strengths:
          </p>
          <div className="space-y-1">
            {topFactors.map((factor, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{factor.name}</span>
                <span className="font-semibold text-success">{factor.score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
