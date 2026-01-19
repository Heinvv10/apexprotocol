"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VisibilityGaugeProps {
  visibility: number;
  label: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CONFIG = {
  sm: { outer: 120, inner: 100, textSize: "text-2xl" },
  md: { outer: 160, inner: 140, textSize: "text-4xl" },
  lg: { outer: 200, inner: 180, textSize: "text-5xl" },
};

const getColor = (visibility: number) => {
  if (visibility >= 85) return "#22c55e";
  if (visibility >= 70) return "#f59e0b";
  if (visibility >= 50) return "#f97316";
  return "#ef4444";
};

const getColorClass = (visibility: number) => {
  if (visibility >= 85) return "text-green-400";
  if (visibility >= 70) return "text-yellow-400";
  if (visibility >= 50) return "text-orange-400";
  return "text-red-400";
};

export function VisibilityGauge({
  visibility,
  label,
  subtitle,
  size = "md",
}: VisibilityGaugeProps) {
  const config = SIZE_CONFIG[size];
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (visibility / 100) * circumference;
  const color = getColor(visibility);

  return (
    <Card className="card-primary p-6 flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center" style={{ width: config.outer, height: config.outer }}>
        {/* Background Circle */}
        <svg
          className="absolute"
          width={config.outer}
          height={config.outer}
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#374151"
            strokeWidth="8"
          />
        </svg>

        {/* Progress Circle */}
        <svg
          className="absolute rotate-[-90deg]"
          width={config.outer}
          height={config.outer}
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>

        {/* Center Content */}
        <div className="flex flex-col items-center justify-center gap-1 relative z-10">
          <span className={cn(config.textSize, "font-bold", getColorClass(visibility))}>
            {visibility}%
          </span>
          <span className="text-xs text-gray-400 text-center max-w-[80px]">{label}</span>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className="text-sm font-medium text-white">{label}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        <div className="flex items-center justify-center gap-2 mt-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className={cn("text-xs font-semibold", getColorClass(visibility))}>
            {visibility >= 85 ? "Excellent" : visibility >= 70 ? "Good" : visibility >= 50 ? "Fair" : "Poor"}
          </span>
        </div>
      </div>
    </Card>
  );
}
