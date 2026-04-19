"use client";

import * as React from "react";
import { TrendingUp, Zap } from "lucide-react";

interface KeywordOpportunity {
  opportunity: string;
  currentMentions: number;
  suggestedMentions: number;
  estimatedImpact: "high" | "medium" | "low";
  type: "lsi" | "semantic" | "related" | "long-tail";
}

interface KeywordOpportunitiesCardProps {
  opportunities: KeywordOpportunity[];
}

export function KeywordOpportunitiesCard({ opportunities }: KeywordOpportunitiesCardProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "lsi":
        return "LSI Keyword";
      case "semantic":
        return "Semantic";
      case "related":
        return "Related Search";
      case "long-tail":
        return "Long-tail";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "lsi":
        return "bg-primary/10 text-primary";
      case "semantic":
        return "bg-success/10 text-success";
      case "related":
        return "bg-warning/10 text-warning";
      case "long-tail":
        return "bg-purple/10 text-purple";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "high":
        return { icon: "🔴", label: "High" };
      case "medium":
        return { icon: "🟡", label: "Medium" };
      case "low":
        return { icon: "🟢", label: "Low" };
      default:
        return { icon: "◯", label: impact };
    }
  };

  const highImpact = opportunities.filter((o) => o.estimatedImpact === "high");
  const mediumImpact = opportunities.filter((o) => o.estimatedImpact === "medium");
  const lowImpact = opportunities.filter((o) => o.estimatedImpact === "low");

  return (
    <div className="card-secondary p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Keyword Opportunities</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          LSI, semantic, and related keywords to strengthen content relevance
        </p>
      </div>

      {/* Priority breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-tertiary p-3 text-center border-l-2 border-l-error">
          <div className="text-lg font-bold text-error">{highImpact.length}</div>
          <div className="text-xs text-muted-foreground mt-1">High Impact</div>
        </div>
        <div className="card-tertiary p-3 text-center border-l-2 border-l-warning">
          <div className="text-lg font-bold text-warning">{mediumImpact.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Medium Impact</div>
        </div>
        <div className="card-tertiary p-3 text-center border-l-2 border-l-success">
          <div className="text-lg font-bold text-success">{lowImpact.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Low Impact</div>
        </div>
      </div>

      {/* Opportunities list */}
      <div className="space-y-3">
        {opportunities.map((opp, idx) => {
          const impact = getImpactBadge(opp.estimatedImpact);
          const increase = opp.suggestedMentions - opp.currentMentions;
          // currentMentions === 0 → division by zero is Infinity, not NaN, so
          // the `|| 0` fallback doesn't catch it. Show a dash instead of a
          // percentage when there's no baseline to compute against.
          const hasBaseline = opp.currentMentions > 0;
          const increasePercent = hasBaseline
            ? Math.round(((opp.suggestedMentions - opp.currentMentions) / opp.currentMentions) * 100)
            : null;

          return (
            <div key={idx} className="card-tertiary p-4 border rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{opp.opportunity}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg">{impact.icon}</div>
                  <div className="text-xs font-semibold text-muted-foreground mt-1">
                    {impact.label}
                  </div>
                </div>
              </div>

              {/* Type badge */}
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-1 rounded font-medium ${getTypeColor(opp.type)}`}>
                  {getTypeLabel(opp.type)}
                </span>
              </div>

              {/* Current vs Suggested */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Current</span>
                  <div className="font-semibold text-foreground mt-1">{opp.currentMentions}x</div>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-primary">→</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Target</span>
                  <div className="font-semibold text-success mt-1">{opp.suggestedMentions}x</div>
                </div>
              </div>

              {/* Increase indicator */}
              <div className="bg-primary/5 border border-primary/20 rounded p-2 flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">
                  <strong className="text-primary">{increase}</strong> additional mentions
                  {increasePercent !== null && (
                    <> ({increasePercent > 0 ? "+" : ""}{increasePercent}%)</>
                  )}
                  {increasePercent === null && <> (new keyword)</>}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendation */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-foreground mb-1">Implementation Strategy:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Start with high-impact opportunities (typically 2-3 points per keyword)</li>
          <li>• Naturally integrate keywords into headings, body text, and meta descriptions</li>
          <li>• Create new content pages targeting long-tail variations</li>
          <li>• Monitor rank changes after optimization (allow 2-4 weeks for indexing)</li>
        </ul>
      </div>
    </div>
  );
}
