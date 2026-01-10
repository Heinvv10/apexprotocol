"use client";

import * as React from "react";
import { AlertCircle, AlertTriangle, RefreshCw, CheckCircle2, XCircle, Bot, Brain, Sparkles, Search, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AIPlatform } from "@/lib/ai/types";

// ============================================================================
// Types
// ============================================================================

interface ErrorStateProps {
  /** Main error message */
  error?: string | null;

  /** Platform-specific errors (for partial failures) */
  platformErrors?: Partial<Record<AIPlatform, string | null>>;

  /** Platforms that succeeded (for partial failures) */
  successfulPlatforms?: AIPlatform[];

  /** Platforms that failed */
  failedPlatforms?: AIPlatform[];

  /** Retry handler */
  onRetry?: () => void;

  /** Show detailed platform-by-platform breakdown */
  showPlatformBreakdown?: boolean;

  /** Error severity */
  severity?: "error" | "warning" | "info";

  /** Additional CSS classes */
  className?: string;
}

interface PlatformConfig {
  name: string;
  color: string;
  icon: React.ReactNode;
}

// ============================================================================
// Constants
// ============================================================================

const PLATFORM_CONFIG: Record<AIPlatform, PlatformConfig> = {
  chatgpt: {
    name: "ChatGPT",
    color: "#10A37F",
    icon: <Bot className="w-4 h-4" />,
  },
  claude: {
    name: "Claude",
    color: "#D97757",
    icon: <Brain className="w-4 h-4" />,
  },
  gemini: {
    name: "Gemini",
    color: "#4285F4",
    icon: <Sparkles className="w-4 h-4" />,
  },
  perplexity: {
    name: "Perplexity",
    color: "#20B8CD",
    icon: <Search className="w-4 h-4" />,
  },
};

// ============================================================================
// Component
// ============================================================================

/**
 * ErrorState component displays errors gracefully, including partial failures
 *
 * Features:
 * - Main error message display
 * - Platform-specific error breakdown
 * - Shows which platforms succeeded vs failed
 * - Retry functionality
 * - Helpful error messages and troubleshooting tips
 * - Different severity levels (error, warning, info)
 * - Platform-specific colors and icons
 *
 * @example
 * ```tsx
 * // Complete failure
 * <ErrorState
 *   error="Analysis failed due to network error"
 *   onRetry={handleRetry}
 * />
 *
 * // Partial failure
 * <ErrorState
 *   successfulPlatforms={["chatgpt", "claude"]}
 *   failedPlatforms={["gemini", "perplexity"]}
 *   platformErrors={{
 *     gemini: "Rate limit exceeded",
 *     perplexity: "API key invalid"
 *   }}
 *   showPlatformBreakdown={true}
 *   onRetry={handleRetry}
 * />
 * ```
 */
export function ErrorState({
  error,
  platformErrors = {},
  successfulPlatforms = [],
  failedPlatforms = [],
  onRetry,
  showPlatformBreakdown = true,
  severity = "error",
  className,
}: ErrorStateProps) {
  const hasPartialSuccess = successfulPlatforms.length > 0 && failedPlatforms.length > 0;
  const hasCompleteFailure = failedPlatforms.length > 0 && successfulPlatforms.length === 0;

  // Determine severity icon and colors
  const severityConfig = {
    error: {
      icon: <AlertCircle className="w-8 h-8" />,
      iconBgColor: "bg-error/20",
      iconColor: "text-error",
      borderColor: "border-error/30",
      bgColor: "bg-error/5",
      textColor: "text-error",
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8" />,
      iconBgColor: "bg-amber-500/20",
      iconColor: "text-amber-500",
      borderColor: "border-amber-500/30",
      bgColor: "bg-amber-500/5",
      textColor: "text-amber-500",
    },
    info: {
      icon: <Info className="w-8 h-8" />,
      iconBgColor: "bg-blue-500/20",
      iconColor: "text-blue-500",
      borderColor: "border-blue-500/30",
      bgColor: "bg-blue-500/5",
      textColor: "text-blue-500",
    },
  };

  const config = severityConfig[hasPartialSuccess ? "warning" : severity];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main error message */}
      <div
        className={cn(
          "rounded-lg border p-6",
          config.borderColor,
          config.bgColor
        )}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0", config.iconBgColor)}>
            <div className={config.iconColor}>
              {config.icon}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {hasPartialSuccess
                ? "Partial Analysis Completed"
                : hasCompleteFailure
                ? "Analysis Failed"
                : "Unable to Complete Analysis"}
            </h3>

            <p className="text-sm text-muted-foreground mb-4">
              {error || getDefaultErrorMessage(hasPartialSuccess, successfulPlatforms, failedPlatforms)}
            </p>

            {/* Summary stats for partial failures */}
            {hasPartialSuccess && (
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-foreground">
                    {successfulPlatforms.length} platform{successfulPlatforms.length !== 1 ? "s" : ""} analyzed successfully
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-error" />
                  <span className="text-sm text-foreground">
                    {failedPlatforms.length} platform{failedPlatforms.length !== 1 ? "s" : ""} failed
                  </span>
                </div>
              </div>
            )}

            {/* Retry button */}
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Analysis
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Platform-specific breakdown */}
      {showPlatformBreakdown && (successfulPlatforms.length > 0 || failedPlatforms.length > 0) && (
        <div className="card-primary p-6">
          <h4 className="text-sm font-medium text-foreground mb-4">
            Platform Status
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Successful platforms */}
            {successfulPlatforms.map((platform) => (
              <PlatformStatusCard
                key={platform}
                platform={platform}
                status="success"
              />
            ))}

            {/* Failed platforms */}
            {failedPlatforms.map((platform) => (
              <PlatformStatusCard
                key={platform}
                platform={platform}
                status="failed"
                error={platformErrors[platform] || undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Troubleshooting tips */}
      <div className="card-secondary p-4 border-l-4 border-primary/50">
        <div className="flex gap-3">
          <div className="mt-0.5">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
              <Info className="w-3 h-3 text-primary" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-foreground">
              Troubleshooting Tips
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              {getTroubleshootingTips(hasPartialSuccess, failedPlatforms, platformErrors).map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
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
 * PlatformStatusCard displays status for a single platform
 */
interface PlatformStatusCardProps {
  platform: AIPlatform;
  status: "success" | "failed";
  error?: string;
}

function PlatformStatusCard({ platform, status, error }: PlatformStatusCardProps) {
  const config = PLATFORM_CONFIG[platform];
  const isSuccess = status === "success";

  return (
    <div
      className={cn(
        "relative p-3 rounded-lg border transition-all",
        isSuccess ? "border-green-500/30 bg-green-500/5" : "border-error/30 bg-error/5"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Platform icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
          style={{
            backgroundColor: `${config.color}20`,
            color: config.color,
          }}
        >
          {config.icon}
        </div>

        {/* Platform info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-foreground">
              {config.name}
            </p>
            {isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-error flex-shrink-0" />
            )}
          </div>
          <p className={cn("text-xs", isSuccess ? "text-green-500/80" : "text-error/80")}>
            {isSuccess ? "Analysis successful" : error || "Analysis failed"}
          </p>
        </div>
      </div>

      {/* Status indicator bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg"
        style={{
          backgroundColor: isSuccess ? "#10B981" : "#EF4444",
        }}
      />
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get default error message based on failure type
 */
function getDefaultErrorMessage(
  hasPartialSuccess: boolean,
  successfulPlatforms: AIPlatform[],
  failedPlatforms: AIPlatform[]
): string {
  if (hasPartialSuccess) {
    return `We successfully analyzed ${successfulPlatforms.length} platform${successfulPlatforms.length !== 1 ? "s" : ""}, but ${failedPlatforms.length} platform${failedPlatforms.length !== 1 ? "s" : ""} encountered errors. You can view the successful results below.`;
  } else if (failedPlatforms.length > 0) {
    return `We couldn't complete the analysis for any platforms. This might be due to API connectivity issues, rate limits, or invalid API keys.`;
  } else {
    return "The analysis couldn't be completed. Please check your connection and try again.";
  }
}

/**
 * Get troubleshooting tips based on error context
 */
function getTroubleshootingTips(
  hasPartialSuccess: boolean,
  failedPlatforms: AIPlatform[],
  platformErrors: Partial<Record<AIPlatform, string | null>>
): string[] {
  const tips: string[] = [];

  // Check for common error patterns
  const hasRateLimitError = Object.values(platformErrors).some(
    (error) => error?.toLowerCase().includes("rate limit") || error?.toLowerCase().includes("429")
  );
  const hasAuthError = Object.values(platformErrors).some(
    (error) => error?.toLowerCase().includes("auth") ||
              error?.toLowerCase().includes("api key") ||
              error?.toLowerCase().includes("401") ||
              error?.toLowerCase().includes("403")
  );
  const hasNetworkError = Object.values(platformErrors).some(
    (error) => error?.toLowerCase().includes("network") ||
              error?.toLowerCase().includes("timeout") ||
              error?.toLowerCase().includes("connection")
  );

  // Add relevant tips
  if (hasAuthError) {
    tips.push("Check that all AI platform API keys are configured correctly in your environment variables");
  }

  if (hasRateLimitError) {
    tips.push("You may have hit rate limits. Wait a few minutes before trying again");
  }

  if (hasNetworkError) {
    tips.push("Check your internet connection and ensure the AI platform APIs are accessible");
  }

  if (hasPartialSuccess) {
    tips.push("You can proceed with the successful results while we work on fixing the failed platforms");
  }

  if (tips.length === 0) {
    // Default tips
    tips.push("Check your internet connection and try again");
    tips.push("Verify that all required API keys are configured");
    tips.push("If the problem persists, try analyzing fewer platforms at once");
  }

  return tips;
}

// ============================================================================
// Compact Error Variants
// ============================================================================

/**
 * CompactErrorState displays a minimal error message
 * Used for inline errors in smaller components
 */
interface CompactErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function CompactErrorState({
  message = "Analysis failed",
  onRetry,
  className,
}: CompactErrorStateProps) {
  return (
    <div className={cn("flex items-center gap-3 p-4 rounded-lg bg-error/10 border border-error/20", className)}>
      <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
      <span className="text-sm text-error/90 flex-1">{message}</span>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="gap-2 flex-shrink-0"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * PlatformErrorBadge displays a compact error indicator for a platform
 */
interface PlatformErrorBadgeProps {
  platform: AIPlatform;
  error: string;
  className?: string;
}

export function PlatformErrorBadge({
  platform,
  error,
  className,
}: PlatformErrorBadgeProps) {
  const config = PLATFORM_CONFIG[platform];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-error/20 bg-error/5",
        className
      )}
    >
      <div style={{ color: config.color }}>
        {config.icon}
      </div>
      <span className="text-xs font-medium text-foreground">
        {config.name}
      </span>
      <XCircle className="w-3 h-3 text-error" />
      <span className="text-xs text-error/80 max-w-[150px] truncate">
        {error}
      </span>
    </div>
  );
}
