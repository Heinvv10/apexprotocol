"use client";

import * as React from "react";
import { Gauge, Zap, Mouse } from "lucide-react";

interface CoreWebVital {
  metric: "lcp" | "fid" | "cls";
  label: string;
  value: number;
  unit: string;
  good: number;
  needsImprovement: number;
  rating: "good" | "needsImprovement" | "poor";
  icon: React.ReactNode;
  description: string;
}

interface CoreWebVitalsCardProps {
  vitals: CoreWebVital[];
}

export function CoreWebVitalsCard({ vitals }: CoreWebVitalsCardProps) {
  const getVitalColor = (rating: string) => {
    switch (rating) {
      case "good":
        return "bg-success/10 border-success/20 text-success";
      case "needsImprovement":
        return "bg-warning/10 border-warning/20 text-warning";
      case "poor":
        return "bg-error/10 border-error/20 text-error";
      default:
        return "bg-muted/10";
    }
  };

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case "good":
        return "Good";
      case "needsImprovement":
        return "Needs Improvement";
      case "poor":
        return "Poor";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="card-secondary p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-1">Core Web Vitals</h3>
        <p className="text-sm text-muted-foreground">
          Google&apos;s metrics measuring real-world user experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vitals.map((vital) => (
          <div
            key={vital.metric}
            className={`card-tertiary p-4 border rounded-lg space-y-3 ${getVitalColor(
              vital.rating
            )}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <div>{vital.icon}</div>
                <div>
                  <div className="font-semibold text-sm">{vital.label}</div>
                  <div className="text-xs opacity-75 max-w-xs">
                    {vital.description}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">{vital.value}</span>
                <span className="text-xs opacity-75">{vital.unit}</span>
              </div>

              {/* Status bar */}
              <div className="space-y-1">
                <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      vital.rating === "good"
                        ? "bg-success"
                        : vital.rating === "needsImprovement"
                        ? "bg-warning"
                        : "bg-error"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (vital.value /
                          (vital.needsImprovement + vital.needsImprovement)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Thresholds */}
              <div className="text-xs space-y-1 mt-2 pt-2 border-t border-border/50">
                <div className="flex justify-between">
                  <span>Good:</span>
                  <span className="text-success font-medium">
                    &lt; {vital.good}
                    {vital.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Needs Improvement:</span>
                  <span className="text-warning font-medium">
                    {vital.good}-{vital.needsImprovement}
                    {vital.unit}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded capitalize ${
                    vital.rating === "good"
                      ? "bg-success/20 text-success"
                      : vital.rating === "needsImprovement"
                      ? "bg-warning/20 text-warning"
                      : "bg-error/20 text-error"
                  }`}
                >
                  {getRatingLabel(vital.rating)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded">
        <p>
          💡 <strong>Tip:</strong> All three metrics must be in the &quot;Good&quot; range
          to achieve a passing Core Web Vitals assessment.
        </p>
      </div>
    </div>
  );
}
