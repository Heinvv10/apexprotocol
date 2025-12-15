"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MetricBadge {
  id: string;
  label: string;
  active?: boolean;
}

interface MetricBadgesProps {
  badges: MetricBadge[];
  onBadgeClick?: (badgeId: string) => void;
  className?: string;
}

export function MetricBadges({
  badges,
  onBadgeClick,
  className,
}: MetricBadgesProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {badges.map((badge) => (
        <button
          key={badge.id}
          onClick={() => onBadgeClick?.(badge.id)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            "border",
            badge.active
              ? "bg-primary/20 border-primary/30 text-primary"
              : "bg-transparent border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
          )}
        >
          <span
            className={cn(
              "inline-block w-1.5 h-1.5 rounded-full mr-1.5",
              badge.active ? "bg-primary" : "bg-muted-foreground"
            )}
          />
          {badge.label}
        </button>
      ))}
    </div>
  );
}
