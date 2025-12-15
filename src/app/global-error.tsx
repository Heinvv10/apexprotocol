"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // Log critical error to monitoring service
    console.error("Critical application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#02030A] text-white">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[hsl(var(--error)/0.2)] flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-[hsl(var(--error))]" />
            </div>

            {/* APEX Logo */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
                <path
                  d="M16 4L28 28H4L16 4Z"
                  fill="url(#apexGradError)"
                />
                <defs>
                  <linearGradient
                    id="apexGradError"
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

            {/* Title */}
            <h1 className="text-2xl font-bold mb-3">
              Critical Error
            </h1>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-8">
              The application encountered a critical error and needs to be reloaded.
              We apologize for the inconvenience.
            </p>

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
                href="mailto:support@apex.io"
                className="text-cyan-400 hover:underline"
              >
                support@apex.io
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
      </body>
    </html>
  );
}
