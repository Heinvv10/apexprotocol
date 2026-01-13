"use client";

import * as React from "react";
import { Brain, Sparkles, Loader2, ChevronDown, Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSelectedBrand } from "@/stores";
import { useInsightsStore, useIsAnalyzing, useAnalysisError } from "@/stores/insights-store";

// ============================================================================
// Types
// ============================================================================

interface QueryInputProps {
  className?: string;
  onAnalysisStart?: () => void;
  onAnalysisComplete?: () => void;
}

interface PlatformOption {
  key: "chatgpt" | "claude" | "gemini" | "perplexity";
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

  // Form state
  const [queryText, setQueryText] = React.useState("");
  const [brandContext, setBrandContext] = React.useState("");
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<
    ("chatgpt" | "claude" | "gemini" | "perplexity")[]
  >(["chatgpt", "claude", "gemini", "perplexity"]);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [showPlatformSelector, setShowPlatformSelector] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    queryText?: string;
    platforms?: string;
  }>({});

  // Refs
  const platformSelectorRef = React.useRef<HTMLDivElement>(null);

  // Close platform selector when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        platformSelectorRef.current &&
        !platformSelectorRef.current.contains(event.target as Node)
      ) {
        setShowPlatformSelector(false);
      }
    };

    if (showPlatformSelector) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPlatformSelector]);

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
  };

  return (
    <div className={cn("card-primary p-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">
              Analyze Brand Visibility Across AI Platforms
            </span>
          </div>
          {queryText && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Platforms to Analyze <span className="text-error">*</span>
          </label>
          <div className="relative" ref={platformSelectorRef}>
            <button
              type="button"
              onClick={() => setShowPlatformSelector(!showPlatformSelector)}
              disabled={isAnalyzing}
              className={cn(
                "w-full h-11 rounded-lg px-4 flex items-center justify-between",
                "bg-muted/50 border text-foreground",
                "hover:bg-muted/70 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                errors.platforms ? "border-error" : "border-border"
              )}
            >
              <span className="flex items-center gap-2 flex-wrap">
                {selectedPlatforms.length === PLATFORMS.length ? (
                  <span className="text-sm">All Platforms ({PLATFORMS.length})</span>
                ) : (
                  <>
                    {selectedPlatforms.map((key) => {
                      const platform = PLATFORMS.find((p) => p.key === key);
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-xs"
                        >
                          <span>{platform?.icon}</span>
                          <span>{platform?.name}</span>
                        </span>
                      );
                    })}
                  </>
                )}
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  showPlatformSelector && "rotate-180"
                )}
              />
            </button>

            {/* Platform Dropdown */}
            {showPlatformSelector && (
              <div className="absolute z-50 w-full mt-2 rounded-lg border border-border bg-card shadow-lg">
                <div className="p-2 space-y-1">
                  {/* Select All Option */}
                  <button
                    type="button"
                    onClick={toggleAllPlatforms}
                    className="w-full px-3 py-2 rounded-md hover:bg-accent transition-colors flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">
                      {selectedPlatforms.length === PLATFORMS.length
                        ? "Deselect All"
                        : "Select All"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedPlatforms.length}/{PLATFORMS.length}
                    </span>
                  </button>

                  <div className="h-px bg-border my-1" />

                  {/* Individual Platforms */}
                  {PLATFORMS.map((platform) => {
                    const isSelected = selectedPlatforms.includes(platform.key);
                    return (
                      <button
                        key={platform.key}
                        type="button"
                        onClick={() => togglePlatform(platform.key)}
                        className={cn(
                          "w-full px-3 py-2 rounded-md transition-colors flex items-center gap-3 text-sm",
                          isSelected
                            ? "bg-primary/10 text-foreground"
                            : "hover:bg-accent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Bot className="w-4 h-4" style={{ color: platform.color }} />
                        <span className="flex-1 text-left">{platform.name}</span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-primary-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
              Analyze Brand Visibility
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
