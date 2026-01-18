"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LoadPhase {
  name: string;
  duration: number;
  color: string;
}

interface PerformanceWaterfallProps {
  phases: LoadPhase[];
  totalLoadTime: number;
}

export function PerformanceWaterfall({
  phases,
  totalLoadTime,
}: PerformanceWaterfallProps) {
  // Transform phases into chart data
  const chartData = phases.map((phase, idx) => ({
    name: phase.name,
    duration: phase.duration,
    fill: phase.color,
    percentage: ((phase.duration / totalLoadTime) * 100).toFixed(1),
  }));

  const CustomTooltip = (props: any) => {
    if (!props.active) return null;
    const data = props.payload?.[0];
    if (!data) return null;

    return (
      <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
        <p className="text-sm font-medium text-foreground">{data.payload.name}</p>
        <p className="text-xs text-primary">
          {data.payload.duration.toFixed(0)}ms ({data.payload.percentage}%)
        </p>
      </div>
    );
  };

  return (
    <div className="card-secondary p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-1">Load Phase Breakdown</h3>
        <p className="text-sm text-muted-foreground">
          Time spent in each phase of page loading (Total: {totalLoadTime.toFixed(0)}ms)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            stroke="hsl(var(--muted-foreground))"
            label={{ value: "Time (ms)", position: "insideBottomRight", offset: -5 }}
          />
          <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={180} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="duration"
            radius={[0, 8, 8, 0]}
            isAnimationActive={true}
          >
            {chartData.map((entry, idx) => (
              <Bar key={idx} dataKey="duration" fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Phase details */}
      <div className="space-y-2">
        {phases.map((phase, idx) => (
          <div key={idx} className="card-tertiary p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: phase.color }}
              />
              <span className="text-sm font-medium">{phase.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-foreground">
                {phase.duration.toFixed(0)}ms
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                ({((phase.duration / totalLoadTime) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="card-tertiary p-3 border-primary/30 bg-primary/5 flex items-center justify-between font-semibold">
        <span>Total Load Time</span>
        <span className="text-primary">{totalLoadTime.toFixed(0)}ms</span>
      </div>
    </div>
  );
}
