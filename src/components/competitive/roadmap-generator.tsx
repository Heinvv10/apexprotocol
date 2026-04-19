"use client";

import * as React from "react";
import { Loader2, Sparkles, Target, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RoadmapGeneratorProps {
  brandId: string;
  competitors?: Array<{ name: string; unifiedScore: number }>;
  currentScore: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated?: (roadmapId: string) => void;
}

type TargetPosition = "leader" | "top3" | "competitive";

// Target position options
const TARGET_OPTIONS: Array<{
  value: TargetPosition;
  label: string;
  description: string;
  icon: typeof Trophy;
  color: string;
}> = [
  {
    value: "leader",
    label: "Industry Leader",
    description: "Become the #1 in your industry",
    icon: Trophy,
    color: "text-amber-400",
  },
  {
    value: "top3",
    label: "Top 3",
    description: "Reach the top tier of competitors",
    icon: Target,
    color: "text-primary",
  },
  {
    value: "competitive",
    label: "Competitive",
    description: "Match the industry average",
    icon: Users,
    color: "text-purple-400",
  },
];

// Focus areas
const FOCUS_AREAS = [
  { key: "geo", label: "GEO", description: "AI Visibility" },
  { key: "seo", label: "SEO", description: "Technical SEO" },
  { key: "aeo", label: "AEO", description: "Answer Engine" },
  { key: "smo", label: "SMO", description: "Social Media" },
  { key: "ppo", label: "PPO", description: "Personal Brand" },
];

export function RoadmapGenerator({
  brandId,
  competitors = [],
  currentScore,
  open,
  onOpenChange,
  onGenerated,
}: RoadmapGeneratorProps) {
  const [step, setStep] = React.useState(1);
  const [targetPosition, setTargetPosition] = React.useState<TargetPosition>("competitive");
  const [targetCompetitor, setTargetCompetitor] = React.useState<string | null>(null);
  const [focusAreas, setFocusAreas] = React.useState<string[]>([]);
  const [aiEnhanced, setAiEnhanced] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setStep(1);
      setTargetPosition("competitive");
      setTargetCompetitor(null);
      setFocusAreas([]);
      setAiEnhanced(false);
      setError(null);
    }
  }, [open]);

  // Toggle focus area
  const toggleFocusArea = (area: string) => {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  // Generate roadmap
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/competitive/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          targetPosition,
          targetCompetitor,
          focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
          aiEnhanced,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate roadmap");
      }

      const data = await response.json();
      onGenerated?.(data.roadmap.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate Improvement Roadmap
          </DialogTitle>
          <DialogDescription>
            Create a personalized action plan to improve your competitive position.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  s === step ? "bg-primary" : s < step ? "bg-primary/50" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Step 1: Choose target */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">
                What&apos;s your goal?
              </h4>
              <div className="space-y-2">
                {TARGET_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTargetPosition(option.value)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-colors",
                        targetPosition === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border/30 hover:border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn("w-5 h-5", option.color)} />
                        <div>
                          <div className="font-medium text-foreground">
                            {option.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Target specific competitor */}
              {competitors.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-foreground">
                    Or target a specific competitor
                  </label>
                  <select
                    value={targetCompetitor || ""}
                    onChange={(e) => setTargetCompetitor(e.target.value || null)}
                    className="w-full mt-2 h-10 px-3 rounded-lg border border-border/30 bg-muted/30 text-sm"
                  >
                    <option value="">No specific competitor</option>
                    {competitors.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} (Score: {c.unifiedScore})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Focus areas */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">
                Focus on specific areas (optional)
              </h4>
              <p className="text-xs text-muted-foreground">
                Leave empty to get recommendations for all areas
              </p>
              <div className="grid grid-cols-2 gap-2">
                {FOCUS_AREAS.map((area) => (
                  <button
                    key={area.key}
                    onClick={() => toggleFocusArea(area.key)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-colors",
                      focusAreas.includes(area.key)
                        ? "border-primary bg-primary/10"
                        : "border-border/30 hover:border-border"
                    )}
                  >
                    <div className="font-medium text-foreground">{area.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {area.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: AI enhancement */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">
                Enhance with AI?
              </h4>
              <button
                onClick={() => setAiEnhanced(!aiEnhanced)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-colors",
                  aiEnhanced
                    ? "border-primary bg-primary/10"
                    : "border-border/30 hover:border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <Sparkles
                    className={cn(
                      "w-6 h-6",
                      aiEnhanced ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <div>
                    <div className="font-medium text-foreground">
                      AI-Enhanced Recommendations
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Use AI to generate personalized, context-aware action items
                    </div>
                  </div>
                </div>
              </button>

              {/* Summary */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h5 className="text-sm font-medium text-foreground mb-2">
                  Roadmap Summary
                </h5>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Score:</span>
                    <span className="text-foreground">{currentScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="text-foreground capitalize">
                      {targetCompetitor || targetPosition.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Focus Areas:</span>
                    <span className="text-foreground">
                      {focusAreas.length > 0
                        ? focusAreas.map((a) => a.toUpperCase()).join(", ")
                        : "All"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AI Enhanced:</span>
                    <span className="text-foreground">
                      {aiEnhanced ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step > 1 && (
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={isGenerating}
            >
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>Continue</Button>
          ) : (
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Roadmap
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
