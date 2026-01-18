"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showGrade?: boolean;
  className?: string;
}

/**
 * Calculate grade from score (0-100)
 */
function getGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D+";
  if (score >= 45) return "D";
  if (score >= 40) return "D-";
  return "F";
}

/**
 * Get color classes based on score
 */
function getScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (score >= 80) {
    return {
      bg: "bg-success/10",
      text: "text-success",
      border: "border-success/30",
    };
  }
  if (score >= 60) {
    return {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/30",
    };
  }
  if (score >= 40) {
    return {
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-warning/30",
    };
  }
  return {
    bg: "bg-error/10",
    text: "text-error",
    border: "border-error/30",
  };
}

const sizeClasses = {
  sm: "w-10 h-10 text-xs",
  md: "w-14 h-14 text-sm",
  lg: "w-20 h-20 text-lg",
};

export function ScoreBadge({
  score,
  size = "md",
  showGrade = false,
  className,
}: ScoreBadgeProps) {
  const { bg, text, border } = getScoreColor(score);
  const grade = getGrade(score);

  return (
    <div
      className={cn(
        "rounded-xl border flex flex-col items-center justify-center font-bold",
        bg,
        border,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn("font-bold", text)}>{score}</span>
      {showGrade && (
        <span className={cn("text-[10px] opacity-70", text)}>{grade}</span>
      )}
    </div>
  );
}

export { getGrade, getScoreColor };
