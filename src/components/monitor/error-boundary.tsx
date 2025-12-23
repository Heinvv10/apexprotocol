"use client";

import * as React from "react";
import { AlertCircle, RefreshCw, MessageSquare, BarChart3, Link2, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Props for the class-based error boundary
interface MonitorErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  section?: "mentions" | "analytics" | "citations" | "prompts" | "settings" | "general";
}

interface MonitorErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically for the Monitor section.
 * Catches React errors in child components and displays a user-friendly fallback.
 */
export class MonitorErrorBoundary extends React.Component<
  MonitorErrorBoundaryProps,
  MonitorErrorBoundaryState
> {
  constructor(props: MonitorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MonitorErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error("MonitorErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <MonitorErrorFallback
          error={this.state.error}
          resetError={this.handleReset}
          section={this.props.section ?? "general"}
        />
      );
    }

    return this.props.children;
  }
}

// Section-specific icons and labels
const sectionConfig = {
  mentions: {
    icon: MessageSquare,
    label: "Mentions",
    description: "brand mentions data",
  },
  analytics: {
    icon: BarChart3,
    label: "Analytics",
    description: "analytics data",
  },
  citations: {
    icon: Link2,
    label: "Citations",
    description: "citations data",
  },
  prompts: {
    icon: Search,
    label: "Prompts",
    description: "prompts data",
  },
  settings: {
    icon: Settings,
    label: "Settings",
    description: "settings",
  },
  general: {
    icon: AlertCircle,
    label: "Monitor",
    description: "monitoring data",
  },
};

// Default fallback component for monitor errors
interface MonitorErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  section?: keyof typeof sectionConfig;
}

export function MonitorErrorFallback({
  error,
  resetError,
  section = "general",
}: MonitorErrorFallbackProps) {
  const config = sectionConfig[section];
  const Icon = config.icon;

  return (
    <div className="p-6 rounded-lg border border-error/30 bg-error/5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-error" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground">
            Failed to load {config.description}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            This section encountered an error and couldn&apos;t render properly.
            You can try again or navigate to a different section.
          </p>

          {/* Error message in development */}
          {process.env.NODE_ENV === "development" && error && (
            <pre className="mt-3 p-2 rounded bg-muted/20 text-xs font-mono text-error/80 overflow-auto max-w-full">
              {error.message}
            </pre>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={resetError}
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Try Again
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/monitor">
                Back to Monitor
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact inline error for monitor data fetching failures
interface MonitorInlineErrorProps {
  message?: string;
  onRetry?: () => void;
  section?: keyof typeof sectionConfig;
}

export function MonitorInlineError({
  message = "Failed to load data",
  onRetry,
  section = "general",
}: MonitorInlineErrorProps) {
  const config = sectionConfig[section];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-error/10 border border-error/20">
      <Icon className="w-4 h-4 text-error flex-shrink-0" />
      <span className="text-sm text-error/90 flex-1">{message}</span>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="text-error hover:text-error/80 hover:bg-error/10"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

// Card-level error state for monitor sections
interface MonitorCardErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  section?: keyof typeof sectionConfig;
  showBackLink?: boolean;
}

export function MonitorCardError({
  title,
  message,
  onRetry,
  section = "general",
  showBackLink = false,
}: MonitorCardErrorProps) {
  const config = sectionConfig[section];
  const Icon = config.icon;

  const defaultTitle = `Unable to load ${config.label.toLowerCase()}`;
  const defaultMessage = `There was a problem loading ${config.description}. Please try again.`;

  return (
    <div className="card-tertiary flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-error" />
      </div>
      <h3 className="text-base font-medium text-foreground mb-2">
        {title ?? defaultTitle}
      </h3>
      <p className="text-sm text-muted-foreground max-w-[280px] mb-6">
        {message ?? defaultMessage}
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3 h-3 mr-2" />
            Try Again
          </Button>
        )}
        {showBackLink && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/monitor">
              Back to Monitor
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// Full-page error state for monitor pages
interface MonitorPageErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  section?: keyof typeof sectionConfig;
}

export function MonitorPageError({
  title,
  message,
  onRetry,
  section = "general",
}: MonitorPageErrorProps) {
  const config = sectionConfig[section];
  const Icon = config.icon;

  const defaultTitle = `Failed to load ${config.label.toLowerCase()}`;
  const defaultMessage = `We couldn't load ${config.description}. This might be a temporary issue.`;

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-error/10 border border-error/30 flex items-center justify-center">
            <Icon className="w-10 h-10 text-error" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">
            {title ?? defaultTitle}
          </h3>
          <p className="text-muted-foreground text-sm">
            {message ?? defaultMessage}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry} className="gradient-primary text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/dashboard/monitor">
              <MessageSquare className="w-4 h-4 mr-2" />
              Back to Monitor
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
