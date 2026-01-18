"use client";

import * as React from "react";
import { Zap, Clock, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Metric {
  label: string;
  value: string;
  unit: string;
  status: "good" | "warning" | "poor";
  benchmark?: string;
  icon: React.ReactNode;
}

interface PerformanceMetricsCardProps {
  title: string;
  metrics: Metric[];
  description?: string;
}

export function PerformanceMetricsCard({
  title,
  metrics,
  description,
}: PerformanceMetricsCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-success bg-success/10 border-success/20";
      case "warning":
        return "text-warning bg-warning/10 border-warning/20";
      case "poor":
        return "text-error bg-error/10 border-error/20";
      default:
        return "text-muted-foreground bg-muted/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle2 className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "poor":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="card-secondary p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`card-tertiary p-4 border rounded-lg transition-all ${getStatusColor(
              metric.status
            )}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">{metric.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{metric.label}</div>
                  {metric.benchmark && (
                    <div className="text-xs opacity-75 mt-0.5">
                      Benchmark: {metric.benchmark}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold">
                  {metric.value}
                  <span className="text-xs ml-1 opacity-75">{metric.unit}</span>
                </div>
                <div className="mt-1 flex items-center justify-end gap-1">
                  {getStatusIcon(metric.status)}
                  <span className="text-xs capitalize">{metric.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
