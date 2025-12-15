/**
 * Brand Scrape Wizard Component
 * Two-step wizard for auto-filling brand information from website
 */

"use client";

import { useState, useCallback } from "react";
import { Globe, Sparkles, Loader2, AlertCircle, Check, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useBrandScrape } from "@/hooks/use-brand-scrape";
import { cn } from "@/lib/utils";
import type { ScrapedBrandData } from "@/app/api/brands/scrape/route";

// Wizard step type
type WizardStep = "choose" | "url" | "loading" | "preview";

// Props for the wizard
export interface ScrapeWizardProps {
  onComplete: (data: ScrapedBrandData) => void;
  onManual: () => void;
  onCancel: () => void;
}

/**
 * Brand Scrape Wizard Component
 */
export function ScrapeWizard({ onComplete, onManual, onCancel }: ScrapeWizardProps) {
  const [step, setStep] = useState<WizardStep>("choose");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  const {
    state,
    startScrape,
    cancelScrape,
    reset,
    isLoading,
    isComplete,
    isError,
  } = useBrandScrape();

  /**
   * Handle URL submission
   */
  const handleSubmitUrl = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate URL
      if (!url.trim()) {
        setUrlError("Please enter a website URL");
        return;
      }

      // Basic URL validation
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      try {
        new URL(normalizedUrl);
      } catch {
        setUrlError("Please enter a valid URL");
        return;
      }

      setUrlError("");
      setStep("loading");
      await startScrape(normalizedUrl);
    },
    [url, startScrape]
  );

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    reset();
    setStep("url");
  }, [reset]);

  /**
   * Handle using the scraped data
   */
  const handleUseData = useCallback(() => {
    if (state.data) {
      onComplete(state.data);
    }
  }, [state.data, onComplete]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    cancelScrape();
    onCancel();
  }, [cancelScrape, onCancel]);

  // Update step based on state changes
  if (step === "loading" && isComplete) {
    setStep("preview");
  }

  // Render step content
  const renderContent = () => {
    switch (step) {
      case "choose":
        return <ChooseStep onAuto={() => setStep("url")} onManual={onManual} />;

      case "url":
        return (
          <UrlStep
            url={url}
            error={urlError}
            onUrlChange={setUrl}
            onSubmit={handleSubmitUrl}
            onBack={() => setStep("choose")}
          />
        );

      case "loading":
        return (
          <LoadingStep
            progress={state.progress}
            message={state.progressMessage}
            error={isError ? state.error : null}
            onRetry={handleRetry}
            onManual={onManual}
            onCancel={handleCancel}
          />
        );

      case "preview":
        return (
          <PreviewStep
            data={state.data}
            onUse={handleUseData}
            onRetry={handleRetry}
            onCancel={handleCancel}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {renderContent()}
    </div>
  );
}

/**
 * Step 1: Choose auto or manual
 */
function ChooseStep({
  onAuto,
  onManual,
}: {
  onAuto: () => void;
  onManual: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Add New Brand</h3>
        <p className="text-sm text-muted-foreground">
          How would you like to add your brand?
        </p>
      </div>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={onAuto}
          className={cn(
            "flex items-start gap-4 p-4 rounded-lg border text-left transition-all",
            "bg-primary/5 border-primary/30 hover:bg-primary/10 hover:border-primary/50",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          )}
        >
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-white flex items-center gap-2">
              Auto-fill from Website
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                Recommended
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your website URL and we&apos;ll automatically extract brand
              information using AI
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onManual}
          className={cn(
            "flex items-start gap-4 p-4 rounded-lg border text-left transition-all",
            "bg-muted/5 border-muted/30 hover:bg-muted/10 hover:border-muted/50",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          )}
        >
          <div className="p-2 rounded-lg bg-muted/20 text-muted-foreground">
            <Globe className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-white">Add Manually</div>
            <p className="text-sm text-muted-foreground mt-1">
              Fill in your brand details manually without auto-detection
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

/**
 * Step 2: Enter URL
 */
function UrlStep({
  url,
  error,
  onUrlChange,
  onSubmit,
  onBack,
}: {
  url: string;
  error: string;
  onUrlChange: (url: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-3">
          <Globe className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Enter Website URL
        </h3>
        <p className="text-sm text-muted-foreground">
          We&apos;ll analyze your website to extract brand information
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website-url" className="text-sm font-medium text-foreground">Website URL</Label>
        <Input
          id="website-url"
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className={cn(
            "bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-500",
            error && "border-destructive"
          )}
          autoFocus
        />
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1">
          <Sparkles className="h-4 w-4 mr-2" />
          Analyze Website
        </Button>
      </div>
    </form>
  );
}

/**
 * Step 3: Loading state
 */
function LoadingStep({
  progress,
  message,
  error,
  onRetry,
  onManual,
  onCancel,
}: {
  progress: number;
  message: string;
  error: string | null;
  onRetry: () => void;
  onManual: () => void;
  onCancel: () => void;
}) {
  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-destructive/10 text-destructive mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Analysis Failed
          </h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button variant="outline" onClick={onManual} className="flex-1">
            Add Manually
          </Button>
          <Button onClick={onRetry} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-3">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Analyzing Website
        </h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {progress}% complete
        </p>
      </div>

      <Button variant="outline" onClick={onCancel} className="w-full">
        <X className="h-4 w-4 mr-2" />
        Cancel
      </Button>
    </div>
  );
}

/**
 * Step 4: Preview extracted data
 */
function PreviewStep({
  data,
  onUse,
  onRetry,
  onCancel,
}: {
  data: ScrapedBrandData | null;
  onUse: () => void;
  onRetry: () => void;
  onCancel: () => void;
}) {
  if (!data) {
    return null;
  }

  const confidenceColor =
    data.confidence.overall >= 70
      ? "text-success"
      : data.confidence.overall >= 40
      ? "text-warning"
      : "text-destructive";

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="inline-flex p-3 rounded-full bg-success/10 text-success mb-3">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">
          Analysis Complete
        </h3>
        <p className="text-sm text-muted-foreground">
          Review the extracted information below
        </p>
        <p className={cn("text-xs mt-1", confidenceColor)}>
          {data.confidence.overall}% confidence
        </p>
      </div>

      <div className="space-y-3 p-4 rounded-lg bg-muted/10 border border-muted/20 max-h-[60vh] overflow-y-auto">
        {/* Logo and Name */}
        <div className="flex items-center gap-3">
          {data.logoUrl ? (
            <img
              src={data.logoUrl}
              alt={data.brandName}
              className="h-12 w-12 rounded-lg object-contain bg-white p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-muted/20 flex items-center justify-center">
              <Globe className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{data.brandName}</p>
            {data.tagline && (
              <p className="text-xs text-primary italic">"{data.tagline}"</p>
            )}
            <p className="text-sm text-muted-foreground">{data.industry}</p>
          </div>
          {/* Color Palette */}
          <div className="flex gap-1">
            <div
              className="w-6 h-6 rounded-full border-2 border-white/20"
              style={{ backgroundColor: data.primaryColor }}
              title={`Primary: ${data.primaryColor}`}
            />
            {data.secondaryColor && (
              <div
                className="w-5 h-5 rounded-full border border-white/10"
                style={{ backgroundColor: data.secondaryColor }}
                title={`Secondary: ${data.secondaryColor}`}
              />
            )}
            {data.accentColor && (
              <div
                className="w-4 h-4 rounded-full border border-white/10"
                style={{ backgroundColor: data.accentColor }}
                title={`Accent: ${data.accentColor}`}
              />
            )}
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-zinc-300 line-clamp-3">
              {data.description}
            </p>
          </div>
        )}

        {/* Target Audience */}
        {data.targetAudience && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Target Audience</p>
            <p className="text-sm text-zinc-300 line-clamp-2">
              {data.targetAudience}
            </p>
          </div>
        )}

        {/* Value Propositions */}
        {data.valuePropositions && data.valuePropositions.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Value Propositions</p>
            <ul className="text-sm text-zinc-300 list-disc list-inside space-y-0.5">
              {data.valuePropositions.slice(0, 3).map((prop, i) => (
                <li key={i} className="truncate">{prop}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Keywords - General */}
        {data.keywords.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Keywords ({data.keywords.length})</p>
            <div className="flex flex-wrap gap-1">
              {data.keywords.slice(0, 8).map((keyword) => (
                <span
                  key={keyword}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary"
                >
                  {keyword}
                </span>
              ))}
              {data.keywords.length > 8 && (
                <span className="text-xs px-2 py-0.5 text-muted-foreground">
                  +{data.keywords.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* SEO Keywords */}
        {data.seoKeywords && data.seoKeywords.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">SEO Keywords</p>
            <div className="flex flex-wrap gap-1">
              {data.seoKeywords.slice(0, 5).map((keyword) => (
                <span
                  key={keyword}
                  className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* GEO Keywords */}
        {data.geoKeywords && data.geoKeywords.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">GEO Keywords (AI Optimization)</p>
            <div className="flex flex-wrap gap-1">
              {data.geoKeywords.slice(0, 5).map((keyword) => (
                <span
                  key={keyword}
                  className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Competitors */}
        {data.competitors.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Competitors ({data.competitors.length})
            </p>
            <div className="space-y-1">
              {data.competitors.slice(0, 4).map((competitor) => (
                <div
                  key={competitor.name}
                  className="text-xs p-2 rounded bg-muted/20"
                >
                  <span className="font-medium text-zinc-300">{competitor.name}</span>
                  <span className="text-muted-foreground ml-2">- {competitor.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Color Palette */}
        {data.colorPalette && data.colorPalette.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Color Palette</p>
            <div className="flex gap-2">
              {data.colorPalette.map((color, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-lg border border-white/20"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5">{color}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {data.socialLinks && Object.keys(data.socialLinks).length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Social Links</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(data.socialLinks).map(([platform]) => (
                <span
                  key={platform}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted/30 text-zinc-300 capitalize"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button onClick={onUse} className="flex-1">
          <Check className="h-4 w-4 mr-2" />
          Use This Data
        </Button>
      </div>
    </div>
  );
}
