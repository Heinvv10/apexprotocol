"use client";

import * as React from "react";
import { PlatformCard } from "./platform-card";
import { cn } from "@/lib/utils";
import {
  useCurrentAnalysis,
  usePlatformLoading,
  usePlatformErrors,
} from "@/stores/insights-store";
import type { AIPlatform } from "@/lib/ai/types";

// ============================================================================
// Types
// ============================================================================

interface PlatformGridProps {
  /** Optional CSS classes */
  className?: string;

  /** Click handler for platform cards */
  onPlatformClick?: (platform: AIPlatform) => void;
}

interface PlatformConfig {
  key: AIPlatform;
  name: string;
}

// ============================================================================
// Constants
// ============================================================================

const PLATFORMS: PlatformConfig[] = [
  { key: "chatgpt", name: "ChatGPT" },
  { key: "claude", name: "Claude" },
  { key: "gemini", name: "Gemini" },
  { key: "perplexity", name: "Perplexity" },
  { key: "grok", name: "Grok" },
  { key: "deepseek", name: "DeepSeek" },
  { key: "copilot", name: "Copilot" },
];

// ============================================================================
// Component
// ============================================================================

/**
 * PlatformGrid displays all 4 AI platform visibility cards in a responsive grid layout.
 *
 * Features:
 * - Responsive grid (2 columns on small screens, 4 on large)
 * - Integrates with insights store for current analysis data
 * - Shows loading states per platform
 * - Displays error states for failed platforms
 * - Empty state when no analysis is available
 *
 * @example
 * ```tsx
 * <PlatformGrid onPlatformClick={(platform) => console.log('Clicked:', platform)} />
 * ```
 */
export function PlatformGrid({ className, onPlatformClick }: PlatformGridProps) {
  const currentAnalysis = useCurrentAnalysis();
  const platformLoading = usePlatformLoading();
  const platformErrors = usePlatformErrors();

  // If no analysis data, show empty state
  if (!currentAnalysis) {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="text-lg font-semibold text-foreground">
          Platform Visibility Scores
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORMS.map((platform) => (
            <PlatformCard
              key={platform.key}
              platform={platform.key}
              isLoading={false}
              error={null}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold text-foreground">
        Platform Visibility Scores
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORMS.map((platform) => {
          const platformResult = currentAnalysis.platforms[platform.key];
          const isLoading = platformLoading[platform.key] ?? false;
          const error = platformErrors[platform.key] ?? null;

          // Extract visibility score if analysis succeeded
          const visibilityScore =
            platformResult?.status === "success" && platformResult.analysis
              ? platformResult.analysis.visibilityScore
              : undefined;

          // Use error from platform result if available
          const errorMessage =
            error ||
            (platformResult?.status === "failed" ? platformResult.error : null);

          return (
            <PlatformCard
              key={platform.key}
              platform={platform.key}
              visibilityScore={visibilityScore}
              isLoading={isLoading}
              error={errorMessage}
              onClick={
                onPlatformClick
                  ? () => onPlatformClick(platform.key)
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
