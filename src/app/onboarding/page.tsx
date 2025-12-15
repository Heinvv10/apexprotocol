"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Globe,
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarkBrandAdded, useMarkMonitoringConfigured } from "@/hooks/useOnboarding";
import { useToast } from "@/components/toast";

// Onboarding steps configuration
const steps = [
  {
    id: "welcome",
    title: "Welcome to Apex",
    subtitle: "AI Visibility Platform",
    description: "Track and optimize your brand's visibility across AI-powered search engines.",
    icon: Sparkles,
  },
  {
    id: "brand",
    title: "Set Up Your Brand",
    subtitle: "Step 1 of 4",
    description: "Tell us about your brand so we can tailor the monitoring experience.",
    icon: Building2,
  },
  {
    id: "platforms",
    title: "Select AI Platforms",
    subtitle: "Step 2 of 4",
    description: "Choose which AI search engines to monitor for your brand mentions.",
    icon: Globe,
  },
  {
    id: "competitors",
    title: "Add Competitors",
    subtitle: "Step 3 of 4",
    description: "Track how your brand compares to competitors in AI visibility.",
    icon: Target,
  },
  {
    id: "complete",
    title: "You're All Set!",
    subtitle: "Step 4 of 4",
    description: "Your dashboard is ready. Let's optimize your AI visibility.",
    icon: CheckCircle2,
  },
];

