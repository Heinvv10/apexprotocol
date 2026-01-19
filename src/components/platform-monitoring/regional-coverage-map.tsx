"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RegionCoverage {
  region: string;
  platforms: string[];
  coverage: number;
  tier: "tier_1" | "tier_2" | "both";
  icon: string;
}

interface RegionalCoverageMapProps {
  regions: RegionCoverage[];
  title: string;
}

const TIER_COLORS = {
  tier_1: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  tier_2: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  both: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

export function RegionalCoverageMap({
  regions,
  title,
}: RegionalCoverageMapProps) {
  return (
    <Card className="card-secondary p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {regions.map((region) => (
          <div
            key={region.region}
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:border-cyan-500/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{region.icon}</span>
                <div>
                  <h4 className="font-semibold text-white">{region.region}</h4>
                  <p className="text-xs text-gray-400">
                    {region.platforms.length} platform{region.platforms.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Badge className={TIER_COLORS[region.tier]}>
                {region.tier === "tier_1"
                  ? "T1"
                  : region.tier === "tier_2"
                    ? "T2"
                    : "T1+T2"}
              </Badge>
            </div>

            {/* Coverage Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Coverage</span>
                <span className="text-xs font-semibold text-cyan-400">{region.coverage}%</span>
              </div>
              <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full"
                  style={{ width: `${region.coverage}%` }}
                />
              </div>
            </div>

            {/* Platforms List */}
            <div className="flex flex-wrap gap-1">
              {region.platforms.map((platform) => (
                <Badge key={platform} variant="outline" className="text-xs bg-gray-800">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-cyan-400">17</p>
          <p className="text-xs text-gray-400">Total Platforms</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-400">5</p>
          <p className="text-xs text-gray-400">Tier 2 (Regional)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">97%</p>
          <p className="text-xs text-gray-400">Market Coverage</p>
        </div>
      </div>
    </Card>
  );
}
