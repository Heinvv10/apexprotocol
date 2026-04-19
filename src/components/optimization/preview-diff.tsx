"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import type { Suggestion } from "@/lib/ai/content-analyzer";

// =============================================================================
// Types
// =============================================================================

interface PreviewDiffProps {
  suggestion?: Suggestion;
  originalText?: string;
  suggestedText?: string;
  title?: string;
  defaultExpanded?: boolean;
  className?: string;
  mode?: "inline" | "side-by-side";
}

interface DiffPart {
  value: string;
  type: "added" | "removed" | "unchanged";
}

// =============================================================================
// Diff Algorithm
// =============================================================================

/**
 * Simple word-level diff algorithm
 * Compares two strings and identifies added, removed, and unchanged words
 */
function computeWordDiff(original: string, suggested: string): DiffPart[] {
  const originalWords = original.split(/(\s+)/);
  const suggestedWords = suggested.split(/(\s+)/);

  const diffs: DiffPart[] = [];

  // Simple approach: find common prefix and suffix
  let i = 0;
  const j = 0;

  // Add common prefix
  while (
    i < originalWords.length &&
    i < suggestedWords.length &&
    originalWords[i] === suggestedWords[i]
  ) {
    diffs.push({ value: originalWords[i], type: "unchanged" });
    i++;
  }

  // Find where the strings diverge
  const originalRemaining = originalWords.slice(i);
  const suggestedRemaining = suggestedWords.slice(i);

  // Find common suffix
  let originalEnd = originalRemaining.length;
  let suggestedEnd = suggestedRemaining.length;

  while (
    originalEnd > 0 &&
    suggestedEnd > 0 &&
    originalRemaining[originalEnd - 1] ===
      suggestedRemaining[suggestedEnd - 1]
  ) {
    originalEnd--;
    suggestedEnd--;
  }

  // Add removed words
  for (let k = 0; k < originalEnd; k++) {
    diffs.push({ value: originalRemaining[k], type: "removed" });
  }

  // Add added words
  for (let k = 0; k < suggestedEnd; k++) {
    diffs.push({ value: suggestedRemaining[k], type: "added" });
  }

  // Add common suffix
  for (let k = originalEnd; k < originalRemaining.length; k++) {
    diffs.push({ value: originalRemaining[k], type: "unchanged" });
  }

  return diffs;
}

// =============================================================================
// Diff Display Components
// =============================================================================

function DiffInline({ diffs }: { diffs: DiffPart[] }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
        Changes (inline view)
      </div>
      <div className="p-3 bg-muted/30 rounded border text-sm leading-relaxed">
        {diffs.map((part, index) => {
          if (part.type === "removed") {
            return (
              <span
                key={index}
                className="bg-destructive/20 text-destructive line-through decoration-2 px-0.5"
              >
                {part.value}
              </span>
            );
          }
          if (part.type === "added") {
            return (
              <span
                key={index}
                className="bg-success/20 text-success font-medium px-0.5"
              >
                {part.value}
              </span>
            );
          }
          return <span key={index}>{part.value}</span>;
        })}
      </div>
    </div>
  );
}

function DiffSideBySide({
  originalText,
  suggestedText,
}: {
  originalText: string;
  suggestedText: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
        Side-by-side comparison
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3">
        {/* Original Text */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
            Original
          </div>
          <div className="p-3 bg-destructive/10 text-destructive rounded border border-destructive/20 text-sm leading-relaxed min-h-[60px]">
            {originalText}
          </div>
        </div>

        {/* Arrow separator */}
        <div className="flex items-center justify-center md:mt-6">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Suggested Text */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
            Suggested
          </div>
          <div className="p-3 bg-success/10 text-success rounded border border-success/20 text-sm leading-relaxed min-h-[60px]">
            {suggestedText}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PreviewDiff({
  suggestion,
  originalText: originalTextProp,
  suggestedText: suggestedTextProp,
  title = "Preview Changes",
  defaultExpanded = false,
  className,
  mode = "inline",
}: PreviewDiffProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  // Get text from either suggestion prop or individual text props
  const originalText = suggestion?.originalText || originalTextProp || "";
  const suggestedText = suggestion?.suggestedText || suggestedTextProp || "";

  // Compute diff only when expanded and mode is inline. Must run before
  // any early return so hook-call order stays stable across renders.
  const diffs = React.useMemo(() => {
    if (!isExpanded || mode !== "inline") return [];
    return computeWordDiff(originalText, suggestedText);
  }, [isExpanded, mode, originalText, suggestedText]);

  // Validate we have both texts
  if (!originalText || !suggestedText) {
    return null;
  }

  // Check if there are any changes
  const hasChanges = originalText !== suggestedText;

  if (!hasChanges) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No changes detected
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors group"
      >
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
        ) : (
          <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
        )}
        {title}
        <Badge variant="outline" className="ml-1">
          {mode === "inline" ? "Inline" : "Side-by-side"}
        </Badge>
      </button>

      {/* Expanded Diff View */}
      {isExpanded && (
        <div className="pl-6 animate-in slide-in-from-top-2 duration-200">
          {mode === "inline" ? (
            <DiffInline diffs={diffs} />
          ) : (
            <DiffSideBySide
              originalText={originalText}
              suggestedText={suggestedText}
            />
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Card Variant
// =============================================================================

interface PreviewDiffCardProps extends PreviewDiffProps {
  onModeChange?: (mode: "inline" | "side-by-side") => void;
}

export function PreviewDiffCard({
  suggestion,
  originalText: originalTextProp,
  suggestedText: suggestedTextProp,
  title = "Preview Changes",
  defaultExpanded = true,
  className,
  mode: initialMode = "inline",
  onModeChange,
}: PreviewDiffCardProps) {
  const [mode, setMode] = React.useState<"inline" | "side-by-side">(
    initialMode
  );

  // Get text from either suggestion prop or individual text props
  const originalText = suggestion?.originalText || originalTextProp || "";
  const suggestedText = suggestion?.suggestedText || suggestedTextProp || "";

  // Compute diff only when mode is inline. Must run before any early
  // return so hook-call order stays stable across renders.
  const diffs = React.useMemo(() => {
    if (mode !== "inline") return [];
    return computeWordDiff(originalText, suggestedText);
  }, [mode, originalText, suggestedText]);

  // Validate we have both texts
  if (!originalText || !suggestedText) {
    return null;
  }

  // Check if there are any changes
  const hasChanges = originalText !== suggestedText;

  if (!hasChanges) {
    return (
      <Card className={cn("", className)}>
        <CardContent>
          <div className="text-sm text-muted-foreground">No changes detected</div>
        </CardContent>
      </Card>
    );
  }

  const handleModeToggle = () => {
    const newMode = mode === "inline" ? "side-by-side" : "inline";
    setMode(newMode);
    onModeChange?.(newMode);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-base">{title}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleModeToggle}
            className="text-xs"
          >
            {mode === "inline" ? "Side-by-side" : "Inline"} view
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mode === "inline" ? (
          <DiffInline diffs={diffs} />
        ) : (
          <DiffSideBySide
            originalText={originalText}
            suggestedText={suggestedText}
          />
        )}
      </CardContent>
    </Card>
  );
}
