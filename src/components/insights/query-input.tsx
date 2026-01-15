"use client";

import * as React from "react";
import { Brain, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSelectedBrand } from "@/stores";
import { useInsightsStore, useIsAnalyzing, useAnalysisError, useLoadedHistoryEntry } from "@/stores/insights-store";

// ============================================================================
// Types
// ============================================================================

interface QueryInputProps {
  className?: string;
  onAnalysisStart?: () => void;
  onAnalysisComplete?: () => void;
}

interface PlatformOption {
  key: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "copilot";
  name: string;
  color: string;
  icon: string;
}

// ============================================================================
// Constants
// ============================================================================

const PLATFORMS: PlatformOption[] = [
  { key: "chatgpt", name: "ChatGPT", color: "#10A37F", icon: "🤖" },
  { key: "claude", name: "Claude", color: "#D97757", icon: "🧠" },
  { key: "gemini", name: "Gemini", color: "#4285F4", icon: "✨" },
  { key: "perplexity", name: "Perplexity", color: "#20B8CD", icon: "🔍" },
  { key: "grok", name: "Grok", color: "#000000", icon: "𝕏" },
  { key: "deepseek", name: "DeepSeek", color: "#4F46E5", icon: "🔮" },
  { key: "copilot", name: "Copilot", color: "#0078D4", icon: "🪁" },
];

// ============================================================================
// Component
// ============================================================================

