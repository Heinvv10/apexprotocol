"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const platforms: Platform[] = [
  { id: "chatgpt", name: "ChatGPT", icon: "G", color: "#10A37F" },
  { id: "claude", name: "Claude", icon: "C", color: "#D97757" },
  { id: "gemini", name: "Gemini", icon: "G", color: "#4285F4" },
  { id: "perplexity", name: "Perplexity", icon: "P", color: "#20B8CD" },
  { id: "grok", name: "Grok", icon: "X", color: "#1DA1F2" },
];

interface PlatformTabsProps {
  activePlatform: string;
  onPlatformChange: (platformId: string) => void;
  className?: string;
}

export function PlatformTabs({
  activePlatform,
  onPlatformChange,
  className,
}: PlatformTabsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {platforms.map((platform) => {
        const isActive = activePlatform === platform.id;
        return (
          <button
            key={platform.id}
            onClick={() => onPlatformChange(platform.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
              "text-sm font-medium",
              isActive
                ? "bg-bg-elevated border border-primary/30 text-foreground shadow-lg shadow-primary/10"
                : "bg-transparent border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
            )}
          >
            <span
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center text-xs font-bold",
                isActive ? "opacity-100" : "opacity-70"
              )}
              style={{
                backgroundColor: `${platform.color}20`,
                color: platform.color,
              }}
            >
              {platform.icon}
            </span>
            <span>{platform.name}</span>
          </button>
        );
      })}
    </div>
  );
}
