"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary for Settings page
 * Catches Clerk authentication errors and displays a user-friendly message
 */
export class SettingsErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Settings Error:", error);
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || "";
      const isClerkError =
        errorMessage.includes("useUser") ||
        errorMessage.includes("ClerkProvider") ||
        errorMessage.includes("Clerk");

      if (isClerkError) {
        return (
          <div className="flex items-center justify-center min-h-[600px] px-4">
            <div className="text-center max-w-lg space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">
                Settings Temporarily Unavailable
              </h1>
              <p className="text-muted-foreground">
                The Settings page requires authentication to be configured. Please try the following:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 text-left bg-muted/50 rounded-lg p-4">
                <li>✓ Refresh the page and try again</li>
                <li>✓ Clear your browser cache and cookies</li>
                <li>✓ Try accessing Settings from a different page</li>
                <li>✓ If the problem persists, contact support</li>
              </ul>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = "/dashboard"}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        );
      }

      // For non-Clerk errors, show generic error message
      return (
        <div className="flex items-center justify-center min-h-[600px] px-4">
          <div className="text-center max-w-lg space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Something Went Wrong
            </h1>
            <p className="text-muted-foreground text-sm">
              {errorMessage || "An unexpected error occurred while loading the settings page."}
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = "/dashboard"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
