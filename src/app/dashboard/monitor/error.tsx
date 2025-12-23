"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Settings, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MonitorError({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // Log error to monitoring service in production
    // In a real app, this would send to an error tracking service like Sentry
    console.error("Monitor section error:", error);
  }, [error]);

  // Determine if this is a known error type
  const isNetworkError = error.message?.toLowerCase().includes("network") ||
    error.message?.toLowerCase().includes("fetch");
  const isAuthError = error.message?.toLowerCase().includes("unauthorized") ||
    error.message?.toLowerCase().includes("401");
  const isNotFoundError = error.message?.toLowerCase().includes("not found") ||
    error.message?.toLowerCase().includes("404");

  // Customize message based on error type
  const getErrorMessage = () => {
    if (isNetworkError) {
      return "We couldn't connect to our servers. Please check your internet connection and try again.";
    }
    if (isAuthError) {
      return "Your session may have expired. Please sign in again to continue.";
    }
    if (isNotFoundError) {
      return "The requested data could not be found. It may have been moved or deleted.";
    }
    return "We encountered an unexpected error while loading your monitoring data. Don't worry, your data is safe.";
  };

  const getErrorTitle = () => {
    if (isNetworkError) return "Connection Error";
    if (isAuthError) return "Authentication Required";
    if (isNotFoundError) return "Data Not Found";
    return "Something went wrong";
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="card-secondary text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-error" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {getErrorTitle()}
          </h1>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6">
            {getErrorMessage()}
          </p>

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
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Stack trace
                  </summary>
                  <pre className="mt-2 text-xs font-mono text-muted-foreground overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} className="gradient-primary text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/monitor">
                <MessageSquare className="w-4 h-4 mr-2" />
                Back to Monitor
              </Link>
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-6 pt-6 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-3">Quick actions</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <Home className="w-3 h-3 mr-1" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/monitor/settings">
                  <Settings className="w-3 h-3 mr-1" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-6 pt-6 border-t border-border/30">
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
      </div>
    </div>
  );
}
