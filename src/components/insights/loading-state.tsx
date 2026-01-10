"use client";

import * as React from "react";
import { Loader2, Bot, Brain, Sparkles, Search, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIPlatform } from "@/lib/ai/types";

// ============================================================================
// Types
// ============================================================================

interface LoadingStateProps {
  /** Which platforms are currently being analyzed */
  loadingPlatforms?: AIPlatform[];

  /** Custom message to display */
  message?: string;

  /** Show detailed platform-by-platform progress */
  showPlatformProgress?: boolean;

  /** Additional CSS classes */
  className?: string;
}

interface PlatformConfig {
  name: string;
  color: string;
  icon: React.ReactNode;
  message: string;
}

// ============================================================================
// Constants
// ============================================================================

const PLATFORM_CONFIG: Record<AIPlatform, PlatformConfig> = {
  chatgpt: {
    name: "ChatGPT",
    color: "#10A37F",
    icon: <Bot className="w-4 h-4" />,
    message: "Querying ChatGPT...",
  },
  claude: {
    name: "Claude",
    color: "#D97757",
    icon: <Brain className="w-4 h-4" />,
    message: "Analyzing with Claude...",
  },
  gemini: {
    name: "Gemini",
    color: "#4285F4",
    icon: <Sparkles className="w-4 h-4" />,
    message: "Consulting Gemini...",
  },
  perplexity: {
    name: "Perplexity",
    color: "#20B8CD",
    icon: <Search className="w-4 h-4" />,
    message: "Searching with Perplexity...",
  },
};

const PROGRESS_MESSAGES = [
  "Analyzing brand visibility across AI platforms...",
  "Extracting citations and mentions...",
  "Calculating visibility scores...",
  "Identifying content performance patterns...",
  "Generating platform-specific recommendations...",
];

// ============================================================================
// Component
// ============================================================================

/**
 * LoadingState component displays progress during multi-platform AI analysis
 *
 * Features:
 * - Animated loading indicators
 * - Platform-specific progress tracking
 * - Rotating progress messages
 * - Platform icons and colors
 * - Clean, minimal design
 *
 * @example
 * ```tsx
 * <LoadingState
 *   loadingPlatforms={["chatgpt", "claude", "gemini", "perplexity"]}
 *   showPlatformProgress={true}
 * />
 * ```
 */
export function LoadingState({
  loadingPlatforms = ["chatgpt", "claude", "gemini", "perplexity"],
  message,
  showPlatformProgress = true,
  className,
}: LoadingStateProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);

  // Rotate through progress messages every 3 seconds
  React.useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [message]);

  const displayMessage = message || PROGRESS_MESSAGES[currentMessageIndex];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main loading indicator */}
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        {/* Animated spinner with gradient background */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full opacity-20 blur-xl"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
            }}
          />
          <div className="relative w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>

        {/* Progress message */}
        <div className="text-center space-y-2 max-w-md">
          <h3 className="text-lg font-semibold text-foreground">
            Analyzing AI Platform Insights
          </h3>
          <p className="text-sm text-muted-foreground transition-opacity duration-500">
            {displayMessage}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md h-1 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 shimmer"
          />
        </div>
      </div>

      {/* Platform-specific progress indicators */}
      {showPlatformProgress && loadingPlatforms.length > 0 && (
        <div className="card-primary p-6">
          <h4 className="text-sm font-medium text-foreground mb-4">
            Analyzing {loadingPlatforms.length} Platform{loadingPlatforms.length !== 1 ? "s" : ""}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loadingPlatforms.map((platform) => {
              const config = PLATFORM_CONFIG[platform];
              return (
                <PlatformProgressCard
                  key={platform}
                  platform={platform}
                  config={config}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Helpful tips while waiting */}
      <div className="card-secondary p-4 border-l-4 border-primary/50">
        <div className="flex gap-3">
          <div className="mt-0.5">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-foreground">
              Analysis in Progress
            </p>
            <p className="text-xs text-muted-foreground">
              This typically takes 10-30 seconds depending on the number of platforms.
              We&apos;re analyzing how each AI platform surfaces and cites your brand content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * PlatformProgressCard displays loading state for a single platform
 */
interface PlatformProgressCardProps {
  platform: AIPlatform;
  config: PlatformConfig;
  isComplete?: boolean;
}

function PlatformProgressCard({
  platform,
  config,
  isComplete = false,
}: PlatformProgressCardProps) {
  return (
    <div
      className="relative p-3 rounded-lg border transition-all"
      style={{
        backgroundColor: `${config.color}10`,
        borderColor: `${config.color}30`,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Platform icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{
            backgroundColor: `${config.color}20`,
            color: config.color,
          }}
        >
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            config.icon
          )}
        </div>

        {/* Platform info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {config.name}
            </p>
            {!isComplete && (
              <Loader2
                className="w-3 h-3 animate-spin flex-shrink-0"
                style={{ color: config.color }}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {isComplete ? "Analysis complete" : config.message}
          </p>
        </div>
      </div>

      {/* Animated progress indicator */}
      {!isComplete && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted/20 overflow-hidden rounded-b-lg">
          <div
            className="h-full shimmer"
            style={{
              backgroundColor: config.color,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Skeleton Loading State
// ============================================================================

/**
 * LoadingSkeleton displays placeholder content while data is loading
 * Used for initial page load or when no specific platforms are being analyzed
 */
export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
        <div className="h-10 w-32 bg-muted rounded" />
      </div>

      {/* Platform cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-primary p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-16 w-16 mx-auto bg-muted rounded-full" />
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-3/4 bg-muted rounded mx-auto" />
            </div>
          </div>
        ))}
      </div>

      {/* Content matrix skeleton */}
      <div className="card-primary p-6">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="h-8 w-32 bg-muted rounded" />
              <div className="h-8 flex-1 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Animations
// ============================================================================
// Note: Shimmer animation is already defined in globals.css and used via the
// "shimmer" class. No additional CSS needed.
