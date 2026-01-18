"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Zap,
  Image,
  Code,
  Cpu,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PerformanceRecommendation {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  category:
    | "image-optimization"
    | "caching"
    | "code-splitting"
    | "compression"
    | "lazy-loading"
    | "scripts";
  estimatedImprovement: number; // milliseconds or percentage
  implementation?: string;
}

interface PerformanceRecommendationsProps {
  recommendations: PerformanceRecommendation[];
}

export function PerformanceRecommendations({
  recommendations,
}: PerformanceRecommendationsProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "image-optimization":
        return <Image className="h-4 w-4" />;
      case "caching":
        return <Cpu className="h-4 w-4" />;
      case "code-splitting":
        return <Code className="h-4 w-4" />;
      case "compression":
        return <Zap className="h-4 w-4" />;
      case "lazy-loading":
        return <Eye className="h-4 w-4" />;
      case "scripts":
        return <Code className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      "image-optimization": "Image Optimization",
      caching: "Caching Strategy",
      "code-splitting": "Code Splitting",
      compression: "Compression",
      "lazy-loading": "Lazy Loading",
      scripts: "Script Optimization",
    };
    return labels[category] || "Performance";
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-error/10 text-error border-error/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "low":
        return "bg-muted/10 text-muted-foreground border-muted/20";
      default:
        return "bg-muted/10";
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "low":
        return "bg-success/10 text-success border-success/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "high":
        return "bg-error/10 text-error border-error/20";
      default:
        return "bg-muted/10";
    }
  };

  // Sort by impact + effort (high impact, low effort first)
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const impactScore = { high: 3, medium: 2, low: 1 };
    const effortScore = { low: 3, medium: 2, high: 1 };

    const aScore = impactScore[a.impact] * effortScore[a.effort];
    const bScore = impactScore[b.impact] * effortScore[b.effort];

    return bScore - aScore;
  });

  // Group by impact
  const groupedByImpact = {
    high: sortedRecommendations.filter((r) => r.impact === "high"),
    medium: sortedRecommendations.filter((r) => r.impact === "medium"),
    low: sortedRecommendations.filter((r) => r.impact === "low"),
  };

  return (
    <div className="card-secondary p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-1">Performance Recommendations</h3>
        <p className="text-sm text-muted-foreground">
          Prioritized by impact and ease of implementation
        </p>
      </div>

      <div className="space-y-6">
        {/* High Impact */}
        {groupedByImpact.high.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2 text-sm font-semibold text-error">
              <AlertCircle className="h-4 w-4" />
              High Impact ({groupedByImpact.high.length})
            </div>
            <div className="space-y-2">
              {groupedByImpact.high.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        )}

        {/* Medium Impact */}
        {groupedByImpact.medium.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2 text-sm font-semibold text-warning">
              <TrendingDown className="h-4 w-4" />
              Medium Impact ({groupedByImpact.medium.length})
            </div>
            <div className="space-y-2">
              {groupedByImpact.medium.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        )}

        {/* Low Impact */}
        {groupedByImpact.low.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2 text-sm font-semibold text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Low Impact ({groupedByImpact.low.length})
            </div>
            <div className="space-y-2">
              {groupedByImpact.low.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        )}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="text-muted-foreground">
            Great job! No performance improvements needed.
          </p>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: PerformanceRecommendation;
}) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "image-optimization":
        return <Image className="h-4 w-4" />;
      case "caching":
        return <Cpu className="h-4 w-4" />;
      case "code-splitting":
        return <Code className="h-4 w-4" />;
      case "compression":
        return <Zap className="h-4 w-4" />;
      case "lazy-loading":
        return <Eye className="h-4 w-4" />;
      case "scripts":
        return <Code className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      "image-optimization": "Image Optimization",
      caching: "Caching Strategy",
      "code-splitting": "Code Splitting",
      compression: "Compression",
      "lazy-loading": "Lazy Loading",
      scripts: "Script Optimization",
    };
    return labels[category] || "Performance";
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-error/10 text-error border-error/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "low":
        return "bg-muted/10 text-muted-foreground border-muted/20";
      default:
        return "bg-muted/10";
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "low":
        return "bg-success/10 text-success border-success/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "high":
        return "bg-error/10 text-error border-error/20";
      default:
        return "bg-muted/10";
    }
  };

  return (
    <div className="card-tertiary p-4 border space-y-3">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0 text-muted-foreground">
          {getCategoryIcon(recommendation.category)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{recommendation.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {recommendation.description}
          </p>
          {recommendation.implementation && (
            <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-muted pl-2">
              {recommendation.implementation}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={`text-xs border ${getImpactColor(recommendation.impact)}`}
        >
          {recommendation.impact === "high"
            ? "🔴 High Impact"
            : recommendation.impact === "medium"
            ? "🟡 Medium Impact"
            : "🟢 Low Impact"}
        </Badge>
        <Badge
          variant="outline"
          className={`text-xs border ${getEffortColor(recommendation.effort)}`}
        >
          {recommendation.effort === "low"
            ? "⚡ Easy"
            : recommendation.effort === "medium"
            ? "⚙️ Medium"
            : "🔨 Hard"}
        </Badge>
        <Badge variant="outline" className="text-xs text-primary">
          ~{recommendation.estimatedImprovement}ms saved
        </Badge>
      </div>
    </div>
  );
}
