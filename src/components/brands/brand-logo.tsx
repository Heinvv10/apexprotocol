"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  logoUrl?: string | null;
  brandName: string;
  fallbackColor?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showFallback?: boolean;
  onError?: (error: Error) => void;
}

// Size mappings: container size and text size
const SIZE_CONFIG = {
  xs: { container: "h-6 w-6", text: "text-xs" },
  sm: { container: "h-8 w-8", text: "text-xs" },
  md: { container: "h-12 w-12", text: "text-sm" },
  lg: { container: "h-16 w-16", text: "text-lg" },
};

/**
 * BrandLogo Component
 *
 * Renders a brand logo with proper:
 * - Aspect ratio preservation (object-contain)
 * - Fade-in animation on load
 * - Skeleton placeholder while loading
 * - Error state with fallback initials
 * - Consistent sizing and styling
 */
export function BrandLogo({
  logoUrl,
  brandName,
  fallbackColor = "hsl(var(--primary))",
  size = "md",
  className,
  showFallback = true,
  onError,
}: BrandLogoProps) {
  const [isLoading, setIsLoading] = React.useState(!!logoUrl);
  const [hasError, setHasError] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  const sizeConfig = SIZE_CONFIG[size];

  // Get brand initials for fallback
  const initials = brandName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    // Trigger fade-in animation
    setIsVisible(true);
  };

  // Handle image error
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(new Error(`Failed to load logo for ${brandName}`));
  };

  // Reset state when logoUrl changes
  React.useEffect(() => {
    if (logoUrl) {
      setIsLoading(true);
      setHasError(false);
      setIsVisible(false);
    } else {
      setIsLoading(false);
      setHasError(false);
      setIsVisible(true);
    }
  }, [logoUrl]);

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg font-semibold text-white shrink-0 overflow-hidden relative",
        sizeConfig.container,
        sizeConfig.text,
        className
      )}
      style={{ backgroundColor: fallbackColor }}
      role="img"
      aria-label={`${brandName} logo`}
    >
      {/* Skeleton Loader - Show while loading */}
      {isLoading && !hasError && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Image - Fade in when loaded */}
      {logoUrl && !hasError && (
        <img
          ref={imgRef}
          src={logoUrl}
          alt={`${brandName} logo`}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "h-full w-full object-contain p-1 transition-opacity duration-500",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* Fallback - Show when no logo or error */}
      {(!logoUrl || hasError) && showFallback && (
        <span className="font-bold">{initials || "B"}</span>
      )}
    </div>
  );
}
