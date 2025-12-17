"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
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
        <ErrorFallback
          error={this.state.error}
          resetError={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Default fallback component
interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="p-6 rounded-lg border border-error/30 bg-error/5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-error" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground">
            Something went wrong
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            This component encountered an error and couldn&apos;t render properly.
          </p>

          {/* Error message in development */}
          {process.env.NODE_ENV === "development" && error && (
            <pre className="mt-3 p-2 rounded bg-muted/20 text-xs font-mono text-error/80 overflow-auto max-w-full">
              {error.message}
            </pre>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={resetError}
            className="mt-4"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}

// Compact inline error display
interface InlineErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function InlineError({
  message = "Failed to load",
  onRetry,
}: InlineErrorProps) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
      <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
      <span className="text-sm text-error/90">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-auto text-xs text-error hover:text-error/80 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// Card-level error state
interface CardErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function CardError({
  title = "Unable to load",
  message = "There was a problem loading this content.",
  onRetry,
}: CardErrorProps) {
  return (
    <div className="card-tertiary flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-error" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[200px]">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="w-3 h-3 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}
