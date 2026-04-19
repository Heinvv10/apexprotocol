"use client";

import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlatformMetrics {
  platform: string;
  displayName: string;
  tier: "tier_1" | "tier_2" | "tier_3" | "tier_4";
  icon: string;
  visibility: number;
  position: number | null;
  confidence: number;
  citations: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  lastUpdated: Date;
  status: "active" | "inactive" | "error";
}

interface PlatformDeepDiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: PlatformMetrics | null;
  allPlatforms: PlatformMetrics[];
}

const TIER_COLORS = {
  tier_1: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  tier_2: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  tier_3: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  tier_4: "bg-pink-500/10 text-pink-400 border-pink-500/30",
};

const getVisibilityColor = (visibility: number) => {
  if (visibility >= 85) return "text-green-400";
  if (visibility >= 70) return "text-yellow-400";
  return "text-red-400";
};

const getVisibilityStatus = (visibility: number) => {
  if (visibility >= 85) return "Excellent";
  if (visibility >= 70) return "Good";
  if (visibility >= 50) return "Fair";
  return "Poor";
};

export function PlatformDeepDiveModal({
  open,
  onOpenChange,
  platform,
  allPlatforms,
}: PlatformDeepDiveModalProps) {
  // Calculate comparisons — hooks must run before any early return
  const comparisons = useMemo(() => {
    if (!platform) return null;
    const avgVisibility =
      allPlatforms.reduce((sum, p) => sum + p.visibility, 0) /
      allPlatforms.length;
    const avgPosition =
      allPlatforms
        .filter((p) => p.position !== null)
        .reduce((sum, p) => sum + (p.position || 0), 0) /
      allPlatforms.filter((p) => p.position !== null).length;
    const avgConfidence =
      allPlatforms.reduce((sum, p) => sum + p.confidence, 0) /
      allPlatforms.length;

    return {
      visibilityVsAvg:
        Math.round((platform.visibility - avgVisibility) * 100) / 100,
      positionVsAvg:
        platform.position && !isNaN(avgPosition)
          ? Math.round((avgPosition - (platform.position || 0)) * 100) / 100
          : 0,
      confidenceVsAvg:
        Math.round((platform.confidence - avgConfidence) * 100) / 100,
      visibilityRank:
        allPlatforms.filter((p) => p.visibility > platform.visibility).length +
        1,
      positionRank: platform.position || allPlatforms.length,
    };
  }, [platform, allPlatforms]);

  // Analyze strengths and weaknesses
  const analysis = useMemo(() => {
    if (!platform) return null;
    const strengths: string[] = [];
    const opportunities: string[] = [];

    if (platform.visibility >= 85) strengths.push("Strong visibility");
    else opportunities.push("Improve visibility");

    if (platform.confidence >= 90) strengths.push("High confidence scores");
    else opportunities.push("Increase confidence in mentions");

    if (platform.citations >= 200) strengths.push("High citation count");
    else opportunities.push("Drive more citations");

    if (
      platform.position !== null &&
      platform.position <= 3
    )
      strengths.push("Top 3 ranking");
    else if (platform.position !== null)
      opportunities.push(`Currently ranked #${platform.position}`);

    if (platform.trend === "up") strengths.push("Positive momentum");
    else if (platform.trend === "down")
      opportunities.push("Reverse downward trend");

    return { strengths, opportunities };
  }, [platform]);

  // Early return safe now — all hooks have run.
  if (!platform || !comparisons || !analysis) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{platform.icon}</span>
            <div>
              <DialogTitle className="text-2xl text-white">
                {platform.displayName}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Deep-dive analysis and performance metrics
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Platform Status */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="card-secondary p-4">
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    platform.status === "active" && "bg-green-400",
                    platform.status === "inactive" && "bg-gray-400",
                    platform.status === "error" && "bg-red-400"
                  )}
                />
                <span className="font-semibold text-white capitalize">
                  {platform.status}
                </span>
              </div>
            </Card>

            <Card className="card-secondary p-4">
              <div className="text-sm text-gray-400 mb-1">Tier</div>
              <Badge className={cn("border", TIER_COLORS[platform.tier])}>
                {platform.tier === "tier_1"
                  ? "Tier 1 (Major)"
                  : platform.tier === "tier_2"
                    ? "Tier 2 (Regional)"
                    : `Tier ${platform.tier.split("_")[1]}`}
              </Badge>
            </Card>
          </div>

          {/* Key Metrics */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Key Metrics
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Visibility */}
              <Card className="card-tertiary p-4">
                <div className="text-sm text-gray-400 mb-2">Visibility</div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn("text-3xl font-bold", getVisibilityColor(platform.visibility))}
                  >
                    {platform.visibility}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {getVisibilityStatus(platform.visibility)}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {comparisons.visibilityVsAvg > 0 ? "+" : ""}
                  {comparisons.visibilityVsAvg}% vs average
                </div>
              </Card>

              {/* Position */}
              <Card className="card-tertiary p-4">
                <div className="text-sm text-gray-400 mb-2">Position</div>
                <div className="text-3xl font-bold text-cyan-400">
                  {platform.position ? `#${platform.position}` : "N/A"}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Rank {comparisons.positionRank} of {allPlatforms.length}
                </div>
              </Card>

              {/* Confidence */}
              <Card className="card-tertiary p-4">
                <div className="text-sm text-gray-400 mb-2">Confidence</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-purple-400">
                    {platform.confidence}%
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {comparisons.confidenceVsAvg > 0 ? "+" : ""}
                  {comparisons.confidenceVsAvg}% vs average
                </div>
              </Card>

              {/* Citations */}
              <Card className="card-tertiary p-4">
                <div className="text-sm text-gray-400 mb-2">Citations</div>
                <div className="text-3xl font-bold text-green-400">
                  {platform.citations}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Total mentions tracked
                </div>
              </Card>
            </div>
          </div>

          {/* Trend & Last Updated */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="card-tertiary p-4">
              <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trend
              </div>
              <div className="flex items-center gap-2">
                {platform.trend === "up" ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : platform.trend === "down" ? (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                ) : (
                  <div className="w-5 h-5 text-gray-400 flex items-center justify-center">
                    —
                  </div>
                )}
                <span
                  className={cn(
                    "font-semibold",
                    platform.trend === "up" && "text-green-400",
                    platform.trend === "down" && "text-red-400",
                    platform.trend === "stable" && "text-gray-400"
                  )}
                >
                  {platform.trend === "up"
                    ? `+${platform.trendPercent}%`
                    : platform.trend === "down"
                      ? `-${platform.trendPercent}%`
                      : "Stable"}
                </span>
              </div>
            </Card>

            <Card className="card-tertiary p-4">
              <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last Updated
              </div>
              <div className="text-sm text-white font-medium">
                {platform.lastUpdated.toLocaleDateString()}{" "}
                {platform.lastUpdated.toLocaleTimeString()}
              </div>
            </Card>
          </div>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <Card className="card-secondary p-4 border-green-500/30">
              <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-green-400" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-gray-300">
                    • {strength}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Opportunities */}
          {analysis.opportunities.length > 0 && (
            <Card className="card-secondary p-4 border-yellow-500/30">
              <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Opportunities
              </h4>
              <ul className="space-y-1">
                {analysis.opportunities.map((opportunity, idx) => (
                  <li key={idx} className="text-sm text-gray-300">
                    • {opportunity}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700">
              Generate Improvement Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
