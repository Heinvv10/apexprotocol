"use client";

import * as React from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  variant?: "primary" | "secondary" | "tertiary";
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "secondary",
  className,
}: StatCardProps) {
  const cardClass = {
    primary: "card-primary",
    secondary: "card-secondary",
    tertiary: "card-tertiary",
  }[variant];

  const TrendIcon = trend?.direction === "up"
    ? TrendingUp
    : trend?.direction === "down"
    ? TrendingDown
    : Minus;

  const trendColor = {
    up: "text-success",
    down: "text-error",
    neutral: "text-muted-foreground",
  }[trend?.direction || "neutral"];

  return (
    <div className={cn(cardClass, className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {Icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          {trend && (
            <span className={cn("flex items-center gap-1", trendColor)}>
              <TrendIcon className="h-4 w-4" />
              {Math.abs(trend.value)}%
            </span>
          )}
          {description && (
            <span className="text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
