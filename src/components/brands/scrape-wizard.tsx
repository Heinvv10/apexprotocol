/**
 * Brand Scrape Wizard Component
 * Two-step wizard for auto-filling brand information from website
 */

"use client";

import { useState, useCallback } from "react";
import { Globe, Sparkles, Loader2, AlertCircle, Check, X, RefreshCw, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { BrandLogo } from "@/components/brands/brand-logo";
import { useBrandScrape } from "@/hooks/use-brand-scrape";
import { cn } from "@/lib/utils";
import type { ScrapedBrandData } from "@/app/api/brands/scrape/route";

// Design system colors (consistent with brand-detail-view)
const DESIGN = {
  primaryCyan: "#00E5CC",
  accentPurple: "#8B5CF6",
  successGreen: "#22C55E",
  warningYellow: "#F59E0B",
  errorRed: "#EF4444",
  infoBlue: "#3B82F6",
  bgDeep: "#02030A",
  bgElevated: "#0A0D1A",
  bgCard: "#0F1225",
  textPrimary: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  borderDefault: "rgba(255, 255, 255, 0.08)",
  borderAccent: "rgba(0, 229, 204, 0.3)",
};

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
    <div className="space-y-6">
      <div className="text-center">
        <div
          className="inline-flex p-3 rounded-xl mb-4"
          style={{ backgroundColor: `${DESIGN.primaryCyan}20` }}
        >
          <Sparkles className="h-8 w-8" style={{ color: DESIGN.primaryCyan }} />
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: DESIGN.textPrimary }}>
          Add New Brand
        </h3>
        <p className="text-sm" style={{ color: DESIGN.textSecondary }}>
          How would you like to add your brand?
        </p>
      </div>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={onAuto}
          className="flex items-start gap-4 p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: `${DESIGN.primaryCyan}10`,
            border: `1px solid ${DESIGN.primaryCyan}40`,
          }}
        >
          <div
            className="p-3 rounded-xl shrink-0"
            style={{ backgroundColor: `${DESIGN.primaryCyan}20` }}
          >
            <Sparkles className="h-5 w-5" style={{ color: DESIGN.primaryCyan }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium flex items-center gap-2" style={{ color: DESIGN.textPrimary }}>
              Auto-fill from Website
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${DESIGN.primaryCyan}20`,
                  color: DESIGN.primaryCyan,
                }}
              >
                Recommended
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: DESIGN.textSecondary }}>
              Enter your website URL and we&apos;ll automatically extract brand
              information using AI
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onManual}
          className="flex items-start gap-4 p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: DESIGN.bgElevated,
            border: `1px solid ${DESIGN.borderDefault}`,
          }}
        >
          <div
            className="p-3 rounded-xl shrink-0"
            style={{ backgroundColor: `${DESIGN.textMuted}20` }}
          >
            <Pencil className="h-5 w-5" style={{ color: DESIGN.textMuted }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium" style={{ color: DESIGN.textPrimary }}>Add Manually</div>
            <p className="text-sm mt-1" style={{ color: DESIGN.textSecondary }}>
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
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="text-center">
        <div
          className="inline-flex p-3 rounded-xl mb-4"
          style={{ backgroundColor: `${DESIGN.infoBlue}20` }}
        >
          <Globe className="h-8 w-8" style={{ color: DESIGN.infoBlue }} />
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: DESIGN.textPrimary }}>
          Enter Website URL
        </h3>
        <p className="text-sm" style={{ color: DESIGN.textSecondary }}>
          We&apos;ll analyze your website to extract brand information
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="website-url"
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: DESIGN.textSecondary }}
        >
          Website URL
        </Label>
        <Input
          id="website-url"
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className="h-12 text-base"
          style={{
            backgroundColor: DESIGN.bgElevated,
            borderColor: error ? DESIGN.errorRed : DESIGN.borderDefault,
            color: DESIGN.textPrimary,
          }}
          autoFocus
        />
        {error && (
          <p className="text-sm flex items-center gap-1.5" style={{ color: DESIGN.errorRed }}>
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 border-border/50 hover:border-border"
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 gap-2"
          style={{
            backgroundColor: DESIGN.primaryCyan,
            color: DESIGN.bgDeep,
          }}
        >
          <Sparkles className="h-4 w-4" />
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
      <div className="space-y-6">
        <div className="text-center">
          <div
            className="inline-flex p-3 rounded-xl mb-4"
            style={{ backgroundColor: `${DESIGN.errorRed}20` }}
          >
            <AlertCircle className="h-8 w-8" style={{ color: DESIGN.errorRed }} />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: DESIGN.textPrimary }}>
            Analysis Failed
          </h3>
          <p className="text-sm" style={{ color: DESIGN.textSecondary }}>{error}</p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-border/50 hover:border-border"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onManual}
            className="flex-1 border-border/50 hover:border-border"
          >
            Add Manually
          </Button>
          <Button
            onClick={onRetry}
            className="flex-1 gap-2"
            style={{
              backgroundColor: DESIGN.primaryCyan,
              color: DESIGN.bgDeep,
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className="inline-flex p-3 rounded-xl mb-4"
          style={{ backgroundColor: `${DESIGN.primaryCyan}20` }}
        >
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: DESIGN.primaryCyan }} />
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: DESIGN.textPrimary }}>
          Analyzing Website
        </h3>
        <p className="text-sm" style={{ color: DESIGN.textSecondary }}>{message}</p>
      </div>

      <div className="space-y-3">
        <div
          className="h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: DESIGN.borderDefault }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${DESIGN.primaryCyan}, ${DESIGN.accentPurple})`,
            }}
          />
        </div>
        <p className="text-xs text-center" style={{ color: DESIGN.textMuted }}>
          {progress}% complete
        </p>
      </div>

      <Button
        variant="outline"
        onClick={onCancel}
        className="w-full border-border/50 hover:border-border gap-2"
      >
        <X className="h-4 w-4" />
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
      ? DESIGN.successGreen
      : data.confidence.overall >= 40
      ? DESIGN.warningYellow
      : DESIGN.errorRed;

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div
          className="inline-flex p-3 rounded-xl mb-4"
          style={{ backgroundColor: `${DESIGN.successGreen}20` }}
        >
          <Check className="h-8 w-8" style={{ color: DESIGN.successGreen }} />
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: DESIGN.textPrimary }}>
          Analysis Complete
        </h3>
        <p className="text-sm" style={{ color: DESIGN.textSecondary }}>
          Review the extracted information below
        </p>
        <p className="text-sm font-medium mt-2" style={{ color: confidenceColor }}>
          {data.confidence.overall}% confidence
        </p>
      </div>

      <div
        className="space-y-4 p-4 rounded-xl max-h-[50vh] overflow-y-auto"
        style={{
          backgroundColor: DESIGN.bgElevated,
          border: `1px solid ${DESIGN.borderDefault}`,
        }}
      >
        {/* Logo and Name */}
        <div className="flex items-center gap-3">
          <BrandLogo
            logoUrl={data.logoUrl}
            brandName={data.brandName}
            fallbackColor={`${DESIGN.textMuted}20`}
            size="md"
            showFallback={false}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" style={{ color: DESIGN.textPrimary }}>{data.brandName}</p>
            {data.tagline && (
              <p className="text-xs italic" style={{ color: DESIGN.primaryCyan }}>&quot;{data.tagline}&quot;</p>
            )}
            <p className="text-sm" style={{ color: DESIGN.textSecondary }}>{data.industry}</p>
          </div>
          {/* Color Palette */}
          <div className="flex gap-1">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: data.primaryColor, border: `2px solid ${DESIGN.borderDefault}` }}
              title={`Primary: ${data.primaryColor}`}
            />
            {data.secondaryColor && (
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: data.secondaryColor, border: `1px solid ${DESIGN.borderDefault}` }}
                title={`Secondary: ${data.secondaryColor}`}
              />
            )}
            {data.accentColor && (
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: data.accentColor, border: `1px solid ${DESIGN.borderDefault}` }}
                title={`Accent: ${data.accentColor}`}
              />
            )}
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: DESIGN.textMuted }}>Description</p>
            <p className="text-sm line-clamp-3" style={{ color: DESIGN.textSecondary }}>
              {data.description}
            </p>
          </div>
        )}

        {/* Target Audience */}
        {data.targetAudience && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: DESIGN.textMuted }}>Target Audience</p>
            <p className="text-sm line-clamp-2" style={{ color: DESIGN.textSecondary }}>
              {data.targetAudience}
            </p>
          </div>
        )}

        {/* Value Propositions */}
        {data.valuePropositions && data.valuePropositions.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: DESIGN.textMuted }}>Value Propositions</p>
            <ul className="text-sm list-disc list-inside space-y-0.5" style={{ color: DESIGN.textSecondary }}>
              {data.valuePropositions.slice(0, 3).map((prop, i) => (
                <li key={i} className="truncate">{prop}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Keywords - General */}
        {data.keywords.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: DESIGN.textMuted }}>
              Keywords ({data.keywords.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {data.keywords.slice(0, 8).map((keyword) => (
                <span
                  key={keyword}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${DESIGN.primaryCyan}20`, color: DESIGN.primaryCyan }}
                >
                  {keyword}
                </span>
              ))}
              {data.keywords.length > 8 && (
                <span className="text-xs px-2 py-0.5" style={{ color: DESIGN.textMuted }}>
                  +{data.keywords.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* SEO Keywords */}
        {data.seoKeywords && data.seoKeywords.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: DESIGN.textMuted }}>SEO Keywords</p>
            <div className="flex flex-wrap gap-1">
              {data.seoKeywords.slice(0, 5).map((keyword) => (
                <span
                  key={keyword}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${DESIGN.infoBlue}20`, color: DESIGN.infoBlue }}
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
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: DESIGN.textMuted }}>GEO Keywords (AI Optimization)</p>
            <div className="flex flex-wrap gap-1">
              {data.geoKeywords.slice(0, 5).map((keyword) => (
                <span
                  key={keyword}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${DESIGN.successGreen}20`, color: DESIGN.successGreen }}
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
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: DESIGN.textMuted }}>
              Competitors ({data.competitors.length})
            </p>
            <div className="space-y-1">
              {data.competitors.slice(0, 4).map((competitor) => (
                <div
                  key={competitor.name}
                  className="text-xs p-2 rounded"
                  style={{ backgroundColor: `${DESIGN.accentPurple}10` }}
                >
                  <span className="font-medium" style={{ color: DESIGN.textSecondary }}>{competitor.name}</span>
                  <span className="ml-2" style={{ color: DESIGN.textMuted }}>- {competitor.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Color Palette */}
        {data.colorPalette && data.colorPalette.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: DESIGN.textMuted }}>Color Palette</p>
            <div className="flex gap-2">
              {data.colorPalette.map((color, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: color, border: `1px solid ${DESIGN.borderDefault}` }}
                  />
                  <span className="text-[10px] mt-0.5" style={{ color: DESIGN.textMuted }}>{color}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {data.socialLinks && Object.keys(data.socialLinks).length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: DESIGN.textMuted }}>Social Links</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(data.socialLinks).map(([platform]) => (
                <span
                  key={platform}
                  className="text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: `${DESIGN.textMuted}20`, color: DESIGN.textSecondary }}
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          style={{ borderColor: DESIGN.borderDefault }}
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={onRetry}
          style={{ borderColor: DESIGN.borderDefault }}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          onClick={onUse}
          className="flex-1 gap-2"
          style={{
            backgroundColor: DESIGN.primaryCyan,
            color: DESIGN.bgDeep,
          }}
        >
          <Check className="h-4 w-4" />
          Use This Data
        </Button>
      </div>
    </div>
  );
}
