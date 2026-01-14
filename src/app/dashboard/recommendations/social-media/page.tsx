"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Zap, Calendar, TrendingUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SocialMediaStrategy {
  platform: string;
  platformName: string;
  whyItMatters: string;
  bestPractices: string[];
  postingFrequency: {
    minimum: number;
    recommended: number;
    unit: string;
  };
  contentTypes: Array<{
    name: string;
    description: string;
    exampleTopics: string[];
    aiPlatformBenefit: string;
  }>;
  templates: Array<{
    name: string;
    category: string;
    template: string;
    explanation: string;
    contentExample?: string;
  }>;
  metrics: Array<{
    metric: string;
    importance: string;
    howToMeasure: string;
    targetBenchmark: string;
  }>;
  timeline: {
    quickWin: string;
    mediumTerm: string;
    longTerm: string;
  };
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "bg-blue-500/20 text-blue-600",
  twitter: "bg-sky-500/20 text-sky-600",
  youtube: "bg-red-500/20 text-red-600",
  tiktok: "bg-purple-500/20 text-purple-600",
  instagram: "bg-pink-500/20 text-pink-600",
  facebook: "bg-indigo-500/20 text-indigo-600",
};

export default function SocialMediaDashboard() {
  const [strategies, setStrategies] = React.useState<SocialMediaStrategy[]>([]);
  const [selectedPlatform, setSelectedPlatform] = React.useState<string>("linkedin");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [actionPlan, setActionPlan] = React.useState(null);

  const fetchStrategies = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recommendations/social-media?all=true");

      if (!response.ok) {
        throw new Error(`Failed to fetch strategies: ${response.statusText}`);
      }

      const data = await response.json();
      setStrategies(data.data.strategies);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchActionPlan = React.useCallback(async (platform: string) => {
    try {
      const response = await fetch(`/api/recommendations/social-media?platform=${platform}&action-plan=true`);

      if (!response.ok) {
        throw new Error("Failed to fetch action plan");
      }

      const data = await response.json();
      setActionPlan(data.data);
    } catch (err) {
      console.error("Failed to fetch action plan:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  React.useEffect(() => {
    if (selectedPlatform) {
      fetchActionPlan(selectedPlatform);
    }
  }, [selectedPlatform, fetchActionPlan]);

  const currentStrategy = strategies.find((s) => s.platform === selectedPlatform);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Social Media Strategy for GEO</h1>
        <p className="text-muted-foreground">
          Platform-specific recommendations to improve AI visibility across LinkedIn, Twitter/X, YouTube, and more
        </p>
      </div>

      {/* Platform Selection */}
      <div className="card-secondary p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Select Platform</h2>
        </div>

        <div className="space-y-2 flex-1 max-w-sm">
          <label className="text-sm font-medium">Choose a social media platform</label>
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="twitter">Twitter/X</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

      {/* Current Strategy */}
      {!isLoading && currentStrategy && (
        <>
          {/* Why It Matters */}
          <div className="card-primary p-6 space-y-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-2">{currentStrategy.platformName}</h2>
                <p className="text-muted-foreground leading-relaxed">{currentStrategy.whyItMatters}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-secondary p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <h3 className="font-semibold text-sm">Quick Win</h3>
              </div>
              <p className="text-sm text-muted-foreground">{currentStrategy.timeline.quickWin}</p>
            </div>

            <div className="card-secondary p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Medium Term (8 weeks)</h3>
              </div>
              <p className="text-sm text-muted-foreground">{currentStrategy.timeline.mediumTerm}</p>
            </div>

            <div className="card-secondary p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold text-sm">Long Term (3+ months)</h3>
              </div>
              <p className="text-sm text-muted-foreground">{currentStrategy.timeline.longTerm}</p>
            </div>
          </div>

          {/* Posting Frequency */}
          <div className="card-secondary p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recommended Posting Frequency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-tertiary p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Minimum</p>
                <p className="text-2xl font-bold text-primary">
                  {currentStrategy.postingFrequency.minimum}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    per {currentStrategy.postingFrequency.unit.replace("posts_", "")}
                  </span>
                </p>
              </div>
              <div className="card-tertiary p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Recommended</p>
                <p className="text-2xl font-bold text-primary">
                  {currentStrategy.postingFrequency.recommended}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    per {currentStrategy.postingFrequency.unit.replace("posts_", "")}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="card-secondary p-6 space-y-4">
            <h3 className="font-semibold">Best Practices</h3>
            <ul className="space-y-2">
              {currentStrategy.bestPractices.map((practice, idx) => (
                <li key={idx} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{practice}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Content Types & AI Benefits */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Content Types & AI Platform Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStrategy.contentTypes.map((contentType, idx) => (
                <div key={idx} className="card-secondary p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">{contentType.name}</h4>
                    <p className="text-sm text-muted-foreground">{contentType.description}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary mb-2">AI Platform Benefit:</p>
                    <p className="text-xs text-muted-foreground">{contentType.aiPlatformBenefit}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1">Example Topics:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {contentType.exampleTopics.map((topic, i) => (
                        <li key={i}>• {topic}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Post Templates</h3>
            <Tabs defaultValue="0" className="w-full">
              <TabsList className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${currentStrategy.templates.length}, 1fr)` }}>
                {currentStrategy.templates.map((_, idx) => (
                  <TabsTrigger key={idx} value={idx.toString()} className="text-xs">
                    Template {idx + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              {currentStrategy.templates.map((template, idx) => (
                <TabsContent key={idx} value={idx.toString()} className="space-y-4 mt-4">
                  <div className="card-secondary p-6 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-1">{template.name}</h4>
                      <p className="text-xs text-primary mb-3">{template.category}</p>
                      <p className="text-sm text-muted-foreground mb-4">{template.explanation}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold mb-2">Template:</p>
                        <div className="bg-muted/50 p-3 rounded text-xs whitespace-pre-wrap font-mono">
                          {template.template}
                        </div>
                      </div>

                      {template.contentExample && (
                        <div>
                          <p className="text-xs font-semibold mb-2">Example:</p>
                          <div className="bg-muted/50 p-3 rounded text-xs whitespace-pre-wrap">
                            {template.contentExample}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button variant="outline" className="w-full text-xs">
                      Copy Template
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Key Metrics */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Key Metrics to Track</h3>
            <div className="space-y-3">
              {currentStrategy.metrics.map((metric, idx) => (
                <div key={idx} className="card-secondary p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{metric.metric}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Importance: {metric.importance}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        metric.importance === "critical"
                          ? "bg-red-500/20 text-red-600"
                          : metric.importance === "high"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-blue-500/20 text-blue-600"
                      }`}
                    >
                      {metric.importance.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      <span className="font-semibold">How to measure:</span> {metric.howToMeasure}
                    </p>
                    <p>
                      <span className="font-semibold">Target benchmark:</span> {metric.targetBenchmark}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan */}
          {actionPlan && (
            <div className="card-primary p-6 space-y-4">
              <h3 className="font-semibold text-lg">Your Implementation Plan</h3>
              <Tabs defaultValue="quick-wins" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="quick-wins" className="text-xs">Quick Wins</TabsTrigger>
                  <TabsTrigger value="month-1" className="text-xs">Month 1</TabsTrigger>
                  <TabsTrigger value="month-3" className="text-xs">Month 3</TabsTrigger>
                  <TabsTrigger value="month-6" className="text-xs">Month 6</TabsTrigger>
                </TabsList>

                <TabsContent value="quick-wins" className="mt-4 space-y-2">
                  {actionPlan.quickWins?.map((item: string, idx: number) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="month-1" className="mt-4 space-y-2">
                  {actionPlan.firstMonth?.map((item: string, idx: number) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="month-3" className="mt-4 space-y-2">
                  {actionPlan.threeMonths?.map((item: string, idx: number) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <CheckCircle2 className="h-4 w-4 text-purple-500 mt-1 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="month-6" className="mt-4 space-y-2">
                  {actionPlan.sixMonths?.map((item: string, idx: number) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <CheckCircle2 className="h-4 w-4 text-pink-500 mt-1 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </>
      )}
    </div>
  );
}
