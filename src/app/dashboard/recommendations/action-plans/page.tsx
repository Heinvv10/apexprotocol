"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Zap,
  Clock,
  Target,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ActionStep {
  stepNumber: number;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: "easy" | "medium" | "hard";
  codeSnippet?: {
    language: string;
    code: string;
    explanation: string;
  };
  verification: string[];
}

interface ImplementationGuide {
  title: string;
  description: string;
  impact: {
    geoPointsExpected: string;
    platforms: string[];
    timeToComplete: string;
  };
  difficulty: "easy" | "medium" | "hard";
  steps: ActionStep[];
  successCriteria: string[];
  commonPitfalls: string[];
  timeline: {
    quickWin: string;
    fullImplementation: string;
  };
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-500/20 text-green-600",
  medium: "bg-yellow-500/20 text-yellow-600",
  hard: "bg-red-500/20 text-red-600",
};

export default function ActionPlansDashboard() {
  const [guides, setGuides] = React.useState<ImplementationGuide[]>([]);
  const [selectedGuide, setSelectedGuide] = React.useState<ImplementationGuide | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set());
  const [copiedSnippet, setCopiedSnippet] = React.useState<number | null>(null);

  const fetchGuides = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recommendations/action-plans?all=true");

      if (!response.ok) {
        throw new Error(`Failed to fetch guides: ${response.statusText}`);
      }

      const data = await response.json();
      setGuides(data.data.guides);
      if (data.data.guides.length > 0) {
        setSelectedGuide(data.data.guides[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  const handleStepToggle = (stepNumber: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepNumber)) {
      newCompleted.delete(stepNumber);
    } else {
      newCompleted.add(stepNumber);
    }
    setCompletedSteps(newCompleted);
  };

  const handleCopySnippet = (code: string, stepNumber: number) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(stepNumber);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const completionPercentage = selectedGuide
    ? Math.round((completedSteps.size / selectedGuide.steps.length) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Implementation Action Plans</h1>
        <p className="text-muted-foreground">
          Step-by-step guides to implement GEO improvements on your website
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="card-secondary p-4 border-red-500/30 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-500 mb-1">Error</h3>
            <p className="text-sm text-red-500/80">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      )}

      {/* Main Content */}
      {!isLoading && guides.length > 0 && selectedGuide && (
        <>
          {/* Guides List */}
          <div className="card-secondary p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Available Implementation Guides</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {guides.map((guide, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedGuide(guide);
                    setCompletedSteps(new Set());
                  }}
                  className={`p-4 rounded-lg text-left transition-all ${
                    selectedGuide.title === guide.title
                      ? "card-primary border-primary/50 border-2"
                      : "card-tertiary hover:card-secondary"
                  }`}
                >
                  <h3 className="font-semibold text-sm mb-2">{guide.title}</h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Impact: {guide.impact.geoPointsExpected}</p>
                    <p>Time: {guide.impact.timeToComplete}</p>
                    <span className={`inline-block px-2 py-1 rounded ${DIFFICULTY_COLORS[guide.difficulty]}`}>
                      {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Guide Details */}
          <div className="card-primary p-6 space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{selectedGuide.title}</h2>
                  <p className="text-muted-foreground">{selectedGuide.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${DIFFICULTY_COLORS[selectedGuide.difficulty]}`}>
                  {selectedGuide.difficulty.toUpperCase()}
                </span>
              </div>

              {/* Impact Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="card-secondary p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Expected Impact</p>
                  <p className="text-lg font-bold text-primary">{selectedGuide.impact.geoPointsExpected}</p>
                </div>
                <div className="card-secondary p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Time to Complete</p>
                  <p className="text-lg font-bold text-primary">{selectedGuide.impact.timeToComplete}</p>
                </div>
                <div className="card-secondary p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Affected Platforms</p>
                  <p className="text-sm font-semibold">{selectedGuide.impact.platforms.join(", ")}</p>
                </div>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Progress: {completionPercentage}% Complete
                </h3>
                <span className="text-sm text-muted-foreground">{completedSteps.size} of {selectedGuide.steps.length} steps</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold">Step-by-Step Instructions</h3>
              <div className="space-y-3">
                {selectedGuide.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className={`card-secondary p-4 space-y-3 transition-all ${
                      completedSteps.has(step.stepNumber) ? "opacity-60" : ""
                    }`}
                  >
                    {/* Step Header */}
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleStepToggle(step.stepNumber)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {completedSteps.has(step.stepNumber) ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">
                            Step {step.stepNumber}: {step.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${DIFFICULTY_COLORS[step.difficulty]}`}>
                            {step.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {step.estimatedTime}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>

                    {/* Code Snippet */}
                    {step.codeSnippet && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-primary">Code Snippet ({step.codeSnippet.language}):</p>
                        <p className="text-xs text-muted-foreground mb-2">{step.codeSnippet.explanation}</p>
                        <div className="relative">
                          <pre className="bg-muted/50 p-3 rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap break-words max-h-48">
                            {step.codeSnippet.code}
                          </pre>
                          <button
                            onClick={() => handleCopySnippet(step.codeSnippet!.code, step.stepNumber)}
                            className="absolute top-2 right-2 p-1.5 bg-primary/20 hover:bg-primary/30 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedSnippet === step.stepNumber ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-primary" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Verification Checklist */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold">Verification Checklist:</p>
                      <ul className="space-y-1">
                        {step.verification.map((item, i) => (
                          <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Criteria & Pitfalls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Success Criteria */}
              <div className="card-tertiary p-4 space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Success Criteria
                </h4>
                <ul className="space-y-1">
                  {selectedGuide.successCriteria.map((criterion, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common Pitfalls */}
              <div className="card-tertiary p-4 space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Common Pitfalls
                </h4>
                <ul className="space-y-1">
                  {selectedGuide.commonPitfalls.map((pitfall, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-yellow-500">!</span>
                      <span>{pitfall}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Timeline */}
            <div className="border-t border-muted pt-4 space-y-3">
              <h3 className="font-semibold">Implementation Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-tertiary p-4 space-y-2">
                  <p className="text-sm font-semibold text-green-500">Quick Win</p>
                  <p className="text-sm">{selectedGuide.timeline.quickWin}</p>
                </div>
                <div className="card-tertiary p-4 space-y-2">
                  <p className="text-sm font-semibold text-primary">Full Implementation</p>
                  <p className="text-sm">{selectedGuide.timeline.fullImplementation}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && guides.length === 0 && !error && (
        <div className="card-secondary p-8 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No action plans available</p>
        </div>
      )}
    </div>
  );
}
