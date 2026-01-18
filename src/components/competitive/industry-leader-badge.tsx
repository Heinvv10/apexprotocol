"use client";

import * as React from "react";
import { Trophy, Medal, Award, Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndustryLeaderBadgeProps {
  position: number;
  total: number;
  brandName: string;
  showDetails?: boolean;
  className?: string;
}

// Get badge config based on position
function getBadgeConfig(position: number, total: number) {
  const percentile = ((total - position) / (total - 1)) * 100;

  if (position === 1) {
    return {
      icon: Crown,
      label: "Industry Leader",
      gradient: "from-amber-400 via-amber-500 to-amber-600",
      glow: "shadow-amber-500/30",
      textColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
    };
  }
  if (position === 2) {
    return {
      icon: Trophy,
      label: "Top Performer",
      gradient: "from-slate-300 via-slate-400 to-slate-500",
      glow: "shadow-slate-400/30",
      textColor: "text-slate-300",
      bgColor: "bg-slate-400/10",
      borderColor: "border-slate-400/30",
    };
  }
  if (position === 3) {
    return {
      icon: Medal,
      label: "Rising Star",
      gradient: "from-amber-600 via-amber-700 to-amber-800",
      glow: "shadow-amber-700/30",
      textColor: "text-amber-600",
      bgColor: "bg-amber-600/10",
      borderColor: "border-amber-600/30",
    };
  }
  if (percentile >= 75) {
    return {
      icon: Award,
      label: "Top 25%",
      gradient: "from-primary via-cyan-500 to-teal-500",
      glow: "shadow-primary/30",
      textColor: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    };
  }
  if (percentile >= 50) {
    return {
      icon: Star,
      label: "Top 50%",
      gradient: "from-purple-400 via-purple-500 to-purple-600",
      glow: "shadow-purple-500/30",
      textColor: "text-purple-400",
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/30",
    };
  }
  return {
    icon: Star,
    label: "Challenger",
    gradient: "from-muted via-muted to-muted",
    glow: "shadow-none",
    textColor: "text-muted-foreground",
    bgColor: "bg-muted/10",
    borderColor: "border-muted/30",
  };
}

export function IndustryLeaderBadge({
  position,
  total,
  brandName,
  showDetails = true,
  className,
}: IndustryLeaderBadgeProps) {
  const config = getBadgeConfig(position, total);
  const Icon = config.icon;
  const percentile = Math.round(((total - position) / (total - 1)) * 100) || 100;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Position badge */}
      <div
        className={cn(
          "relative w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
          config.gradient,
          config.glow
        )}
      >
        <span className="text-2xl font-bold text-white">#{position}</span>
        <Icon
          className="absolute -top-2 -right-2 w-6 h-6 text-white drop-shadow-lg"
          style={{
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }}
        />
      </div>

      {/* Details */}
      {showDetails && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-lg font-semibold", config.textColor)}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {brandName} ranks <span className={config.textColor}>#{position}</span> of{" "}
            {total} competitors
          </p>
          <div className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            config.bgColor,
            config.borderColor,
            "border"
          )}>
            <span className={config.textColor}>{percentile}th percentile</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for lists
export function IndustryLeaderBadgeCompact({
  position,
  total,
  className,
}: Omit<IndustryLeaderBadgeProps, "brandName" | "showDetails">) {
  const config = getBadgeConfig(position, total);
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div
        className={cn(
          "w-6 h-6 rounded-md bg-gradient-to-br flex items-center justify-center",
          config.gradient
        )}
      >
        <span className="text-xs font-bold text-white">#{position}</span>
      </div>
      <div className="flex items-center gap-1">
        <Icon className={cn("w-3 h-3", config.textColor)} />
        <span className={cn("text-xs font-medium", config.textColor)}>
          {config.label}
        </span>
      </div>
    </div>
  );
}
