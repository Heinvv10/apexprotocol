"use client";

import * as React from "react";
import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingBadgeProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  showStars?: boolean;
  showCount?: boolean;
  className?: string;
}

export function RatingBadge({
  rating,
  reviewCount,
  size = "md",
  showStars = true,
  showCount = true,
  className,
}: RatingBadgeProps) {
  const sizeClasses = {
    sm: {
      container: "gap-1",
      text: "text-xs",
      star: "w-3 h-3",
    },
    md: {
      container: "gap-1.5",
      text: "text-sm",
      star: "w-4 h-4",
    },
    lg: {
      container: "gap-2",
      text: "text-base",
      star: "w-5 h-5",
    },
  };

  const styles = sizeClasses[size];

  // Calculate color based on rating
  const getRatingColor = () => {
    if (rating >= 4.5) return "text-success";
    if (rating >= 4.0) return "text-primary";
    if (rating >= 3.0) return "text-warning";
    return "text-error";
  };

  // Render stars
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            className={cn(styles.star, getRatingColor(), "fill-current")}
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <StarHalf key={i} className={cn(styles.star, getRatingColor())} />
        );
      } else {
        stars.push(
          <Star
            key={i}
            className={cn(styles.star, "text-muted-foreground/30")}
          />
        );
      }
    }

    return stars;
  };

  return (
    <div className={cn("flex items-center", styles.container, className)}>
      {showStars && (
        <div className={cn("flex items-center", styles.container)}>
          {renderStars()}
        </div>
      )}
      <span className={cn(styles.text, "font-semibold", getRatingColor())}>
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount !== undefined && (
        <span className={cn(styles.text, "text-muted-foreground")}>
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}

// Compact version for tight spaces
export function RatingBadgeCompact({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  const getColor = () => {
    if (rating >= 4.5) return "bg-success/20 text-success border-success/30";
    if (rating >= 4.0) return "bg-primary/20 text-primary border-primary/30";
    if (rating >= 3.0) return "bg-warning/20 text-warning border-warning/30";
    return "bg-error/20 text-error border-error/30";
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
        getColor(),
        className
      )}
    >
      <Star className="w-3 h-3 fill-current" />
      {rating.toFixed(1)}
    </div>
  );
}
