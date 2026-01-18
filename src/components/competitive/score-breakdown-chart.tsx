"use client";

import * as React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

interface ScoreData {
  geoScore: number;
  seoScore: number;
  aeoScore: number;
  smoScore: number;
  ppoScore: number;
}

interface ScoreBreakdownChartProps {
  brandName: string;
  brandScores: ScoreData;
  competitorName?: string;
  competitorScores?: ScoreData;
  className?: string;
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="bg-card-secondary border border-border/30 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScoreBreakdownChart({
  brandName,
  brandScores,
  competitorName,
  competitorScores,
  className,
}: ScoreBreakdownChartProps) {
  // Transform data for Recharts
  const chartData = React.useMemo(() => {
    const metrics = [
      { key: "geoScore", label: "GEO", description: "AI Visibility" },
      { key: "seoScore", label: "SEO", description: "Technical SEO" },
      { key: "aeoScore", label: "AEO", description: "Answer Engine" },
      { key: "smoScore", label: "SMO", description: "Social Media" },
      { key: "ppoScore", label: "PPO", description: "Personal Brand" },
    ];

    return metrics.map(({ key, label }) => {
      const item: Record<string, string | number> = {
        metric: label,
        [brandName]: brandScores[key as keyof ScoreData],
      };

      if (competitorName && competitorScores) {
        item[competitorName] = competitorScores[key as keyof ScoreData];
      }

      return item;
    });
  }, [brandName, brandScores, competitorName, competitorScores]);

  return (
    <div className={cn("h-[300px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#6B7280", fontSize: 10 }}
            tickCount={5}
            stroke="rgba(255,255,255,0.1)"
          />

          {/* Brand radar */}
          <Radar
            name={brandName}
            dataKey={brandName}
            stroke="#00E5CC"
            fill="#00E5CC"
            fillOpacity={0.3}
            strokeWidth={2}
          />

          {/* Competitor radar (if provided) */}
          {competitorName && competitorScores && (
            <Radar
              name={competitorName}
              dataKey={competitorName}
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          )}

          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
            iconType="line"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
