"use client";

import * as React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface RadarDataPoint {
  metric: string;
  score: number;
  industryAverage: number;
}

interface CompetitiveRadarProps {
  data: RadarDataPoint[];
  brandName?: string;
  className?: string;
}

export function CompetitiveRadar({
  data,
  brandName = "Your Brand",
  className,
}: CompetitiveRadarProps) {
  return (
    <div className={className}>
      <h3 className="text-base font-semibold text-foreground mb-4">
        Competitive Radar
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="70%"
            data={data}
          >
            <PolarGrid
              stroke="hsl(var(--border-subtle))"
              strokeOpacity={0.5}
            />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={false}
              tickCount={5}
            />
            <Radar
              name="Industry Average"
              dataKey="industryAverage"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.1}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <Radar
              name={brandName}
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="url(#radarGradient)"
              fillOpacity={0.6}
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="100%" stopColor="hsl(var(--accent-purple))" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
              }}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
