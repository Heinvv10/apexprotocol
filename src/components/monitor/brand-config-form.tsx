"use client";

import * as React from "react";
import { Plus, X, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BrandConfigFormProps {
  initialData?: {
    brandName: string;
    keywords: string[];
    competitors: string[];
  };
  onSubmit?: (data: {
    brandName: string;
    keywords: string[];
    competitors: string[];
  }) => Promise<void>;
  className?: string;
}

export function BrandConfigForm({
  initialData = {
    brandName: "",
    keywords: [],
    competitors: [],
  },
  onSubmit,
  className,
}: BrandConfigFormProps) {
  const [brandName, setBrandName] = React.useState(initialData.brandName);
  const [keywords, setKeywords] = React.useState<string[]>(initialData.keywords);
  const [competitors, setCompetitors] = React.useState<string[]>(initialData.competitors);
  const [newKeyword, setNewKeyword] = React.useState("");
  const [newCompetitor, setNewCompetitor] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    brandName?: string;
    keywords?: string;
    competitors?: string;
  }>({});

  // Sync state with props when initialData changes (e.g., when API data loads)
  React.useEffect(() => {
    setBrandName(initialData.brandName);
    setKeywords(initialData.keywords);
    setCompetitors(initialData.competitors);
  }, [initialData.brandName, initialData.keywords, initialData.competitors]);

  const addKeyword = () => {
    const trimmed = newKeyword.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setNewKeyword("");
      setErrors((prev) => ({ ...prev, keywords: undefined }));
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const addCompetitor = () => {
    const trimmed = newCompetitor.trim();
    if (trimmed && !competitors.includes(trimmed)) {
      setCompetitors([...competitors, trimmed]);
      setNewCompetitor("");
      setErrors((prev) => ({ ...prev, competitors: undefined }));
    }
  };

  const removeCompetitor = (competitor: string) => {
    setCompetitors(competitors.filter((c) => c !== competitor));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleCompetitorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCompetitor();
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!brandName.trim()) {
      newErrors.brandName = "Brand name is required";
    }

    if (keywords.length === 0) {
      newErrors.keywords = "At least one keyword is required";
    }

    if (competitors.length === 0) {
      newErrors.competitors = "At least one competitor is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock API call with delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onSubmit) {
        await onSubmit({ brandName, keywords, competitors });
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* Brand Name */}
      <div className="space-y-2">
        <label htmlFor="brandName" className="text-sm font-medium">
          Brand Name <span className="text-error">*</span>
        </label>
        <Input
          id="brandName"
          type="text"
          value={brandName}
          onChange={(e) => {
            setBrandName(e.target.value);
            setErrors((prev) => ({ ...prev, brandName: undefined }));
          }}
          placeholder="Enter your brand name"
          className={cn(
            "bg-background/50",
            errors.brandName && "border-error focus:ring-error"
          )}
        />
        {errors.brandName && (
          <p className="text-xs text-error">{errors.brandName}</p>
        )}
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Keywords <span className="text-error">*</span>
        </label>
        <p className="text-xs text-muted-foreground">
          Add keywords related to your brand for monitoring
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={handleKeywordKeyDown}
            placeholder="Add a keyword and press Enter"
            className={cn(
              "bg-background/50",
              errors.keywords && keywords.length === 0 && "border-error"
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addKeyword}
            disabled={!newKeyword.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  className="hover:text-primary/70 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {errors.keywords && keywords.length === 0 && (
          <p className="text-xs text-error">{errors.keywords}</p>
        )}
      </div>

      {/* Competitors */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Competitors <span className="text-error">*</span>
        </label>
        <p className="text-xs text-muted-foreground">
          Add competitor brands to compare mentions against
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            onKeyDown={handleCompetitorKeyDown}
            placeholder="Add a competitor and press Enter"
            className={cn(
              "bg-background/50",
              errors.competitors && competitors.length === 0 && "border-error"
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addCompetitor}
            disabled={!newCompetitor.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {competitors.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {competitors.map((competitor) => (
              <span
                key={competitor}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-accent-pink/10 text-[hsl(var(--accent-pink))] border border-[hsl(var(--accent-pink))]/20"
              >
                {competitor}
                <button
                  type="button"
                  onClick={() => removeCompetitor(competitor)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {errors.competitors && competitors.length === 0 && (
          <p className="text-xs text-error">{errors.competitors}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-4 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="gradient-primary text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>

        {showSuccess && (
          <span className="text-sm text-success animate-in fade-in">
            Configuration saved successfully!
          </span>
        )}
      </div>
    </form>
  );
}
