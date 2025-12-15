"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// AI Platform Icons mapping
const platformIcons: Record<string, { icon: string; color: string; bg: string }> = {
  gemini: { icon: "G", color: "#4285F4", bg: "bg-[#4285F4]/20" },
  claude: { icon: "C", color: "#D97757", bg: "bg-[#D97757]/20" },
  chatgpt: { icon: "G", color: "#10A37F", bg: "bg-[#10A37F]/20" },
  perplexity: { icon: "P", color: "#20B8CD", bg: "bg-[#20B8CD]/20" },
  grok: { icon: "X", color: "#1DA1F2", bg: "bg-[#1DA1F2]/20" },
};

export interface VerifiedData {
  id: string;
  platform: string;
  title: string;
  verifiedAt?: string;
}

interface VerifiedCardProps {
  data: VerifiedData;
  className?: string;
}

export function VerifiedCard({ data, className }: VerifiedCardProps) {
  const platform = platformIcons[data.platform.toLowerCase()] || platformIcons.perplexity;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-4 transition-all duration-200 group",
        "bg-gradient-to-br from-primary/20 via-accent-purple/10 to-primary/5",
        "border border-primary/30 hover:border-primary/50",
        className
      )}
    >
      {/* Success Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />

      {/* Content */}
      <div className="relative z-10">
        {/* Platform Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                platform.bg
              )}
              style={{ color: platform.color }}
            >
              {platform.icon}
            </div>
            <span className="text-sm text-foreground/80 capitalize">
              {data.platform}
            </span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-success" />
        </div>

        {/* Title */}
        <h4 className="text-base font-semibold text-foreground">
          {data.title}
        </h4>

        {/* Verified timestamp */}
        {data.verifiedAt && (
          <p className="text-xs text-muted-foreground mt-2">
            Verified {data.verifiedAt}
          </p>
        )}
      </div>

      {/* Decorative corner sparkle */}
      <div className="absolute bottom-2 right-2 opacity-30">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-primary"
        >
          <path
            d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}
