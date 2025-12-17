"use client";

/**
 * ScanBrandButton Component
 *
 * Triggers a service-level social scan for a brand.
 * Shows loading state and scan results.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanBrandButtonProps {
  brandId: string;
  handles: {
    twitter?: string;
    youtube?: string;
    facebook?: string;
  };
  onScanComplete?: (results: ScanResult) => void;
  onError?: (error: string) => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

interface ScanResult {
  success: boolean;
  data: {
    type: string;
    brandId: string;
    scannedAt: string;
    results: Record<string, unknown>;
    summary?: {
      successfulPlatforms: number;
      failedPlatforms: number;
      totalFollowers: number;
    };
  };
}

type ScanStatus = "idle" | "scanning" | "success" | "error";

export function ScanBrandButton({
  brandId,
  handles,
  onScanComplete,
  onError,
  variant = "default",
  size = "default",
  className,
  showLabel = true,
}: ScanBrandButtonProps) {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Check if any handles are configured
  const configuredHandles = Object.entries(handles).filter(
    ([, value]) => value && value.trim().length > 0
  );

  const hasHandles = configuredHandles.length > 0;

  const handleScan = async () => {
    if (!hasHandles) {
      setErrorMessage("No social handles configured");
      onError?.("No social handles configured");
      return;
    }

    setStatus("scanning");
    setErrorMessage("");

    try {
      const response = await fetch("/api/social/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandId,
          handles,
          options: {
            includeProfile: true,
            includePosts: true,
            includeMentions: true,
            postsLimit: 20,
            mentionsLimit: 20,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Scan failed");
      }

      setStatus("success");
      onScanComplete?.(result);

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scan failed";
      setStatus("error");
      setErrorMessage(message);
      onError?.(message);

      // Reset to idle after 5 seconds
      setTimeout(() => {
        setStatus("idle");
        setErrorMessage("");
      }, 5000);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case "scanning":
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {showLabel && <span>Scanning...</span>}
          </>
        );
      case "success":
        return (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            {showLabel && <span>Scan Complete</span>}
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            {showLabel && <span>Scan Failed</span>}
          </>
        );
      default:
        return (
          <>
            <RefreshCw className="h-4 w-4" />
            {showLabel && <span>Scan Social</span>}
          </>
        );
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={variant}
        size={size}
        onClick={handleScan}
        disabled={status === "scanning" || !hasHandles}
        className={cn(
          "gap-2",
          status === "success" && "border-green-500/50",
          status === "error" && "border-red-500/50",
          className
        )}
        title={
          !hasHandles
            ? "Configure social handles to enable scanning"
            : `Scan ${configuredHandles.map(([p]) => p).join(", ")}`
        }
      >
        {getButtonContent()}
      </Button>
      {errorMessage && (
        <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

// Compact version for toolbar/header usage
export function ScanBrandIconButton({
  brandId,
  handles,
  onScanComplete,
  onError,
}: Omit<ScanBrandButtonProps, "variant" | "size" | "showLabel">) {
  return (
    <ScanBrandButton
      brandId={brandId}
      handles={handles}
      onScanComplete={onScanComplete}
      onError={onError}
      variant="ghost"
      size="icon"
      showLabel={false}
    />
  );
}
