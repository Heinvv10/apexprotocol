/**
 * Skeleton Component
 * Animated placeholder for loading states with full variant support
 */

import { cn } from "@/lib/utils";
import * as React from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type SkeletonShape = "rectangle" | "circle" | "text";
type SkeletonSize = "sm" | "md" | "lg";
type SkeletonRounded = "none" | "sm" | "md" | "lg" | "full";
type SkeletonSpeed = "slow" | "normal" | "fast";
type SkeletonWidthVariant = "full" | "75" | "50" | "25";

interface SkeletonProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "width" | "height"> {
  shape?: SkeletonShape;
  size?: SkeletonSize;
  rounded?: SkeletonRounded;
  disableAnimation?: boolean;
  speed?: SkeletonSpeed;
  width?: string | number;
  height?: string | number;
  aspectRatio?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sizeClass(size: SkeletonSize): string {
  switch (size) {
    case "sm": return "h-4";
    case "lg": return "h-12";
    default:   return "h-8";
  }
}

function roundedClass(shape: SkeletonShape, rounded: SkeletonRounded): string {
  if (shape === "circle") return "rounded-full";
  switch (rounded) {
    case "none": return "rounded-none";
    case "sm":   return "rounded-sm";
    case "lg":   return "rounded-lg";
    case "full": return "rounded-full";
    default:     return "rounded-md";
  }
}

function animationDuration(speed: SkeletonSpeed): string {
  switch (speed) {
    case "slow": return "3s";
    case "fast": return "1s";
    default:     return "2s";
  }
}

function dimensionStyle(
  width?: string | number,
  height?: string | number,
  aspectRatio?: string
): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (width != null) {
    style.width = typeof width === "number" ? `${width}px` : width;
  }
  if (height != null) {
    style.height = typeof height === "number" ? `${height}px` : height;
  }
  if (aspectRatio != null) {
    style.aspectRatio = aspectRatio;
  }
  return style;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({
  className,
  shape = "rectangle",
  size = "md",
  rounded = "md",
  disableAnimation = false,
  speed = "normal",
  width,
  height,
  aspectRatio,
  style,
  ...props
}: SkeletonProps) {
  const animStyle: React.CSSProperties = disableAnimation
    ? {}
    : {
        animation: `pulse ${animationDuration(speed)} cubic-bezier(0.4, 0, 0.6, 1) infinite`,
      };

  const dimStyle = dimensionStyle(width, height, aspectRatio);

  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted",
        sizeClass(size),
        roundedClass(shape, rounded),
        className
      )}
      style={{ ...animStyle, ...dimStyle, ...style }}
      {...props}
    />
  );
}

// ─── SkeletonText ─────────────────────────────────────────────────────────────

interface SkeletonTextProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "width"> {
  lines?: number;
  widthVariant?: SkeletonWidthVariant;
  spacing?: string;
  size?: SkeletonSize;
  disableAnimation?: boolean;
  speed?: SkeletonSpeed;
}