// AI Platforms for selection
const aiPlatforms = [
  { id: "chatgpt", name: "ChatGPT", color: "#10A37F", enabled: true },
  { id: "claude", name: "Claude", color: "#D97757", enabled: true },
  { id: "gemini", name: "Gemini", color: "#4285F4", enabled: true },
  { id: "perplexity", name: "Perplexity", color: "#20B8CD", enabled: true },
  { id: "grok", name: "Grok", color: "#1DA1F2", enabled: false },
  { id: "deepseek", name: "DeepSeek", color: "#7C3AED", enabled: false },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const { markBrandAdded } = useMarkBrandAdded();
  const { markMonitoringConfigured } = useMarkMonitoringConfigured();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [brandName, setBrandName] = React.useState("");
  const [brandUrl, setBrandUrl] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<string[]>([
    "chatgpt",
    "claude",
    "gemini",
    "perplexity",
  ]);
  const [competitors, setCompetitors] = React.useState<string[]>([""]);

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding - create brand and mark steps complete
      setIsSubmitting(true);
      try {
        // Create the brand
        const response = await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandName: brandName,
            brandUrl: brandUrl,
            industry: industry,
            selectedPlatforms: selectedPlatforms,
            competitors: competitors.filter(c => c.trim().length > 0),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create brand");
        }

        // Mark onboarding steps complete (auto-detection handles brandAdded and monitoringConfigured)
        success("Success!", "Your brand has been created successfully");

        // Redirect to dashboard
        router.push("/dashboard");
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        showError("Error", errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const addCompetitor = () => {
    if (competitors.length < 5) {
      setCompetitors([...competitors, ""]);
    }
  };

  const updateCompetitor = (index: number, value: string) => {
    const updated = [...competitors];
    updated[index] = value;
    setCompetitors(updated);
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true; // Welcome step
      case 1:
        return brandName.trim().length > 0;
      case 2:
        return selectedPlatforms.length > 0;
      case 3:
        return true; // Competitors are optional
      case 4:
        return true; // Complete step
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted/30 z-50">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="pt-8 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-2">
          {steps.map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted/30 text-muted-foreground"
                )}
              >
                {index < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1",
                    index < currentStep ? "bg-primary" : "bg-muted/30"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Step header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <StepIcon className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-primary font-medium mb-2">
              {step.subtitle}
            </p>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              {step.title}
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {step.description}
            </p>
          </div>

          {/* Step content */}
          <div className="card-secondary p-6">
            {currentStep === 0 && (
              <WelcomeStep />
            )}

            {currentStep === 1 && (
              <BrandStep
                brandName={brandName}
                setBrandName={setBrandName}
                brandUrl={brandUrl}
                setBrandUrl={setBrandUrl}
                industry={industry}
                setIndustry={setIndustry}
              />
            )}

            {currentStep === 2 && (
              <PlatformsStep
                platforms={aiPlatforms}
                selectedPlatforms={selectedPlatforms}
                togglePlatform={togglePlatform}
              />
            )}

            {currentStep === 3 && (
              <CompetitorsStep
                competitors={competitors}
                updateCompetitor={updateCompetitor}
                addCompetitor={addCompetitor}
                removeCompetitor={removeCompetitor}
              />
            )}

            {currentStep === 4 && (
              <CompleteStep brandName={brandName} platformCount={selectedPlatforms.length} />
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                currentStep === 0
                  ? "opacity-0 pointer-events-none"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={isSubmitting}
              disabled={!canProceed()}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all",
                canProceed()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted/30 text-muted-foreground cursor-not-allowed"
              )}
            >
              {currentStep === steps.length - 1 ? "Go to Dashboard" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Skip option */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="text-center mt-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function WelcomeStep() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="card-tertiary p-4 text-center">
          <div className="text-3xl font-bold text-primary mb-1">7+</div>
          <div className="text-sm text-muted-foreground">AI Platforms</div>
        </div>
        <div className="card-tertiary p-4 text-center">
          <div className="text-3xl font-bold text-success mb-1">Real-time</div>
          <div className="text-sm text-muted-foreground">Monitoring</div>
        </div>
        <div className="card-tertiary p-4 text-center">
          <div className="text-3xl font-bold text-warning mb-1">Smart</div>
          <div className="text-sm text-muted-foreground">Recommendations</div>
        </div>
        <div className="card-tertiary p-4 text-center">
          <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-1">AI</div>
          <div className="text-sm text-muted-foreground">Content Engine</div>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Get started in just 2 minutes
      </div>
    </div>
  );
}

function BrandStep({
  brandName,
  setBrandName,
  brandUrl,
  setBrandUrl,
  industry,
  setIndustry,
}: {
  brandName: string;
  setBrandName: (value: string) => void;
  brandUrl: string;
  setBrandUrl: (value: string) => void;
  industry: string;
  setIndustry: (value: string) => void;
}) {
  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "E-commerce",
    "Education",
    "Marketing",
    "Other",
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Brand Name *
        </label>
        <input
          type="text"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="Enter your brand name"
          className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Website URL
        </label>
        <input
          type="url"
          value={brandUrl}
          onChange={(e) => setBrandUrl(e.target.value)}
          placeholder="https://yourbrand.com"
          className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Industry
        </label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        >
          <option value="">Select industry</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function PlatformsStep({
  platforms,
  selectedPlatforms,
  togglePlatform,
}: {
  platforms: typeof aiPlatforms;
  selectedPlatforms: string[];
  togglePlatform: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center mb-4">
        Select at least one platform to monitor
      </p>

      <div className="grid grid-cols-2 gap-3">
        {platforms.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          return (
            <button
              key={platform.id}
              onClick={() => platform.enabled && togglePlatform(platform.id)}
              disabled={!platform.enabled}
              className={cn(
                "relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                platform.enabled
                  ? isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-border bg-background hover:bg-white/5"
                  : "border-border/30 bg-muted/10 opacity-50 cursor-not-allowed"
              )}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${platform.color}20` }}
              >
                <span
                  className="text-lg font-bold"
                  style={{ color: platform.color }}
                >
                  {platform.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">
                  {platform.name}
                </div>
                {!platform.enabled && (
                  <div className="text-xs text-muted-foreground">Coming soon</div>
                )}
              </div>
              {isSelected && (
                <Check className="w-5 h-5 text-primary absolute top-2 right-2" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""} selected
      </p>
    </div>
  );
}

function CompetitorsStep({
  competitors,
  updateCompetitor,
  addCompetitor,
  removeCompetitor,
}: {
  competitors: string[];
  updateCompetitor: (index: number, value: string) => void;
  addCompetitor: () => void;
  removeCompetitor: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center mb-4">
        Add up to 5 competitors to compare (optional)
      </p>

      <div className="space-y-3">
        {competitors.map((competitor, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={competitor}
              onChange={(e) => updateCompetitor(index, e.target.value)}
              placeholder={`Competitor ${index + 1}`}
              className="flex-1 px-4 py-3 rounded-lg bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
            {competitors.length > 1 && (
              <button
                onClick={() => removeCompetitor(index)}
                className="p-2 text-muted-foreground hover:text-error transition-colors"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {competitors.length < 5 && (
        <button
          onClick={addCompetitor}
          className="w-full py-2 border border-dashed border-border/50 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-border transition-all"
        >
          + Add another competitor
        </button>
      )}
    </div>
  );
}

function CompleteStep({
  brandName,
  platformCount,
}: {
  brandName: string;
  platformCount: number;
}) {
  return (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-success" />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {brandName ? `Welcome, ${brandName}!` : "Welcome!"}
        </h3>
        <p className="text-muted-foreground">
          We&apos;re now monitoring {platformCount} AI platform{platformCount !== 1 ? "s" : ""} for your brand mentions.
        </p>
      </div>

      <div className="card-tertiary p-4 space-y-3">
        <h4 className="text-sm font-medium text-foreground">What happens next:</h4>
        <ul className="text-sm text-muted-foreground space-y-2 text-left">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Initial scan of AI platforms will begin</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Your GEO Score will be calculated within 24 hours</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Smart recommendations will be generated based on findings</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
