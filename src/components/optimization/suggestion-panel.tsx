/**
 * SuggestionPanel Component
 * Displays AI-generated content optimization suggestions
 */

"use client";

import * as React from "react";
import { X, Sparkles, Check, Copy, RefreshCw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type Suggestion } from "@/lib/ai/content-analyzer";

interface SuggestionPanelProps {
  onClose?: () => void;
  onApply?: (suggestion: Suggestion) => void;
  suggestions?: Suggestion[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const SUGGESTION_TYPE_LABELS: Record<Suggestion["type"], string> = {
  keyword: "Keywords",
  structure: "Structure",
  formatting: "Formatting",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-green-500/10 text-green-500 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  low: "bg-red-500/10 text-red-500 border-red-500/20",
};

function getConfidenceLevel(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.7) return "high";
  if (confidence >= 0.4) return "medium";
  return "low";
}

// Default suggestions when none are provided
const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    id: "1",
    type: "keyword",
    description: "Include your primary keyword in the first 100 words for better SEO.",
    originalText: "",
    suggestedText: "Add target keywords early in content",
    confidence: 0.85,
  },
  {
    id: "2",
    type: "structure",
    description: "Include bullet points or numbered lists to improve scanability.",
    originalText: "",
    suggestedText: "Add structured lists for better readability",
    confidence: 0.72,
  },
  {
    id: "3",
    type: "formatting",
    description: "Add keywords to H2 and H3 headings for better AI visibility.",
    originalText: "",
    suggestedText: "Optimize heading hierarchy",
    confidence: 0.78,
  },
];

export function SuggestionPanel({
  onClose,
  onApply,
  suggestions = DEFAULT_SUGGESTIONS,
  isLoading = false,
  onRefresh,
}: SuggestionPanelProps) {
  const [appliedIds, setAppliedIds] = React.useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleApply = (suggestion: Suggestion) => {
    setAppliedIds((prev) => new Set([...prev, suggestion.id]));
    onApply?.(suggestion);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const appliedCount = appliedIds.size;
  const totalCount = suggestions.length;

  return (
    <Card className="w-80 border-border/50 bg-card/95 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              AI Suggestions
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {totalCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {appliedCount} of {totalCount} suggestions applied
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Analyzing your content...
            </p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Lightbulb className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              No suggestions available. Your content looks great!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-3">
            <div className="space-y-3">
              {suggestions.map((suggestion) => {
                const isApplied = appliedIds.has(suggestion.id);
                const isCopied = copiedId === suggestion.id;
                const confidenceLevel = getConfidenceLevel(suggestion.confidence);

                return (
                  <div
                    key={suggestion.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      isApplied
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/30 border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {SUGGESTION_TYPE_LABELS[suggestion.type]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-xs px-1.5 py-0", CONFIDENCE_COLORS[confidenceLevel])}
                        >
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      {isApplied && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-2">
                      {suggestion.description}
                    </p>

                    {suggestion.originalText && suggestion.suggestedText && (
                      <div className="mt-2 space-y-2">
                        <div className="p-2 rounded bg-red-500/5 border border-red-500/20">
                          <p className="text-xs text-foreground/60 line-clamp-2">
                            <span className="text-red-400 font-medium">Original: </span>
                            {suggestion.originalText}
                          </p>
                        </div>
                        <div className="p-2 rounded bg-green-500/5 border border-green-500/20">
                          <p className="text-xs text-foreground/80 line-clamp-2">
                            <span className="text-green-400 font-medium">Suggested: </span>
                            {suggestion.suggestedText}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      {!isApplied && (
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs flex-1"
                          onClick={() => handleApply(suggestion)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Apply
                        </Button>
                      )}
                      {suggestion.suggestedText && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() =>
                            handleCopy(suggestion.suggestedText, suggestion.id)
                          }
                        >
                          {isCopied ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