function SkeletonText({
  lines = 3,
  widthVariant = "full",
  spacing = "space-y-2",
  size = "md",
  disableAnimation = false,
  speed = "normal",
  className,
  ...props
}: SkeletonTextProps) {
  const clampedLines = Math.max(1, Math.min(10, lines));

  function lineWidthClass(index: number): string {
    if (index < clampedLines - 1) {
      // All lines except the last get the widthVariant
      switch (widthVariant) {
        case "75": return "w-3/4";
        case "50": return "w-1/2";
        case "25": return "w-1/4";
        default:   return "w-full";
      }
    }
    // Last line is 75% of the widthVariant
    switch (widthVariant) {
      case "75": return "w-[56.25%]"; // 75% * 75%
      case "50": return "w-[37.5%]";  // 75% * 50%
      case "25": return "w-[18.75%]"; // 75% * 25%
      default:   return "w-3/4";      // 75% * 100%
    }
  }

  return (
    <div
      data-slot="skeleton-text"
      className={cn(spacing, className)}
      {...props}
    >
      {Array.from({ length: clampedLines }).map((_, i) => (
        <Skeleton
          key={i}
          shape="text"
          size={size}
          disableAnimation={disableAnimation}
          speed={speed}
          className={lineWidthClass(i)}
        />
      ))}
    </div>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  showAvatar?: boolean;
  titleLines?: number;
  descriptionLines?: number;
  showFooter?: boolean;
  disableAnimation?: boolean;
  speed?: SkeletonSpeed;
}

function SkeletonCard({
  showAvatar = false,
  titleLines = 1,
  descriptionLines = 3,
  showFooter = false,
  disableAnimation = false,
  speed = "normal",
  className,
  ...props
}: SkeletonCardProps) {
  const animProps = { disableAnimation, speed };

  return (
    <div
      data-slot="skeleton-card"
      className={cn("rounded-xl border bg-card shadow-sm flex flex-col py-6 gap-6", className)}
      {...props}
    >
      {/* Header: avatar + title */}
      <div className="flex items-start gap-4 px-6">
        {showAvatar && (
          <Skeleton
            shape="circle"
            {...animProps}
            width={40}
            height={40}
          />
        )}
        <div className="flex-1 space-y-2">
          {Array.from({ length: titleLines }).map((_, i) => (
            <Skeleton
              key={i}
              shape="rectangle"
              size="md"
              {...animProps}
              className={
                titleLines > 1 && i === titleLines - 1
                  ? "w-3/4"
                  : "w-full"
              }
            />
          ))}
        </div>
      </div>

      {/* Description lines */}
      <div className="space-y-2 px-6">
        {Array.from({ length: descriptionLines }).map((_, i) => (
          <Skeleton
            key={i}
            shape="text"
            size="md"
            {...animProps}
            className={i === descriptionLines - 1 ? "w-2/3" : "w-full"}
          />
        ))}
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="flex items-center gap-2 px-6">
          <Skeleton shape="rectangle" rounded="md" {...animProps} width={80} height={32} />
          <Skeleton shape="rectangle" rounded="md" {...animProps} width={80} height={32} />
        </div>
      )}
    </div>
  );
}

// ─── SkeletonTable ────────────────────────────────────────────────────────────

interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
  disableAnimation?: boolean;
  speed?: SkeletonSpeed;
}

function SkeletonTable({
  rows = 5,
  columns = 4,
  disableAnimation = false,
  speed = "normal",
  className,
  ...props
}: SkeletonTableProps) {
  const clampedRows = Math.max(3, Math.min(10, rows));
  const clampedCols = Math.max(2, Math.min(8, columns));
  const animProps = { disableAnimation, speed };

  return (
    <div
      data-slot="skeleton-table"
      className={cn("w-full space-y-3", className)}
      {...props}
    >
      {/* Header row */}
      <div className="flex gap-4">
        {Array.from({ length: clampedCols }).map((_, i) => (
          <Skeleton
            key={i}
            shape="rectangle"
            rounded="sm"
            {...animProps}
            className="flex-1"
            height={16}
          />
        ))}
      </div>

      {/* Data rows */}
      <div className="space-y-2">
        {Array.from({ length: clampedRows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4">
            {Array.from({ length: clampedCols }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                shape="rectangle"
                rounded="sm"
                {...animProps}
                className="flex-1"
                height={14}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SkeletonList ─────────────────────────────────────────────────────────────

interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: number;
  showAvatar?: boolean;
  textLines?: number;
  spacing?: string;
  disableAnimation?: boolean;
  speed?: SkeletonSpeed;
}

function SkeletonList({
  items = 5,
  showAvatar = false,
  textLines = 2,
  spacing = "space-y-4",
  disableAnimation = false,
  speed = "normal",
  className,
  ...props
}: SkeletonListProps) {
  const clampedItems = Math.max(3, Math.min(10, items));
  const clampedTextLines = Math.max(1, Math.min(5, textLines));
  const animProps = { disableAnimation, speed };

  return (
    <div
      data-slot="skeleton-list"
      className={cn(spacing, className)}
      {...props}
    >
      {Array.from({ length: clampedItems }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          {showAvatar && (
            <Skeleton
              shape="circle"
              {...animProps}
              width={40}
              height={40}
            />
          )}
          <div className="flex flex-col flex-1 gap-2">
            {Array.from({ length: clampedTextLines }).map((_, lineIdx) => (
              <Skeleton
                key={lineIdx}
                shape="text"
                size="md"
                {...animProps}
                className={lineIdx === clampedTextLines - 1 && clampedTextLines > 1 ? "w-3/4" : "w-full"}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonList };
