"use client";

import * as React from "react";
import { Gauge, TrendingUp, Zap, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PerformanceScore {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  status: "excellent" | "good" | "fair" | "poor" | "failing";
}

interface PerformanceOverviewProps {
  score: PerformanceScore;
  firstContentfulPaint: number; // ms
  largestContentfulPaint: number; // ms
  totalBlockingTime: number; // ms
  cumulativeLayoutShift: number; // 0-1
  speedIndex: number; // ms
}

export function PerformanceOverview({
  score,
  firstContentfulPaint,
  largestContentfulPaint,
  totalBlockingTime,
  cumulativeLayoutShift,
  speedIndex,
}: PerformanceOverviewProps) {
  const getScoreColor = (status: string) => {
    switch (status) {
      case "excellent":
        return { bg: "bg-success/10", text: "text-success", border: "border-success/20" };
      case "good":
        return { bg: "bg-success/10", text: "text-success", border: "border-success/20" };
      case "fair":
        return { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" };
      case "poor":
        return { bg: "bg-error/10", text: "text-error", border: "border-error/20" };
      case "failing":
        return { bg: "bg-error/10", text: "text-error", border: "border-error/20" };
      default:
        return { bg: "bg-muted/10", text: "text-muted-foreground", border: "border-muted/20" };
    }
  };

  const colors = getScoreColor(score.status);

  const metrics = [
    {
      label: "First Contentful Paint",
      value: firstContentfulPaint,
      unit: "ms",
      good: 1800,
      warning: 3000,
      icon: "🎨",
    },
    {
      label: "Largest Contentful Paint",
      value: largestContentfulPaint,
      unit: "ms",
      good: 2500,
      warning: 4000,
      icon: "📦",
    },
    {
      label: "Total Blocking Time",
      value: totalBlockingTime,
      unit: "ms",
      good: 100,
      warning: 300,
      icon: "⏱️",
    },
    {
      label: "Cumulative Layout Shift",
      value: (cumulativeLayoutShift * 100).toFixed(2),
      unit: "%",
      good: 10,
      warning: 25,
      icon: "🎯",
    },
    {
      label: "Speed Index",
      value: speedIndex,
      unit: "ms",
      good: 3400,
      warning: 5800,
      icon: "⚡",
    },
  ];

  const getMetricStatus = (value: number, good: number, warning: number) => {
    if (value <= good) return "good";
    if (value <= warning) return "warning";
    return "poor";
  };

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <div className={`card-primary p-6 border rounded-lg ${colors.border} space-y-6`}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Performance Score</h2>
            <p className="text-sm text-muted-foreground">
              Overall page performance analysis based on real-world metrics
            </p>
          </div>
          <Gauge className={`h-8 w-8 ${colors.text} flex-shrink-0`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score Circle */}
          <div className="flex justify-center items-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Circular background */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 160 160"
                style={{ transform: "rotate(-90deg)" }}
              >
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="hsl(var(--primary) / 0.1)"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={
                    score.status === "excellent" || score.status === "good"
                      ? "hsl(var(--success))"
                      : score.status === "fair"
                      ? "hsl(var(--warning))"
                      : "hsl(var(--error))"
                  }
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - score.score / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              {/* Center text */}
              <div className="text-center relative z-10">
                <div className={`text-5xl font-bold ${colors.text}`}>
                  {score.score}
                </div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
            </div>
          </div>

          {/* Grade and Status */}
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Overall Grade</div>
              <div className={`text-5xl font-bold ${colors.text}`}>{score.grade}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className={`text-lg font-semibold ${colors.text} capitalize`}>
                {score.status.replace("-", " ")}
              </div>
            </div>
            {score.status === "excellent" || score.status === "good" ? (
              <div className="text-sm text-muted-foreground">
                ✅ Performance is within acceptable ranges for most use cases
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                ⚠️ Performance improvements are recommended
              </div>
            )}
          </div>

          {/* Key Insight */}
          <div className="flex items-center justify-center">
            <div className={`p-4 rounded-lg space-y-3 ${colors.bg}`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`h-5 w-5 mt-1 flex-shrink-0 ${colors.text}`} />
                <div>
                  <div className="font-semibold text-sm mb-1">Key Insight</div>
                  <div className="text-sm text-muted-foreground">
                    {score.score >= 90
                      ? "Your site loads exceptionally fast. Focus on maintaining these performance standards."
                      : score.score >= 70
                      ? "Your site has good performance. Consider optimizations for better user experience."
                      : score.score >= 50
                      ? "Performance needs attention. Implement recommended optimizations to improve load times."
                      : "Critical performance issues detected. Prioritize optimization immediately."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, idx) => {
          const status = getMetricStatus(
            parseFloat(metric.value as any),
            metric.good,
            metric.warning
          );
          const statusColor =
            status === "good"
              ? "bg-success/10 border-success/20"
              : status === "warning"
              ? "bg-warning/10 border-warning/20"
              : "bg-error/10 border-error/20";
          const statusIcon =
            status === "good" ? "✅" : status === "warning" ? "⚠️" : "❌";

          return (
            <div
              key={idx}
              className={`card-secondary p-4 border rounded-lg space-y-2 ${statusColor}`}
            >
              <div className="flex items-start justify-between">
                <div className="text-2xl">{metric.icon}</div>
                <span className="text-sm">{statusIcon}</span>
              </div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">
                  {metric.value}
                  <span className="text-xs ml-1 opacity-75">{metric.unit}</span>
                </span>
              </div>
              <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                Good: &lt;{metric.good}
                {metric.unit}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
