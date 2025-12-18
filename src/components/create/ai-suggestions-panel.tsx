"use client";

import * as React from "react";
import { Sparkles, Check, X, RefreshCw, Lightbulb, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useAISuggestions,
  type AISuggestion as AISuggestionType,
  type GenerateSuggestionsInput,
} from "@/hooks/useContent";

// Export interface for API integration (re-export from hook)
export type AISuggestion = AISuggestionType;

const typeConfig = {
  improvement: { icon: Lightbulb, color: "text-warning", bgColor: "bg-warning/10" },
  addition: { icon: Sparkles, color: "text-primary", bgColor: "bg-primary/10" },
  structure: { icon: Zap, color: "text-success", bgColor: "bg-success/10" },
  seo: { icon: RefreshCw, color: "text-accent-blue", bgColor: "bg-accent-blue/10" },
};

interface AISuggestionItemProps {
  suggestion: AISuggestion;
  onAccept: (suggestion: AISuggestion) => void;
  onReject: (id: string) => void;
  isAccepted?: boolean;
}

function AISuggestionItem({ suggestion, onAccept, onReject, isAccepted }: AISuggestionItemProps) {
  const config = typeConfig[suggestion.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "card-tertiary p-3 space-y-2 transition-all",
        isAccepted && "opacity-50 bg-success/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-1.5 rounded", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm">{suggestion.title}</span>
            <span className="text-xs text-muted-foreground">{suggestion.confidence}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {suggestion.preview}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onReject(suggestion.id)}
          disabled={isAccepted}
        >
          <X className="h-3 w-3 mr-1" />
          Dismiss
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => onAccept(suggestion)}
          disabled={isAccepted}
        >
          <Check className="h-3 w-3 mr-1" />
          {isAccepted ? "Inserted" : "Insert"}
        </Button>
      </div>
    </div>
  );
}

interface AISuggestionsPanelProps {
  onInsertSuggestion?: (content: string) => void;
  onRefresh?: () => Promise<AISuggestion[]>;
  data?: AISuggestion[];
  className?: string;
  /** Input for generating suggestions (used when no data/onRefresh provided) */
  suggestionsInput?: GenerateSuggestionsInput;
}

export function AISuggestionsPanel({
  onInsertSuggestion,
  onRefresh,
  data,
  className,
  suggestionsInput,
}: AISuggestionsPanelProps) {
  // Use hook for API-driven suggestions
  const aiSuggestions = useAISuggestions(suggestionsInput);

  // Local state for callback-driven mode
  const [localSuggestions, setLocalSuggestions] = React.useState<AISuggestion[]>(data || []);
  const [localAcceptedIds, setLocalAcceptedIds] = React.useState<Set<string>>(new Set());
  const [localIsGenerating, setLocalIsGenerating] = React.useState(false);

  // Determine which mode we're in
  const isCallbackMode = !!onRefresh || !!data;

  // Get the effective values based on mode
  const suggestions = isCallbackMode ? localSuggestions : aiSuggestions.suggestions;
  const acceptedIds = isCallbackMode ? localAcceptedIds : aiSuggestions.acceptedIds;
  const isGenerating = isCallbackMode ? localIsGenerating : aiSuggestions.isLoading;

  const handleAccept = (suggestion: AISuggestion) => {
    if (isCallbackMode) {
      setLocalAcceptedIds((prev) => new Set([...prev, suggestion.id]));
    } else {
      aiSuggestions.accept(suggestion.id);
    }
    onInsertSuggestion?.(suggestion.fullContent);
  };

  const handleReject = (id: string) => {
    if (isCallbackMode) {
      setLocalSuggestions((prev) => prev.filter((s) => s.id !== id));
    } else {
      aiSuggestions.dismiss(id);
    }
  };

  const handleRefresh = async () => {
    if (isCallbackMode && onRefresh) {
      setLocalIsGenerating(true);
      try {
        const newSuggestions = await onRefresh();
        setLocalSuggestions(newSuggestions);
        setLocalAcceptedIds(new Set());
      } finally {
        setLocalIsGenerating(false);
      }
    } else {
      await aiSuggestions.refresh();
    }
  };

  const pendingSuggestions = suggestions.filter((s) => !acceptedIds.has(s.id));

  return (
    <div className={cn("card-secondary rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">AI Suggestions</span>
          {pendingSuggestions.length > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
              {pendingSuggestions.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={handleRefresh}
          disabled={isGenerating}
        >
          <RefreshCw className={cn("h-3 w-3 mr-1", isGenerating && "animate-spin")} />
          {isGenerating ? "Generating..." : "Refresh"}
        </Button>
      </div>

      {/* Suggestions List */}
      <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
        {suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <AISuggestionItem
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={handleAccept}
              onReject={handleReject}
              isAccepted={acceptedIds.has(suggestion.id)}
            />
          ))
        ) : (
          <div className="text-center py-6">
            {isGenerating ? (
              <>
                <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">
                  Generating suggestions...
                </p>
              </>
            ) : (
              <>
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No suggestions available
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleRefresh}
                  disabled={isGenerating}
                >
                  Generate Suggestions
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {suggestions.length > 0 && (
        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {acceptedIds.size} of {suggestions.length} suggestions applied
          </p>
        </div>
      )}
    </div>
  );
}
