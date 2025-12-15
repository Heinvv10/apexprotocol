"use client";

import * as React from "react";
import { Sparkles, Check, X, RefreshCw, Lightbulb, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Export interface for API integration
export interface AISuggestion {
  id: string;
  type: "improvement" | "addition" | "structure" | "seo";
  title: string;
  preview: string;
  fullContent: string;
  confidence: number;
}

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
}

export function AISuggestionsPanel({ onInsertSuggestion, onRefresh, data, className }: AISuggestionsPanelProps) {
  // TODO: Fetch suggestions from API endpoint
  // const { data: suggestions } = useQuery(['aiSuggestions'], fetchAISuggestions);
  const [suggestions, setSuggestions] = React.useState<AISuggestion[]>(data || []); // Empty array - no mock data
  const [acceptedIds, setAcceptedIds] = React.useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleAccept = (suggestion: AISuggestion) => {
    setAcceptedIds((prev) => new Set([...prev, suggestion.id]));
    onInsertSuggestion?.(suggestion.fullContent);
  };

  const handleReject = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRefresh = async () => {
    setIsGenerating(true);
    try {
      // Call API to generate new suggestions
      if (onRefresh) {
        const newSuggestions = await onRefresh();
        setSuggestions(newSuggestions);
        setAcceptedIds(new Set());
      }
    } finally {
      setIsGenerating(false);
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
