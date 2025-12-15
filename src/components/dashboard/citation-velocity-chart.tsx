"use client";

import * as React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

// Export interface for API integration
export interface CitationDataPoint {
  date: string;
  citations: number;
}

interface CitationVelocityChartProps {
  data?: CitationDataPoint[];
  className?: string;
}

export function CitationVelocityChart({
  data,
  className,
}: CitationVelocityChartProps) {
  // TODO: Fetch citation velocity data from API endpoint
  // const { data: chartData } = useQuery(['citationVelocity'], fetchCitationVelocity);
  const chartData = data || []; // Empty array - no mock data
  const hasData = chartData.length > 0;

  // Empty state
  if (!hasData) {
    return (
      <div className={cn("card-secondary", className)}>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Citation Velocity
        </h3>
        <div className="h-[160px] w-full flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">No citation data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-secondary", className)}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Citation Velocity
      </h3>

      <div className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="citationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--bg-card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--primary))" }}
            />
            <Area
              type="monotone"
              dataKey="citations"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#citationGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
