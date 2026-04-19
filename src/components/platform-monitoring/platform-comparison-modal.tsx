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
import { TrendingUp, TrendingDown, Target } from "lucide-react";
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

interface PlatformComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform1: PlatformMetrics | null;
  platform2: PlatformMetrics | null;
  onSelectPlatforms?: (p1: PlatformMetrics, p2: PlatformMetrics) => void;
  allPlatforms: PlatformMetrics[];
}

const TIER_COLORS = {
  tier_1: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  tier_2: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  tier_3: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  tier_4: "bg-pink-500/10 text-pink-400 border-pink-500/30",
};

const MetricRow = ({
  label,
  p1Value,
  p2Value,
  formatter = (v: any) => String(v),
  unit = "",
}: {
  label: string;
  p1Value: any;
  p2Value: any;
  formatter?: (v: any) => string;
  unit?: string;
}) => {
  const p1Val = parseFloat(p1Value) || 0;
  const p2Val = parseFloat(p2Value) || 0;
  const p1Wins = p1Val > p2Val;
  const p2Wins = p2Val > p1Val;

  return (
    <div className="border-b border-gray-700/50 py-3 last:border-b-0">
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      <div className="grid grid-cols-3 gap-4 items-center">
        <div className={cn("text-center", p1Wins && "bg-cyan-500/10 rounded px-2 py-1")}>
          <div className="font-semibold text-white">
            {formatter(p1Value)}
            {unit}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">vs</div>
        </div>
        <div className={cn("text-center", p2Wins && "bg-cyan-500/10 rounded px-2 py-1")}>
          <div className="font-semibold text-white">
            {formatter(p2Value)}
            {unit}
          </div>
        </div>
      </div>
    </div>
  );
};

export function PlatformComparisonModal({
  open,
  onOpenChange,
  platform1,
  platform2,
  allPlatforms,
}: PlatformComparisonModalProps) {
  const analysis = useMemo(() => {
    if (!platform1 || !platform2) return null;
    let p1Score = 0;
    let p2Score = 0;

    if (platform1.visibility > platform2.visibility) p1Score += 3;
    else if (platform2.visibility > platform1.visibility) p2Score += 3;

    if (
      platform1.position &&
      platform2.position &&
      platform1.position < platform2.position
    )
      p1Score += 3;
    else if (
      platform2.position &&
      platform1.position &&
      platform2.position < platform1.position
    )
      p2Score += 3;

    if (platform1.confidence > platform2.confidence) p1Score += 2;
    else if (platform2.confidence > platform1.confidence) p2Score += 2;

    if (platform1.citations > platform2.citations) p1Score += 2;
    else if (platform2.citations > platform1.citations) p2Score += 2;

    return {
      p1Score,
      p2Score,
      winner: p1Score > p2Score ? "platform1" : p2Score > p1Score ? "platform2" : "tie",
    };
  }, [platform1, platform2]);

  // Early return is safe here — happens after every hook has run.
  if (!analysis || !platform1 || !platform2) return null;

  const winner =
    analysis.winner === "platform1"
      ? platform1
      : analysis.winner === "platform2"
        ? platform2
        : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white text-center">
            Platform Comparison
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Head-to-head analysis of platform performance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Platform Headers */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="card-secondary p-4 text-center border-cyan-500/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">{platform1.icon}</span>
              </div>
              <div className="font-semibold text-white">{platform1.displayName}</div>
              <Badge className={cn("mt-2 border", TIER_COLORS[platform1.tier])}>
                {platform1.tier}
              </Badge>
            </Card>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-1">vs</div>
                {winner && (
                  <div className="text-xs text-yellow-400 font-semibold">
                    ⭐ {winner.displayName} leads
                  </div>
                )}
              </div>
            </div>

            <Card className="card-secondary p-4 text-center border-purple-500/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">{platform2.icon}</span>
              </div>
              <div className="font-semibold text-white">{platform2.displayName}</div>
              <Badge className={cn("mt-2 border", TIER_COLORS[platform2.tier])}>
                {platform2.tier}
              </Badge>
            </Card>
          </div>

          {/* Detailed Comparison */}
          <Card className="card-secondary p-6">
            <h3 className="font-semibold text-white mb-4">Detailed Metrics</h3>

            <div className="space-y-0">
              <MetricRow
                label="Visibility Score"
                p1Value={platform1.visibility}
                p2Value={platform2.visibility}
                unit="%"
              />
              <MetricRow
                label="Position"
                p1Value={platform1.position || "N/A"}
                p2Value={platform2.position || "N/A"}
                formatter={(v) => (typeof v === "number" ? `#${v}` : v)}
              />
              <MetricRow
                label="Confidence Score"
                p1Value={platform1.confidence}
                p2Value={platform2.confidence}
                unit="%"
              />
              <MetricRow
                label="Citations"
                p1Value={platform1.citations}
                p2Value={platform2.citations}
                formatter={(v) => v.toLocaleString()}
              />
              <MetricRow
                label="Status"
                p1Value={platform1.status}
                p2Value={platform2.status}
              />
            </div>
          </Card>

          {/* Trend Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="card-secondary p-4">
              <div className="text-sm font-semibold text-white mb-3">
                {platform1.displayName} Trend
              </div>
              <div className="flex items-center gap-2">
                {platform1.trend === "up" ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : platform1.trend === "down" ? (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                ) : (
                  <div className="w-5 h-5 text-gray-400 flex items-center justify-center">
                    —
                  </div>
                )}
                <span
                  className={cn(
                    "font-semibold",
                    platform1.trend === "up" && "text-green-400",
                    platform1.trend === "down" && "text-red-400",
                    platform1.trend === "stable" && "text-gray-400"
                  )}
                >
                  {platform1.trend === "up"
                    ? `+${platform1.trendPercent}%`
                    : platform1.trend === "down"
                      ? `-${platform1.trendPercent}%`
                      : "Stable"}
                </span>
              </div>
            </Card>

            <Card className="card-secondary p-4">
              <div className="text-sm font-semibold text-white mb-3">
                {platform2.displayName} Trend
              </div>
              <div className="flex items-center gap-2">
                {platform2.trend === "up" ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : platform2.trend === "down" ? (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                ) : (
                  <div className="w-5 h-5 text-gray-400 flex items-center justify-center">
                    —
                  </div>
                )}
                <span
                  className={cn(
                    "font-semibold",
                    platform2.trend === "up" && "text-green-400",
                    platform2.trend === "down" && "text-red-400",
                    platform2.trend === "stable" && "text-gray-400"
                  )}
                >
                  {platform2.trend === "up"
                    ? `+${platform2.trendPercent}%`
                    : platform2.trend === "down"
                      ? `-${platform2.trendPercent}%`
                      : "Stable"}
                </span>
              </div>
            </Card>
          </div>

          {/* Summary */}
          {winner && (
            <Card className="card-secondary p-4 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-yellow-400 mb-1">
                    Overall Winner
                  </div>
                  <p className="text-sm text-gray-300">
                    {winner.displayName} performs better with higher visibility, better
                    positioning, and stronger confidence scores.
                  </p>
                </div>
              </div>
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
              View Detailed Analysis
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
