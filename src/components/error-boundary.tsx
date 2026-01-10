"use client";

import * as React from "react";
import { AlertCircle, RefreshCw, AlertTriangle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

/**
 * PageError Component (Phase 5 - Documentation)
 *
 * A full-page error display component designed for Next.js route-level errors (error.tsx).
 * Features a centered card layout with error details, navigation actions, and support information.
 *
 * **When to use:**
 * - Route-level errors caught by Next.js error.tsx files
 * - Page-specific errors that prevent the entire page from rendering
 * - Recoverable errors where users can retry or navigate away
 *
 * **When NOT to use:**
 * - Component-level errors â†’ Use ErrorFallback or ErrorBoundary instead
 * - Critical application failures â†’ Use FullScreenError instead
 * - Inline errors in forms/cards â†’ Use InlineError or CardError instead
 *
 * @example
 * ```tsx
 * // In app/dashboard/error.tsx
 * 'use client';
 * export default function Error({ error, reset }: { error: Error; reset: () => void }) {
 *   return <PageError error={error} reset={reset} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom messaging and navigation
 * <PageError
 *   error={error}
 *   reset={reset}
 *   title="Dashboard Error"
 *   description="We couldn't load your dashboard. Please try again."
 *   showHomeButton={false}
 *   showBackButton={true}
 * />
 * ```
 */
interface PageErrorProps {
  /** The error object from Next.js error boundary, may include an optional digest for error tracking */
  error: Error & { digest?: string };
  /** Callback function to attempt recovery by re-rendering the route */
  reset: () => void;
  /** Custom error title. Defaults to "Something went wrong" */
  title?: string;
  /** Custom error description. Defaults to a message about safe data and retry options */
  description?: string;
  /** Whether to show the "Go to Dashboard" button. Defaults to true */
  showHomeButton?: boolean;
  /** Whether to show the "Go Back" button. Defaults to false */
  showBackButton?: boolean;
  /** Custom href for the home button. Defaults to "/dashboard" */
  homeHref?: string;
}

export function PageError({
  error,
  reset,
  title = "Something went wrong",
  description = "We encountered an unexpected error. Don't worry, your data is safe. You can try again or return to the dashboard.",
  showHomeButton = true,
  showBackButton = false,
  homeHref = "/dashboard",
}: PageErrorProps) {
  React.useEffect(() => {
    // Log error to monitoring service in production
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen dashboard-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="card-secondary text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-error" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6">{description}</p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mb-6 p-4 rounded-lg bg-muted/20 border border-border/30 text-left">
              <p className="text-xs font-mono text-error/80 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs font-mono text-muted-foreground mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} className="gradient-primary text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            {showHomeButton && (
              <Button variant="outline" asChild>
                <Link href={homeHref}>
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            )}
            {showBackButton && (
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}
          </div>

          {/* Additional Help */}
          <div className="mt-8 pt-6 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              If this problem persists, please{" "}
              <a
                href="mailto:support@apex.io"
                className="text-primary hover:underline"
              >
                contact support
              </a>
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-error/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * FullScreenError Component (Phase 5 - Documentation)
 *
 * A full-screen error display component designed for critical application failures (global-error.tsx).
 * Features a dark, full-screen layout with APEX branding, error details, and reload action.
 *
 * **When to use:**
 * - Critical application failures caught by Next.js global-error.tsx
 * - Unrecoverable errors that require a full application reload
 * - Root-level errors that prevent the entire app from functioning
 * - Errors in the root layout or core application structure
 *
 * **When NOT to use:**
 * - Route-level errors â†’ Use PageError instead
 * - Component-level errors â†’ Use ErrorFallback or ErrorBoundary instead
 * - Recoverable errors â†’ Use PageError with retry/navigation options
 * - Inline errors in forms/cards â†’ Use InlineError or CardError instead
 *
 * @example
 * ```tsx
 * // In app/global-error.tsx
 * 'use client';
 * export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
 *   return (
 *     <html>
 *       <body>
 *         <FullScreenError error={error} reset={reset} />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom messaging and support info
 * <FullScreenError
 *   error={error}
 *   reset={reset}
 *   title="System Failure"
 *   description="A critical system error has occurred. Please reload the application."
 *   supportEmail="help@example.com"
 *   showLogo={true}
 * />
 * ```
 */
interface FullScreenErrorProps {
  /** The error object from Next.js global error boundary, may include an optional digest for error tracking */
  error: Error & { digest?: string };
  /** Callback function to reload the entire application */
  reset: () => void;
  /** Custom error title. Defaults to "Critical Error" */
  title?: string;
  /** Custom error description. Defaults to a message about critical errors and reload requirement */
  description?: string;
  /** Support email address for user assistance. Defaults to "support@apex.io" */
  supportEmail?: string;
  /** Whether to show the APEX logo. Defaults to true */
  showLogo?: boolean;
}

export function FullScreenError({
  error,
  reset,
  title = "Critical Error",
  description = "The application encountered a critical error and needs to be reloaded. We apologize for the inconvenience.",
  supportEmail = "support@apex.io",
  showLogo = true,
}: FullScreenErrorProps) {
  React.useEffect(() => {
    // Log critical error to monitoring service
    console.error("Critical application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#02030A] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[hsl(var(--error)/0.2)] flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-[hsl(var(--error))]" />
        </div>

        {/* APEX Logo */}
        {showLogo && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
              <path
                d="M16 4L28 28H4L16 4Z"
                fill="url(#apexGradFullScreenError)"
              />
              <defs>
                <linearGradient
                  id="apexGradFullScreenError"
                  x1="4"
                  y1="28"
                  x2="28"
                  y2="4"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#00E5CC" />
                  <stop offset="1" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              APEX
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold mb-3">{title}</h1>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-8">{description}</p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-8 p-4 rounded-lg bg-gray-900/50 border border-gray-700 text-left">
            <p className="text-xs font-mono text-red-400 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-gray-500 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 shadow-lg shadow-purple-500/25"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reload Application
        </button>

        {/* Additional Help */}
        <p className="mt-8 text-xs text-gray-500">
          If this problem continues, please contact{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="text-cyan-400 hover:underline"
          >
            {supportEmail}
          </a>
        </p>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-red-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
