"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";

interface SnapshotData {
  date: string;
  geoScore: number;
  seoScore: number;
  aeoScore: number;
  smoScore: number;
  ppoScore: number;
  unifiedScore: number;
  milestonesCompleted: number;
}

interface ProgressTimelineProps {
  snapshots: SnapshotData[];
  targetScore?: number;
  className?: string;
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
    payload: SnapshotData;
  }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-card-secondary border border-border/30 rounded-lg p-3 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {new Date(label || "").toLocaleDateString()}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-primary font-semibold">
            Overall: {data.unifiedScore}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">GEO:</span>{" "}
            <span className="text-foreground">{data.geoScore}</span>
          </div>
          <div>
            <span className="text-muted-foreground">SEO:</span>{" "}
            <span className="text-foreground">{data.seoScore}</span>
          </div>
          <div>
            <span className="text-muted-foreground">AEO:</span>{" "}
            <span className="text-foreground">{data.aeoScore}</span>
          </div>
          <div>
            <span className="text-muted-foreground">SMO:</span>{" "}
            <span className="text-foreground">{data.smoScore}</span>
          </div>
          <div>
            <span className="text-muted-foreground">PPO:</span>{" "}
            <span className="text-foreground">{data.ppoScore}</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground pt-1 border-t border-border/30">
          Milestones completed: {data.milestonesCompleted}
        </div>
      </div>
    </div>
  );
}

export function ProgressTimeline({
  snapshots,
  targetScore,
  className,
}: ProgressTimelineProps) {
  // Format data for chart
  const chartData = React.useMemo(() => {
    return snapshots.map((snapshot) => ({
      ...snapshot,
      date: new Date(snapshot.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullDate: snapshot.date,
    }));
  }, [snapshots]);

  // Calculate progress stats
  const stats = React.useMemo(() => {
    if (snapshots.length === 0) return null;

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const change = last.unifiedScore - first.unifiedScore;
    const percentChange = first.unifiedScore > 0
      ? Math.round((change / first.unifiedScore) * 100)
      : 0;

    return {
      startScore: first.unifiedScore,
      currentScore: last.unifiedScore,
      change,
      percentChange,
      totalMilestones: last.milestonesCompleted,
    };
  }, [snapshots]);

  if (snapshots.length === 0) {
    return (
      <div className={cn("card-secondary p-6", className)}>
        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
          <p className="text-sm">No progress data yet</p>
          <p className="text-xs mt-1">Complete milestones to track progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-secondary", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Progress Timeline
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Score improvement over time
            </p>
          </div>

          {stats && (
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {stats.currentScore}
                </div>
                <div className="text-xs text-muted-foreground">Current Score</div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    "text-xl font-semibold",
                    stats.change >= 0 ? "text-success" : "text-error"
                  )}
                >
                  {stats.change >= 0 ? "+" : ""}{stats.change}
                </div>
                <div className="text-xs text-muted-foreground">
                  ({stats.percentChange >= 0 ? "+" : ""}{stats.percentChange}%)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6B7280", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#6B7280", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Target line */}
              {targetScore && (
                <ReferenceLine
                  y={targetScore}
                  stroke="#22C55E"
                  strokeDasharray="5 5"
                  label={{
                    value: `Target: ${targetScore}`,
                    fill: "#22C55E",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
              )}

              {/* Unified score line */}
              <Line
                type="monotone"
                dataKey="unifiedScore"
                stroke="#00E5CC"
                strokeWidth={2}
                dot={{ fill: "#00E5CC", strokeWidth: 0, r: 4 }}
                activeDot={{ fill: "#00E5CC", strokeWidth: 0, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend / Stats footer */}
      <div className="p-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-primary rounded" />
            <span>Unified Score</span>
          </div>
          {targetScore && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-success rounded" style={{ borderStyle: "dashed" }} />
              <span>Target</span>
            </div>
          )}
        </div>
        {stats && (
          <span>
            {stats.totalMilestones} milestones completed
          </span>
        )}
      </div>
    </div>
  );
}
