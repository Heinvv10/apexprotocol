"use client";

import * as React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Audit } from "@/hooks/useAudit";

interface AuditTrendChartProps {
  audits: Audit[];
}

export function AuditTrendChart({ audits }: AuditTrendChartProps) {
  // Prepare data for chart - only completed audits
  const chartData = audits
    .filter((a) => a.status === "completed" && a.completedAt)
    .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())
    .slice(-10) // Last 10 audits
    .map((audit) => ({
      date: new Date(audit.completedAt!).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: audit.overallScore || 0,
      criticalIssues: audit.issues?.filter((i) => i.severity === "critical").length || 0,
      highIssues: audit.issues?.filter((i) => i.severity === "high").length || 0,
      totalIssues: audit.issues?.length || 0,
    }));

  if (chartData.length === 0) {
    return (
      <div className="card-secondary p-6 text-center">
        <p className="text-muted-foreground">No completed audits to display</p>
      </div>
    );
  }

  return (
    <div className="card-secondary p-6">
      <h3 className="font-semibold text-lg mb-4">Audit Trend (Last 10 Runs)</h3>

      {/* Score Trend */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">On-Page Audit Score Trend</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              cursor={{ stroke: "hsl(var(--primary))" }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
              name="On-Page Audit Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Issue Count Trend */}
      <div>
        <h4 className="text-sm font-medium mb-3">Issue Count Trend</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              cursor={{ stroke: "hsl(var(--primary))" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="criticalIssues"
              stroke="hsl(var(--error))"
              strokeWidth={2}
              name="Critical"
            />
            <Line
              type="monotone"
              dataKey="highIssues"
              stroke="hsl(var(--warning))"
              strokeWidth={2}
              name="High"
            />
            <Line
              type="monotone"
              dataKey="totalIssues"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Total"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      {chartData.length > 1 && (
        <div className="mt-6 pt-6 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Latest score:</span>
            <span className="font-semibold">{chartData[chartData.length - 1].score}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Score change:</span>
            <span className={`font-semibold ${
              chartData[chartData.length - 1].score > chartData[0].score
                ? "text-success"
                : "text-error"
            }`}>
              {(chartData[chartData.length - 1].score - chartData[0].score > 0 ? "+" : "")}{chartData[chartData.length - 1].score - chartData[0].score}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
