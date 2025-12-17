"use client";

import * as React from "react";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  TrendingUp,
  TrendingDown,
  User,
  Calendar,
  Star,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RatingBadge, RatingBadgeCompact } from "./rating-badge";

// ============================================================================
// Types
// ============================================================================

export interface ReviewData {
  id: string;
  authorName?: string | null;
  authorPhotoUrl?: string | null;
  rating: number;
  text?: string | null;
  sentiment?: "positive" | "neutral" | "negative" | null;
  sentimentScore?: number | null;
  keywords?: string[] | null;
  source?: string | null;
  publishedAt?: string | null;
  ownerResponse?: string | null;
  ownerRespondedAt?: string | null;
  locationName?: string;
}

export interface SentimentStats {
  positive: number;
  neutral: number;
  negative: number;
}

interface ReviewsSummaryProps {
  reviews: ReviewData[];
  sentimentStats?: SentimentStats;
  totalReviews?: number;
  avgRating?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  maxReviews?: number;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(date: string | null | undefined): string {
  if (!date) return "Unknown date";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return d.toLocaleDateString();
}

function getSentimentIcon(sentiment: string | null | undefined) {
  switch (sentiment) {
    case "positive":
      return <ThumbsUp className="w-3.5 h-3.5 text-success" />;
    case "negative":
      return <ThumbsDown className="w-3.5 h-3.5 text-error" />;
    default:
      return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

function getSentimentColor(sentiment: string | null | undefined): string {
  switch (sentiment) {
    case "positive":
      return "text-success";
    case "negative":
      return "text-error";
    default:
      return "text-muted-foreground";
  }
}

function truncateText(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

// ============================================================================
// SentimentBar Component
// ============================================================================

export function SentimentBar({
  stats,
  className,
}: {
  stats: SentimentStats;
  className?: string;
}) {
  const total = stats.positive + stats.neutral + stats.negative;
  if (total === 0) return null;

  const positivePercent = Math.round((stats.positive / total) * 100);
  const neutralPercent = Math.round((stats.neutral / total) * 100);
  const negativePercent = Math.round((stats.negative / total) * 100);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden flex bg-muted/50">
        {positivePercent > 0 && (
          <div
            className="bg-success transition-all"
            style={{ width: `${positivePercent}%` }}
          />
        )}
        {neutralPercent > 0 && (
          <div
            className="bg-muted-foreground/50 transition-all"
            style={{ width: `${neutralPercent}%` }}
          />
        )}
        {negativePercent > 0 && (
          <div
            className="bg-error transition-all"
            style={{ width: `${negativePercent}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-muted-foreground">
            Positive ({stats.positive})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
          <span className="text-muted-foreground">
            Neutral ({stats.neutral})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-error" />
          <span className="text-muted-foreground">
            Negative ({stats.negative})
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SentimentScore Component
// ============================================================================

export function SentimentScore({
  stats,
  className,
}: {
  stats: SentimentStats;
  className?: string;
}) {
  const total = stats.positive + stats.neutral + stats.negative;
  if (total === 0) return null;

  // Calculate score from -100 to 100
  const score = Math.round(
    ((stats.positive - stats.negative) / total) * 100
  );
  const isPositive = score > 0;
  const isNegative = score < 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isPositive ? (
        <TrendingUp className="w-4 h-4 text-success" />
      ) : isNegative ? (
        <TrendingDown className="w-4 h-4 text-error" />
      ) : (
        <Minus className="w-4 h-4 text-muted-foreground" />
      )}
      <span
        className={cn(
          "font-semibold",
          isPositive && "text-success",
          isNegative && "text-error",
          !isPositive && !isNegative && "text-muted-foreground"
        )}
      >
        {isPositive ? "+" : ""}
        {score}
      </span>
      <span className="text-xs text-muted-foreground">sentiment score</span>
    </div>
  );
}

// ============================================================================
// ReviewCard Component
// ============================================================================

export function ReviewCard({
  review,
  showLocation = false,
  className,
}: {
  review: ReviewData;
  showLocation?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card-tertiary p-4 space-y-3",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {review.authorPhotoUrl ? (
            <img
              src={review.authorPhotoUrl}
              alt={review.authorName || "Reviewer"}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-sm text-foreground">
              {review.authorName || "Anonymous"}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(review.publishedAt)}</span>
              {review.source && (
                <>
                  <span>•</span>
                  <span className="capitalize">{review.source}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Rating & Sentiment */}
        <div className="flex items-center gap-2">
          {getSentimentIcon(review.sentiment)}
          <RatingBadgeCompact rating={review.rating} />
        </div>
      </div>

      {/* Location name (if showing multiple locations) */}
      {showLocation && review.locationName && (
        <div className="flex items-center gap-1.5 text-xs text-primary">
          <span>@ {review.locationName}</span>
        </div>
      )}

      {/* Review text */}
      {review.text && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {truncateText(review.text, 300)}
        </p>
      )}

      {/* Keywords */}
      {review.keywords && review.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.keywords.slice(0, 5).map((keyword, i) => (
            <span
              key={i}
              className={cn(
                "px-2 py-0.5 text-xs rounded-full",
                review.sentiment === "positive" &&
                  "bg-success/10 text-success border border-success/20",
                review.sentiment === "negative" &&
                  "bg-error/10 text-error border border-error/20",
                review.sentiment !== "positive" &&
                  review.sentiment !== "negative" &&
                  "bg-muted text-muted-foreground"
              )}
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {/* Owner response */}
      {review.ownerResponse && (
        <div className="pl-4 border-l-2 border-primary/30 mt-3">
          <p className="text-xs font-medium text-primary mb-1">Owner response</p>
          <p className="text-sm text-muted-foreground">
            {truncateText(review.ownerResponse, 200)}
          </p>
          {review.ownerRespondedAt && (
            <p className="text-xs text-muted-foreground/60 mt-1">
              {formatDate(review.ownerRespondedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ReviewsSummary Component
// ============================================================================

export function ReviewsSummary({
  reviews,
  sentimentStats,
  totalReviews,
  avgRating,
  showViewAll = true,
  onViewAll,
  maxReviews = 5,
  className,
}: ReviewsSummaryProps) {
  const displayReviews = reviews.slice(0, maxReviews);
  const hasMore = reviews.length > maxReviews || (totalReviews && totalReviews > reviews.length);

  // Calculate stats if not provided
  const stats = sentimentStats || {
    positive: reviews.filter((r) => r.sentiment === "positive").length,
    neutral: reviews.filter((r) => r.sentiment === "neutral").length,
    negative: reviews.filter((r) => r.sentiment === "negative").length,
  };

  const calculatedAvgRating =
    avgRating ||
    (reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with stats */}
      <div className="card-secondary p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Reviews</h3>
              <p className="text-sm text-muted-foreground">
                {totalReviews || reviews.length} total reviews
              </p>
            </div>
          </div>
          {calculatedAvgRating > 0 && (
            <RatingBadge
              rating={calculatedAvgRating}
              reviewCount={totalReviews || reviews.length}
              size="lg"
            />
          )}
        </div>

        {/* Sentiment breakdown */}
        {(stats.positive + stats.neutral + stats.negative) > 0 && (
          <div className="space-y-3">
            <SentimentBar stats={stats} />
            <SentimentScore stats={stats} />
          </div>
        )}
      </div>

      {/* Reviews list */}
      {displayReviews.length > 0 ? (
        <div className="space-y-3">
          {displayReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showLocation={!!review.locationName}
            />
          ))}
        </div>
      ) : (
        <div className="card-tertiary p-6 text-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No reviews yet</p>
        </div>
      )}

      {/* View all button */}
      {showViewAll && hasMore && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full card-tertiary p-3 flex items-center justify-center gap-2 text-sm text-primary hover:bg-primary/5 transition-colors"
        >
          <span>View all reviews</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// ReviewsSummarySkeleton
// ============================================================================

export function ReviewsSummarySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="card-secondary p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
          <div className="h-8 w-24 bg-muted rounded" />
        </div>
        <div className="h-2 w-full bg-muted rounded-full mb-3" />
        <div className="flex justify-between">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
      </div>

      {[...Array(3)].map((_, i) => (
        <div key={i} className="card-tertiary p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
            <div className="h-6 w-12 bg-muted rounded-full" />
          </div>
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// CompactReviewsList
// ============================================================================

export function CompactReviewsList({
  reviews,
  maxReviews = 3,
  onViewAll,
  className,
}: {
  reviews: ReviewData[];
  maxReviews?: number;
  onViewAll?: () => void;
  className?: string;
}) {
  const displayReviews = reviews.slice(0, maxReviews);

  return (
    <div className={cn("space-y-2", className)}>
      {displayReviews.map((review) => (
        <div
          key={review.id}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
        >
          {getSentimentIcon(review.sentiment)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-foreground truncate">
                {review.authorName || "Anonymous"}
              </span>
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-warning fill-current" />
                <span className="text-xs text-muted-foreground">
                  {review.rating}
                </span>
              </div>
            </div>
            {review.text && (
              <p className="text-xs text-muted-foreground truncate">
                {review.text}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDate(review.publishedAt)}
          </span>
        </div>
      ))}

      {reviews.length > maxReviews && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full text-xs text-primary hover:underline py-2"
        >
          View {reviews.length - maxReviews} more reviews
        </button>
      )}

      {reviews.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No reviews available
        </p>
      )}
    </div>
  );
}
