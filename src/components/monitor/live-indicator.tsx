"use client";

/**
 * Live Indicator Component
 * Shows real-time connection status with pulsing animation
 * Following APEX Design System v4.1
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  isConnected: boolean;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Animated live status indicator
 * Shows LIVE badge with pulsing dot when connected
 */
export function LiveIndicator({
  isConnected,
  className,
  showLabel = true,
  size = "md",
}: LiveIndicatorProps) {
  const sizeClasses = {
    sm: {
      container: "px-2 py-0.5 gap-1.5",
      dot: "w-1.5 h-1.5",
      text: "text-[10px]",
      ring: "w-3 h-3",
    },
    md: {
      container: "px-2.5 py-1 gap-2",
      dot: "w-2 h-2",
      text: "text-xs",
      ring: "w-4 h-4",
    },
    lg: {
      container: "px-3 py-1.5 gap-2",
      dot: "w-2.5 h-2.5",
      text: "text-sm",
      ring: "w-5 h-5",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full transition-all duration-300",
        sizes.container,
        isConnected
          ? "bg-[#00E5CC]/10 border border-[#00E5CC]/30"
          : "bg-slate-500/10 border border-slate-500/30",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={isConnected ? "Live connection active" : "Connection inactive"}
    >
      {/* Pulsing dot container */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring (only when connected) - apex-cyan #00E5CC */}
        {isConnected && (
          <span
            className={cn(
              "absolute rounded-full bg-[#00E5CC]/30 animate-ping",
              sizes.ring
            )}
            style={{ animationDuration: "1.5s" }}
          />
        )}

        {/* Inner dot - apex-cyan #00E5CC when connected */}
        <span
          className={cn(
            "relative rounded-full transition-colors duration-300",
            sizes.dot,
            isConnected ? "bg-[#00E5CC]" : "bg-slate-500"
          )}
        />
      </div>

      {/* Label - apex-cyan #00E5CC when connected */}
      {showLabel && (
        <span
          className={cn(
            "font-semibold uppercase tracking-wider transition-colors duration-300",
            sizes.text,
            isConnected ? "text-[#00E5CC]" : "text-slate-400"
          )}
        >
          {isConnected ? "LIVE" : "OFFLINE"}
        </span>
      )}
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function LiveDot({
  isConnected,
  className,
}: Pick<LiveIndicatorProps, "isConnected" | "className">) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center w-3 h-3",
        className
      )}
      role="status"
      aria-label={isConnected ? "Connected" : "Disconnected"}
    >
      {/* Apex-cyan #00E5CC for connected state */}
      {isConnected && (
        <span
          className="absolute w-full h-full rounded-full bg-[#00E5CC]/40 animate-ping"
          style={{ animationDuration: "1.5s" }}
        />
      )}
      <span
        className={cn(
          "relative w-2 h-2 rounded-full transition-colors duration-300",
          isConnected ? "bg-[#00E5CC]" : "bg-slate-500"
        )}
      />
    </span>
  );
}

export default LiveIndicator;