export function QueryInput({
  className,
  onAnalysisStart,
  onAnalysisComplete,
}: QueryInputProps) {
  const selectedBrand = useSelectedBrand();
  const isAnalyzing = useIsAnalyzing();
  const analysisError = useAnalysisError();
  const analyzeQuery = useInsightsStore((state) => state.analyzeQuery);
  const recentQueries = useInsightsStore((state) => state.recentQueries);
  const loadedHistoryEntry = useLoadedHistoryEntry();
  const clearLoadedHistoryEntry = useInsightsStore((state) => state.clearLoadedHistoryEntry);

  // Form state
  const [queryText, setQueryText] = React.useState("");
  const [brandContext, setBrandContext] = React.useState("");
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<
    ("chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "copilot")[]
  >(["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"]);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    queryText?: string;
    platforms?: string;
  }>({});
  const [isRerun, setIsRerun] = React.useState(false);

  // Load historical entry when it changes
  React.useEffect(() => {
    if (loadedHistoryEntry) {
      setQueryText(loadedHistoryEntry.queryText);
      setBrandContext(loadedHistoryEntry.brandContext || "");
      // Map platforms from history - filter to valid current platforms
      const validPlatforms = loadedHistoryEntry.platforms.filter(
        (p): p is typeof PLATFORMS[0]["key"] => PLATFORMS.some(plat => plat.key === p)
      );
      if (validPlatforms.length > 0) {
        setSelectedPlatforms(validPlatforms);
      }
      setIsRerun(true);
      setErrors({});
      // Show advanced options if there was brand context
      if (loadedHistoryEntry.brandContext) {
        setShowAdvanced(true);
      }
    }
  }, [loadedHistoryEntry]);

  // Toggle platform selection
  const togglePlatform = (platformKey: typeof PLATFORMS[0]["key"]) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platformKey)) {
        // Don't allow deselecting if only one platform is selected
        if (prev.length === 1) {
          setErrors((e) => ({ ...e, platforms: "At least one platform must be selected" }));
          return prev;
        }
        setErrors((e) => ({ ...e, platforms: undefined }));
        return prev.filter((p) => p !== platformKey);
      } else {
        setErrors((e) => ({ ...e, platforms: undefined }));
        return [...prev, platformKey];
      }
    });
  };

  // Toggle all platforms
  const toggleAllPlatforms = () => {
    if (selectedPlatforms.length === PLATFORMS.length) {
      // Deselect all except first
      setSelectedPlatforms([PLATFORMS[0].key]);
    } else {
      // Select all
      setSelectedPlatforms(PLATFORMS.map((p) => p.key));
    }
    setErrors((e) => ({ ...e, platforms: undefined }));
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!queryText.trim()) {
      newErrors.queryText = "Please enter a query to analyze";
    } else if (queryText.length > 1000) {
      newErrors.queryText = "Query must be less than 1000 characters";
    }

    if (selectedPlatforms.length === 0) {
      newErrors.platforms = "At least one platform must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBrand) {
      setErrors({ queryText: "Please select a brand first" });
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      onAnalysisStart?.();

      await analyzeQuery({
        queryText: queryText.trim(),
        brandContext: brandContext.trim() || undefined,
        brandId: selectedBrand.id,
        brandName: selectedBrand.name,
        brandKeywords: selectedBrand.keywords,
        platforms: selectedPlatforms,
      });

      onAnalysisComplete?.();
    } catch (error) {
      // Error is handled by the store
    }
  };

  // Load a recent query
  const loadRecentQuery = (query: string) => {
    setQueryText(query);
    setErrors({});
  };

  // Clear form
  const handleClear = () => {
    setQueryText("");
    setBrandContext("");
    setErrors({});
    setIsRerun(false);
    clearLoadedHistoryEntry();
  };

  return (
    <div className={cn("card-primary p-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">
              {isRerun ? "Rerun Analysis" : "Analyze Brand Visibility Across AI Platforms"}
            </span>
            {isRerun && loadedHistoryEntry && (
              <span className="px-2 py-0.5 rounded-full bg-accent-purple/10 text-accent-purple text-xs font-medium">
                From {new Date(loadedHistoryEntry.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {queryText && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRerun ? "Cancel Rerun" : "Clear"}
            </button>
          )}
        </div>

        {/* Query Text Input */}
        <div className="space-y-2">
          <label htmlFor="queryText" className="text-sm font-medium text-foreground">
            Query <span className="text-error">*</span>
          </label>
          <textarea
            id="queryText"
            value={queryText}
            onChange={(e) => {
              setQueryText(e.target.value);
              setErrors((prev) => ({ ...prev, queryText: undefined }));
            }}
            disabled={isAnalyzing}
            placeholder="e.g., What are the best marketing automation tools for small businesses?"
            rows={4}
            className={cn(
              "w-full rounded-lg px-4 py-3 resize-none",
              "bg-muted/50 border text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "transition-all duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              errors.queryText ? "border-error" : "border-border"
            )}
          />
          {errors.queryText && (
            <p className="text-xs text-error">{errors.queryText}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Enter a brand-related query to see how different AI platforms surface your content
            ({queryText.length}/1000)
          </p>
        </div>

        {/* Platform Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Platforms to Analyze <span className="text-error">*</span>
            </label>
            <button
              type="button"
              onClick={toggleAllPlatforms}
              disabled={isAnalyzing}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {selectedPlatforms.length === PLATFORMS.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          {/* Platform Grid - Always Visible */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {PLATFORMS.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.key);
              return (
                <button
                  key={platform.key}
                  type="button"
                  onClick={() => togglePlatform(platform.key)}
                  disabled={isAnalyzing}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-150",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isSelected
                      ? "bg-primary/10 border-primary/50 text-foreground"
                      : "bg-white/5 border-white/15 hover:border-primary/30 hover:bg-white/10 text-gray-300 hover:text-white"
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/50"
                    )}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Platform Icon & Name */}
                  <span className="text-base">{platform.icon}</span>
                  <span className="text-sm font-medium truncate">{platform.name}</span>
                </button>
              );
            })}
          </div>

          {/* Selection Summary */}
          <p className="text-xs text-muted-foreground">
            {selectedPlatforms.length} of {PLATFORMS.length} platforms selected
          </p>

          {errors.platforms && (
            <p className="text-xs text-error">{errors.platforms}</p>
          )}
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={isAnalyzing}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              showAdvanced && "rotate-180"
            )}
          />
          Advanced Options
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-2 pl-6 border-l-2 border-border">
            <label htmlFor="brandContext" className="text-sm font-medium text-foreground">
              Brand Context (Optional)
            </label>
            <textarea
              id="brandContext"
              value={brandContext}
              onChange={(e) => setBrandContext(e.target.value)}
              disabled={isAnalyzing}
              placeholder="e.g., We are a B2B marketing automation platform focusing on small businesses..."
              rows={3}
              className={cn(
                "w-full rounded-lg px-4 py-3 resize-none",
                "bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            <p className="text-xs text-muted-foreground">
              Provide additional context about your brand to help AI platforms understand your
              positioning ({brandContext.length}/2000)
            </p>
          </div>
        )}

        {/* Recent Queries */}
        {recentQueries.length > 0 && !isAnalyzing && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Recent Queries</label>
            <div className="flex flex-wrap gap-2">
              {recentQueries.slice(0, 3).map((query, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => loadRecentQuery(query)}
                  className="px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors border border-border truncate max-w-[300px]"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isAnalyzing || !queryText.trim() || selectedPlatforms.length === 0}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Across {selectedPlatforms.length} Platform
              {selectedPlatforms.length !== 1 ? "s" : ""}...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {isRerun ? "Rerun Analysis" : "Analyze Brand Visibility"}
            </>
          )}
        </Button>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center">
          This will query{" "}
          {selectedPlatforms.length === PLATFORMS.length
            ? "all AI platforms"
            : selectedPlatforms
                .map((key) => PLATFORMS.find((p) => p.key === key)?.name)
                .join(", ")}{" "}
          to analyze how each platform surfaces your brand in responses.
        </p>
      </form>
    </div>
  );
}
