"use client";

import * as React from "react";
import {
  TrendingUp,
  Sparkles,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatters";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { PredictiveChart, PredictiveDataPoint } from "./PredictiveChart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Opportunity data from API
 */
export interface Opportunity {
  entityType: string;
  entityId: string;
  entityName: string;
  currentScore: number;
  predictedScore: number;
  impact: number; // Percentage
  confidence: number; // 0-100 percentage
  timeframe: number; // Days
  targetDate: string;
  trend: "increasing" | "decreasing" | "stable";
  explanation: string;
}

interface EmergingOpportunitiesProps {
  brandId?: string;
  maxResults?: number;
  minConfidence?: number;
  minImpact?: number;
  timeframe?: "short" | "medium" | "long";
  className?: string;
  onOpportunityClick?: (opportunity: Opportunity) => void;
}

export function EmergingOpportunities({
  brandId,
  maxResults = 10,
  minConfidence = 70,
  minImpact = 10,
  timeframe = "medium",
  className,
  onOpportunityClick,
}: EmergingOpportunitiesProps) {
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = React.useState<Opportunity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Fetch opportunities
  React.useEffect(() => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }

    const fetchOpportunities = async () => {
      try {
        setIsLoading(true);
        setIsError(false);

        const params = new URLSearchParams({
          brandId,
          maxResults: maxResults.toString(),
          minConfidence: (minConfidence / 100).toString(),
          minImpact: minImpact.toString(),
          timeframe,
        });

        const response = await fetch(`/api/predictions/opportunities?${params}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch opportunities: ${response.statusText}`);
        }

        const data = await response.json();
        setOpportunities(data.opportunities || []);
      } catch (err) {
        console.error("Error fetching opportunities:", err);
        setIsError(true);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, [brandId, maxResults, minConfidence, minImpact, timeframe]);

  // Handle opportunity click
  const handleOpportunityClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsDialogOpen(true);
    onOpportunityClick?.(opportunity);
  };

  // Generate mock chart data for modal
  const generateChartData = (opportunity: Opportunity): PredictiveDataPoint[] => {
    const data: PredictiveDataPoint[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    // Generate 6 months of historical data leading to current score
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now);
      month.setMonth(month.getMonth() - i);
      const monthName = monthNames[month.getMonth()];

      // Interpolate between a baseline and current score
      const baseline = opportunity.currentScore * 0.8;
      const progress = (5 - i) / 5;
      const score = baseline + (opportunity.currentScore - baseline) * progress;

      data.push({
        month: monthName,
        actual: Math.round(score * 10) / 10,
        isPrediction: false,
      });
    }

    // Generate prediction data
    const futureDays = opportunity.timeframe;
    const futureMonths = Math.ceil(futureDays / 30);
    const scorePerMonth = (opportunity.predictedScore - opportunity.currentScore) / futureMonths;
    const confidenceRange = (opportunity.predictedScore - opportunity.currentScore) * 0.2;

    for (let i = 1; i <= futureMonths; i++) {
      const month = new Date(now);
      month.setMonth(month.getMonth() + i);
      const monthName = monthNames[month.getMonth()];

      const predicted = opportunity.currentScore + (scorePerMonth * i);

      data.push({
        month: monthName,
        predicted: Math.round(predicted * 10) / 10,
        confidenceLower: Math.max(0, Math.round((predicted - confidenceRange) * 10) / 10),
        confidenceUpper: Math.min(100, Math.round((predicted + confidenceRange) * 10) / 10),
        isPrediction: true,
      });
    }

    return data;
  };

  // Get timeframe label
  const getTimeframeLabel = (days: number): string => {
    if (days <= 30) return "30 days";
    if (days <= 60) return "60 days";
    return "90 days";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-warning" />
              Emerging Opportunities
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Predicted growth opportunities
            </p>
          </div>
        </div>
        <div className="h-64 w-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Finding opportunities...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-warning" />
              Emerging Opportunities
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Predicted growth opportunities
            </p>
          </div>
        </div>
        <div className="h-64 w-full flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-error mb-3" />
            <p className="text-sm text-error font-medium">Failed to load opportunities</p>
            <p className="text-xs text-muted-foreground mt-1">
              {error instanceof Error ? error.message : "Please try again later"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (opportunities.length === 0) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-warning" />
              Emerging Opportunities
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Predicted growth opportunities
            </p>
          </div>
        </div>
        <div className="h-64 w-full flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-foreground font-medium">No opportunities detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Generate predictions to discover emerging opportunities
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("card-secondary", className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-warning" />
              Emerging Opportunities
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {opportunities.length} predicted growth {opportunities.length === 1 ? "opportunity" : "opportunities"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-3 w-3" />
            <span>Sorted by impact</span>
          </div>
        </div>

        {/* Opportunities list */}
        <div className="space-y-3">
          {opportunities.map((opportunity, index) => (
            <button
              key={`${opportunity.entityId}-${index}`}
              onClick={() => handleOpportunityClick(opportunity)}
              className="w-full group relative overflow-hidden rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-200 p-4 text-left"
            >
              {/* Hover effect gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-warning/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              <div className="relative flex items-start justify-between gap-4">
                {/* Left side - Entity info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {opportunity.entityName}
                    </h4>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary shrink-0">
                      <ArrowUpRight className="h-3 w-3" />
                      {opportunity.trend}
                    </span>
                  </div>

                  {/* Score comparison */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Current:</span>
                      <span className="text-sm font-medium text-foreground">
                        {opportunity.currentScore.toFixed(1)}
                      </span>
                    </div>
                    <ArrowUpRight className="h-3 w-3 text-success" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Predicted:</span>
                      <span className="text-sm font-medium text-success">
                        {opportunity.predictedScore.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Impact and timeframe */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="font-medium text-success">
                        +{opportunity.impact.toFixed(1)}%
                      </span>
                      <span>impact</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{getTimeframeLabel(opportunity.timeframe)}</span>
                    </div>
                  </div>
                </div>

                {/* Right side - Confidence indicator */}
                <div className="shrink-0">
                  <ConfidenceIndicator
                    confidence={opportunity.confidence}
                    size="sm"
                    showLabel={false}
                    showIcon={false}
                  />
                </div>
              </div>

              {/* Click indicator */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="text-xs text-primary font-medium flex items-center gap-1">
                  View details
                  <ArrowUpRight className="h-3 w-3" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOpportunity && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-warning" />
                  {selectedOpportunity.entityName}
                </DialogTitle>
                <DialogDescription>
                  Predicted to grow by{" "}
                  <span className="font-semibold text-success">
                    +{selectedOpportunity.impact.toFixed(1)}%
                  </span>{" "}
                  over the next {getTimeframeLabel(selectedOpportunity.timeframe)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">Current Score</div>
                    <div className="text-2xl font-bold text-foreground">
                      {selectedOpportunity.currentScore.toFixed(1)}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">Predicted Score</div>
                    <div className="text-2xl font-bold text-success">
                      {selectedOpportunity.predictedScore.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Confidence indicator */}
                <div className="flex items-center justify-center p-4 rounded-lg bg-card/50 border border-border/50">
                  <ConfidenceIndicator
                    confidence={selectedOpportunity.confidence}
                    explanation={`Confidence: ${selectedOpportunity.confidence}% - ${
                      selectedOpportunity.confidence > 80
                        ? "High confidence prediction"
                        : selectedOpportunity.confidence >= 70
                        ? "Medium confidence prediction"
                        : "Low confidence prediction"
                    }`}
                    size="lg"
                  />
                </div>

                {/* Prediction chart */}
                <PredictiveChart
                  data={generateChartData(selectedOpportunity)}
                  title="Trend Forecast"
                  description={`Historical data and ${getTimeframeLabel(selectedOpportunity.timeframe)} prediction`}
                  showConfidenceBands={true}
                  showLegend={true}
                  height={300}
                />

                {/* Explanation */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Why this is an opportunity
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedOpportunity.explanation}
                  </p>
                </div>

                {/* Additional details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Entity Type:</span>
                    <span className="ml-2 font-medium text-foreground capitalize">
                      {selectedOpportunity.entityType}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target Date:</span>
                    <span className="ml-2 font-medium text-foreground">
                      {formatDate(selectedOpportunity.targetDate, "medium")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trend:</span>
                    <span className="ml-2 font-medium text-success capitalize">
                      {selectedOpportunity.trend}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <span className="ml-2 font-medium text-foreground">
                      {selectedOpportunity.timeframe} days
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
