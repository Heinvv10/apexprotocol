"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PerceptionBubble {
  id: string;
  label: string;
  weight: number; // 0-100, affects size
  sentiment: "positive" | "neutral" | "negative";
}

interface BrandPerceptionCloudProps {
  bubbles: PerceptionBubble[];
  className?: string;
}

const sentimentColors = {
  positive: {
    bg: "bg-primary/20",
    border: "border-primary/30",
    text: "text-primary",
  },
  neutral: {
    bg: "bg-muted/20",
    border: "border-muted/30",
    text: "text-muted-foreground",
  },
  negative: {
    bg: "bg-error/20",
    border: "border-error/30",
    text: "text-error",
  },
};

// Predefined positions for bubble cloud layout
const bubblePositions = [
  { top: "5%", left: "60%", scale: 1.1 },
  { top: "5%", left: "80%", scale: 0.9 },
  { top: "25%", left: "45%", scale: 1.0 },
  { top: "20%", left: "70%", scale: 0.85 },
  { top: "25%", left: "90%", scale: 0.95 },
  { top: "45%", left: "55%", scale: 1.15 },
  { top: "50%", left: "75%", scale: 0.8 },
  { top: "45%", left: "92%", scale: 0.9 },
  { top: "65%", left: "48%", scale: 0.95 },
  { top: "70%", left: "68%", scale: 1.0 },
  { top: "65%", left: "88%", scale: 0.85 },
  { top: "85%", left: "60%", scale: 0.9 },
];

export function BrandPerceptionCloud({
  bubbles,
  className,
}: BrandPerceptionCloudProps) {
  return (
    <div className={cn("relative h-[300px]", className)}>
      <h3 className="text-base font-semibold text-foreground mb-4">
        Brand Perception
      </h3>
      <div className="relative h-full w-full">
        {bubbles.map((bubble, index) => {
          const position = bubblePositions[index % bubblePositions.length];
          const colors = sentimentColors[bubble.sentiment];
          const baseSize = 60 + (bubble.weight / 100) * 40;
          const size = baseSize * (position.scale || 1);

          return (
            <div
              key={bubble.id}
              className={cn(
                "absolute rounded-full flex items-center justify-center",
                "border transition-all duration-300 hover:scale-110 cursor-pointer",
                colors.bg,
                colors.border
              )}
              style={{
                top: position.top,
                left: position.left,
                width: `${size}px`,
                height: `${size}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span
                className={cn(
                  "text-xs font-medium text-center px-2",
                  colors.text
                )}
                style={{
                  fontSize: `${Math.max(9, 11 * (position.scale || 1))}px`,
                }}
              >
                {bubble.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
