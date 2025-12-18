"use client";

import * as React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCitations } from "@/hooks/useMonitor";
import { useSelectedBrand } from "@/stores";

// Export interface for API integration
export interface CitationDataPoint {
  date: string;
  citations: number;
}

interface CitationVelocityChartProps {
  data?: CitationDataPoint[];
  brandId?: string;
  range?: "7d" | "14d" | "30d" | "90d";
  className?: string;
}

export function CitationVelocityChart({
  data,
  brandId,
  range = "30d",
  className,
}: CitationVelocityChartProps) {
  // Get brand from store if not provided via props
  const selectedBrand = useSelectedBrand();
  const effectiveBrandId = brandId || selectedBrand?.id;

  // Fetch citation data when no data prop is provided
  const { data: citationData, isLoading } = useCitations(
    effectiveBrandId,
    range,
    20
  );

  // Use provided data or transform API response
  const chartData = React.useMemo(() => {
    if (data) return data;
    if (!citationData?.trendData) return [];
    return citationData.trendData;
  }, [data, citationData?.trendData]);

  const hasData = chartData.length > 0;

  // Loading state
  if (isLoading && !data) {
    return (
      <div className={cn("card-secondary", className)}>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Citation Velocity
        </h3>
        <div className="h-[160px] w-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-6 w-6 mx-auto text-primary animate-spin mb-2" />
            <p className="text-xs text-muted-foreground">Loading citations...</p>
          </div>
        </div>
      </div>
    );
  }

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
