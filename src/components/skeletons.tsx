"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Base skeleton component with pulse animation
function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted/30 rounded",
        className
      )}
    />
  );
}

// Circular skeleton for GEO Score gauge
export function GeoScoreGaugeSkeleton({ size = 200 }: { size?: number }) {
  return (
    <div className="card-primary flex flex-col items-center justify-center p-6">
      {/* Circular gauge skeleton */}
      <div
        className="relative animate-pulse"
        style={{ width: size, height: size }}
      >
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full border-[12px] border-muted/20"
        />
        {/* Inner circle */}
        <div
          className="absolute inset-6 rounded-full bg-muted/20"
        />
        {/* Center score placeholder */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <SkeletonPulse className="w-16 h-10 rounded-lg mb-2" />
          <SkeletonPulse className="w-12 h-4 rounded" />
        </div>
      </div>

      {/* Label below gauge */}
      <SkeletonPulse className="w-24 h-4 mt-4 rounded" />
    </div>
  );
}

// Bar skeleton for progress indicators / sub-scores
export function SubScoresSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="card-secondary space-y-4">
      {/* Section title */}
      <SkeletonPulse className="w-32 h-5 rounded" />

      {/* Progress bars */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between items-center">
            <SkeletonPulse className="w-24 h-4 rounded" />
            <SkeletonPulse className="w-8 h-4 rounded" />
          </div>
          <SkeletonPulse className="w-full h-2 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Card skeleton for recommendations
export function RecommendationCardSkeleton() {
  return (
    <div className="card-secondary p-4">
      <div className="flex items-start gap-4">
        {/* Icon placeholder */}
        <SkeletonPulse className="w-10 h-10 rounded-lg flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="w-3/4 h-5 rounded" />
          <SkeletonPulse className="w-full h-4 rounded" />
          <SkeletonPulse className="w-2/3 h-4 rounded" />
        </div>

        {/* Badge placeholder */}
        <SkeletonPulse className="w-16 h-6 rounded-full flex-shrink-0" />
      </div>

      {/* Action button */}
      <div className="mt-4 flex justify-end">
        <SkeletonPulse className="w-24 h-8 rounded-lg" />
      </div>
    </div>
  );
}

// Activity item skeleton
export function ActivityItemSkeleton() {
  return (
    <div className="card-tertiary flex items-center gap-3 p-3">
      {/* Avatar */}
      <SkeletonPulse className="w-8 h-8 rounded-full flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 space-y-2">
        <SkeletonPulse className="w-32 h-4 rounded" />
        <SkeletonPulse className="w-20 h-3 rounded" />
      </div>

      {/* Timestamp */}
      <SkeletonPulse className="w-12 h-3 rounded" />
    </div>
  );
}

// Stat card skeleton
export function StatCardSkeleton() {
  return (
    <div className="card-tertiary p-4">
      <div className="flex items-center justify-between mb-3">
        <SkeletonPulse className="w-8 h-8 rounded-lg" />
        <SkeletonPulse className="w-12 h-5 rounded-full" />
      </div>
      <SkeletonPulse className="w-16 h-8 rounded mb-2" />
      <SkeletonPulse className="w-24 h-4 rounded" />
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="card-secondary">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <SkeletonPulse className="w-32 h-5 rounded" />
        <SkeletonPulse className="w-24 h-8 rounded-lg" />
      </div>

      {/* Chart area */}
      <div
        className="w-full rounded-lg bg-muted/10 animate-pulse relative overflow-hidden"
        style={{ height }}
      >
        {/* Fake chart lines */}
        <div className="absolute inset-0 flex items-end justify-around px-4 pb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-4 bg-muted/20 rounded-t"
              style={{
                height: `${Math.random() * 60 + 20}%`,
              }}
            />
          ))}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-full h-px bg-muted/10" />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <SkeletonPulse className="w-16 h-4 rounded" />
        <SkeletonPulse className="w-16 h-4 rounded" />
        <SkeletonPulse className="w-16 h-4 rounded" />
      </div>
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card-secondary">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border/30">
        <SkeletonPulse className="w-1/4 h-4 rounded" />
        <SkeletonPulse className="w-1/4 h-4 rounded" />
        <SkeletonPulse className="w-1/4 h-4 rounded" />
        <SkeletonPulse className="w-1/4 h-4 rounded" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border-b border-border/20 last:border-0"
        >
          <SkeletonPulse className="w-1/4 h-4 rounded" />
          <SkeletonPulse className="w-1/4 h-4 rounded" />
          <SkeletonPulse className="w-1/4 h-4 rounded" />
          <SkeletonPulse className="w-1/4 h-4 rounded" />
        </div>
      ))}
    </div>
  );
}

// Dashboard page skeleton (full page loading state)
export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonPulse className="w-48 h-7 rounded" />
          <SkeletonPulse className="w-32 h-4 rounded" />
        </div>
        <SkeletonPulse className="w-32 h-10 rounded-lg" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GEO Score */}
        <div className="lg:col-span-1">
          <GeoScoreGaugeSkeleton />
        </div>

        {/* Sub-scores */}
        <div className="lg:col-span-2">
          <SubScoresSkeleton />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <SkeletonPulse className="w-40 h-6 rounded" />
        <RecommendationCardSkeleton />
        <RecommendationCardSkeleton />
        <RecommendationCardSkeleton />
      </div>
    </div>
  );
}

// Inline loading indicator
export function LoadingSpinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size],
        className
      )}
    />
  );
}

// Full page loading state
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
