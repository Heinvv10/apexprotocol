// Client-safe GEO alert utilities
// No server imports (db, pg, ioredis, etc.) - safe for use in browser code

// Alert type enum values
export type GeoAlertType =
  | "algorithm_change"
  | "recommendation_updated"
  | "strategy_deprecated"
  | "new_opportunity"
  | "competitor_move"
  | "score_impact";

// Alert severity enum values
export type AlertSeverity = "info" | "warning" | "critical";

// ============================================================================
// Client-safe utility functions
// ============================================================================

/**
 * Get icon for alert severity
 */
export function getSeverityIcon(severity: AlertSeverity): string {
  const icons: Record<AlertSeverity, string> = {
    info: "ℹ️",
    warning: "⚠️",
    critical: "🚨",
  };
  return icons[severity] || "ℹ️";
}

/**
 * Get Tailwind color class for severity
 */
export function getSeverityColorClass(severity: AlertSeverity): string {
  const colors: Record<AlertSeverity, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
    critical: "bg-red-50 border-red-200 text-red-900",
  };
  return colors[severity] || colors.info;
}

/**
 * Get display label for alert type
 */
export function getAlertTypeLabel(type: GeoAlertType): string {
  const labels: Record<GeoAlertType, string> = {
    algorithm_change: "Algorithm Change",
    recommendation_updated: "Recommendation Updated",
    strategy_deprecated: "Strategy Deprecated",
    new_opportunity: "New Opportunity",
    competitor_move: "Competitor Move",
    score_impact: "Score Impact",
  };
  return labels[type] || type.replace(/_/g, " ");
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: string): string {
  const names: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
    perplexity: "Perplexity",
    grok: "Grok",
    deepseek: "DeepSeek",
    copilot: "Copilot",
    all: "All Platforms",
  };
  return names[platform] || platform;
}
