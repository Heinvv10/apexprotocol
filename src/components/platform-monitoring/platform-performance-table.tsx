"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformPerformance {
  id: string;
  platform: string;
  displayName: string;
  tier: "tier_1" | "tier_2" | "tier_3" | "tier_4";
  visibility: number;
  position: number | null;
  confidence: number;
  citations: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  lastUpdated: Date;
  status: "active" | "inactive" | "error";
}

interface PlatformPerformanceTableProps {
  platforms: PlatformPerformance[];
  title: string;
}

const TIER_COLORS: Record<string, string> = {
  tier_1: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  tier_2: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  tier_3: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  tier_4: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
};

const STATUS_COLORS = {
  active: "bg-green-500/10 text-green-400",
  inactive: "bg-gray-500/10 text-gray-400",
  error: "bg-red-500/10 text-red-400",
};

const getVisibilityColor = (visibility: number) => {
  if (visibility >= 85) return "text-green-400";
  if (visibility >= 70) return "text-yellow-400";
  return "text-red-400";
};

export function PlatformPerformanceTable({
  platforms,
  title,
}: PlatformPerformanceTableProps) {
  return (
    <Card className="card-secondary p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Platform</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Visibility</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Position</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Confidence</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Citations</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Trend</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {platforms.map((platform, index) => (
              <tr
                key={platform.id}
                className={cn(
                  "border-b border-gray-800 hover:bg-gray-900/50 transition-colors",
                  index === platforms.length - 1 && "border-b-0"
                )}
              >
                {/* Platform Name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium text-white">{platform.displayName}</p>
                      <p className="text-xs text-gray-500">{platform.platform}</p>
                    </div>
                  </div>
                  <Badge className={cn("mt-1 border", TIER_COLORS[platform.tier])}>
                    {platform.tier === "tier_1" ? "Tier 1" : "Tier 2"}
                  </Badge>
                </td>

                {/* Visibility */}
                <td className="px-4 py-3">
                  <span className={cn("font-semibold", getVisibilityColor(platform.visibility))}>
                    {platform.visibility}%
                  </span>
                </td>

                {/* Position */}
                <td className="px-4 py-3">
                  <span className="text-cyan-400 font-semibold">
                    {platform.position ? `#${platform.position}` : "—"}
                  </span>
                </td>

                {/* Confidence */}
                <td className="px-4 py-3">
                  <span className="text-purple-400 font-semibold">{platform.confidence}%</span>
                </td>

                {/* Citations */}
                <td className="px-4 py-3 text-gray-300">{platform.citations}</td>

                {/* Trend */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {platform.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span
                      className={
                        platform.trend === "up" ? "text-green-400" : "text-red-400"
                      }
                    >
                      {platform.trend === "up" ? "+" : ""}{platform.trendPercent}%
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <Badge className={cn("border", STATUS_COLORS[platform.status])}>
                    {platform.status === "active"
                      ? "Active"
                      : platform.status === "error"
                        ? "Error"
                        : "Inactive"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-800 flex flex-wrap gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span>Strong Visibility (85%+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <span>Moderate Visibility (70-84%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span>Low Visibility (&lt;70%)</span>
        </div>
      </div>
    </Card>
  );
}
