"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// AI Platform Icons mapping
const platformIcons: Record<string, { icon: string; color: string; bg: string }> = {
  gemini: { icon: "G", color: "#4285F4", bg: "bg-[#4285F4]/20" },
  claude: { icon: "C", color: "#D97757", bg: "bg-[#D97757]/20" },
  chatgpt: { icon: "G", color: "#10A37F", bg: "bg-[#10A37F]/20" },
  perplexity: { icon: "P", color: "#20B8CD", bg: "bg-[#20B8CD]/20" },
  grok: { icon: "X", color: "#1DA1F2", bg: "bg-[#1DA1F2]/20" },
};

export interface HallucinationData {
  id: string;
  platform: string;
  title: string;
  description: string;
  predictedPickup?: string;
  progress?: number;
}

interface HallucinationCardProps {
  data: HallucinationData;
  className?: string;
}

export function HallucinationCard({ data, className }: HallucinationCardProps) {
  const platform = platformIcons[data.platform.toLowerCase()] || platformIcons.gemini;

  return (
    <div
      className={cn(
        "card-tertiary group hover:border-primary/30 transition-all duration-200",
        className
      )}
    >
      {/* Platform Badge */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
            platform.bg
          )}
          style={{ color: platform.color }}
        >
          {platform.icon}
        </div>
        <span className="text-sm text-muted-foreground capitalize">
          {data.platform}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-base font-semibold text-foreground mb-2">
        {data.title}
      </h4>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4">{data.description}</p>

      {/* Progress Bar (if applicable) */}
      {data.progress !== undefined && (
        <div className="space-y-2">
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent-purple rounded-full transition-all duration-500"
              style={{ width: `${data.progress}%` }}
            />
          </div>
          {data.predictedPickup && (
            <p className="text-xs text-muted-foreground">
              Predicted pickup: {data.predictedPickup}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
