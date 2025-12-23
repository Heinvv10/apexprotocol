"use client";

import * as React from "react";
import { Star, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateQueries } from "@/lib/query/client";

// =============================================================================
// Types
// =============================================================================

export interface FeedbackDialogProps {
  recommendationId: string;
  recommendationTitle?: string;
  existingRating?: number | null;
  existingFeedback?: string | null;
  trigger?: React.ReactNode;
  onFeedbackSubmitted?: () => void;
  className?: string;
}

interface SubmitFeedbackPayload {
  recommendationId: string;
  rating: number;
  feedback?: string;
}

// =============================================================================
// API Function
// =============================================================================

async function submitFeedback(payload: SubmitFeedbackPayload) {
  const response = await fetch("/api/recommendations/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "submit",
      recommendationId: payload.recommendationId,
      rating: payload.rating,
      feedback: payload.feedback || undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit feedback");
  }

  return response.json();
}

// =============================================================================
// Hook for Feedback Submission
// =============================================================================

function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      invalidateQueries.recommendations(queryClient);
    },
  });
}

// =============================================================================
// Star Rating Component
// =============================================================================

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

function StarRating({ value, onChange, disabled }: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const displayValue = hoverValue ?? value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = displayValue >= star;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            disabled={disabled}
            className={cn(
              "p-1 rounded-md transition-all duration-150",
              "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => onChange(star)}
            onMouseEnter={() => !disabled && setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                isActive
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function FeedbackDialog({
  recommendationId,
  recommendationTitle,
  existingRating,
  existingFeedback,
  trigger,
  onFeedbackSubmitted,
  className,
}: FeedbackDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState<number>(existingRating ?? 0);
  const [feedback, setFeedback] = React.useState(existingFeedback ?? "");

  const submitFeedbackMutation = useSubmitFeedback();

  const hasExistingFeedback = existingRating != null && existingRating > 0;

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setRating(existingRating ?? 0);
      setFeedback(existingFeedback ?? "");
    }
  }, [open, existingRating, existingFeedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) return;

    try {
      await submitFeedbackMutation.mutateAsync({
        recommendationId,
        rating,
        feedback: feedback.trim() || undefined,
      });
      setOpen(false);
      onFeedbackSubmitted?.();
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleSkip = () => {
    setOpen(false);
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={cn("gap-1", className)}
    >
      <MessageSquare className="h-3 w-3" />
      {hasExistingFeedback ? "Edit Feedback" : "Provide Feedback"}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? defaultTrigger}
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {hasExistingFeedback ? "Edit Feedback" : "Provide Feedback"}
            </DialogTitle>
            <DialogDescription>
              {recommendationTitle
                ? `Rate the effectiveness of "${recommendationTitle}" and share your experience.`
                : "Rate the effectiveness of this recommendation and share your experience."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* Star Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Rating <span className="text-destructive">*</span>
              </label>
              <StarRating
                value={rating}
                onChange={setRating}
                disabled={submitFeedbackMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                {rating === 0 && "Select a rating from 1 to 5 stars"}
                {rating === 1 && "Not helpful at all"}
                {rating === 2 && "Slightly helpful"}
                {rating === 3 && "Moderately helpful"}
                {rating === 4 && "Very helpful"}
                {rating === 5 && "Extremely helpful"}
              </p>
            </div>

            {/* Feedback Text */}
            <div className="space-y-2">
              <label htmlFor="feedback-text" className="text-sm font-medium text-foreground">
                Feedback <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="feedback-text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts about this recommendation... What worked well? What could be improved?"
                rows={4}
                disabled={submitFeedbackMutation.isPending}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Your feedback helps improve future recommendations.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={submitFeedbackMutation.isPending}
            >
              Skip
            </Button>
            <Button
              type="submit"
              disabled={submitFeedbackMutation.isPending || rating === 0}
            >
              {submitFeedbackMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </DialogFooter>

          {/* Error display */}
          {submitFeedbackMutation.isError && (
            <p className="mt-4 text-sm text-destructive text-center">
              {submitFeedbackMutation.error instanceof Error
                ? submitFeedbackMutation.error.message
                : "Failed to submit feedback"}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default FeedbackDialog;
