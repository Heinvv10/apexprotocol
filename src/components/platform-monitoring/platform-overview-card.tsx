"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformMetric {
  visibility: number;
  position: number | null;
  confidence: number;
  trend?: "up" | "down" | "stable";
}

interface PlatformOverviewCardProps {
  name: string;
  displayName: string;
  tier: "tier_1" | "tier_2";
  metrics: PlatformMetric;
  icon?: React.ReactNode;
  lastUpdated?: Date;
  enabled?: boolean;
  onClick?: () => void;
}

const TIER_COLORS = {
  tier_1: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  tier_2: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const VISIBILITY_COLOR = (score: number) => {
  if (score >= 85) return "text-green-400";
  if (score >= 70) return "text-yellow-400";
  return "text-red-400";
};

export function PlatformOverviewCard({
  name,
  displayName,
  tier,
  metrics,
  icon,
  lastUpdated,
  enabled = true,
  onClick,
}: PlatformOverviewCardProps) {
  const trendIcon = metrics.trend === "up" ? <TrendingUp className="w-4 h-4" /> :
                    metrics.trend === "down" ? <TrendingDown className="w-4 h-4" /> : null;

  return (
    <Card
      className={cn(
        "card-primary p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-cyan-500/20",
        !enabled && "opacity-50"
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="text-xl">{icon}</div>}
            <div>
              <h4 className="font-semibold text-white">{displayName}</h4>
              <p className="text-xs text-gray-400">{name}</p>
            </div>
          </div>
          <Badge className={cn("border", TIER_COLORS[tier])}>
            {tier === "tier_1" ? "T1" : "T2"}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Visibility Score */}
          <div className="space-y-1">
            <p className="text-xs text-gray-400">Visibility</p>
            <div className="flex items-center gap-1">
              <span className={cn("text-lg font-bold", VISIBILITY_COLOR(metrics.visibility))}>
                {metrics.visibility}%
              </span>
            </div>
          </div>

          {/* Position */}
          <div className="space-y-1">
            <p className="text-xs text-gray-400">Position</p>
            <p className="text-lg font-bold text-cyan-400">
              {metrics.position ? `#${metrics.position}` : "—"}
            </p>
          </div>

          {/* Confidence */}
          <div className="space-y-1">
            <p className="text-xs text-gray-400">Confidence</p>
            <p className="text-lg font-bold text-purple-400">{metrics.confidence}%</p>
          </div>
        </div>

        {/* Trend Indicator */}
        {metrics.trend && (
          <div className="flex items-center gap-1 pt-2 border-t border-gray-700">
            <span className="text-xs text-gray-400">Trend:</span>
            <div className={cn("flex items-center gap-1", metrics.trend === "up" ? "text-green-400" : "text-red-400")}>
              {trendIcon}
              <span className="text-xs capitalize">{metrics.trend}</span>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-xs text-gray-500">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}

        {!enabled && (
          <div className="flex items-center gap-1 text-xs text-yellow-400 pt-2 border-t border-yellow-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>Not enabled for this brand</span>
          </div>
        )}
      </div>
    </Card>
  );
}
