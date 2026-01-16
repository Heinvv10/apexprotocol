"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Video,
  Image,
  List,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { useContentPerformance } from "@/hooks/usePlatformMonitoring";

// Platform colors for consistency
const platformColors = {
  chatgpt: "bg-green-500/10 text-green-400 border-green-500/20",
  claude: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  gemini: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  perplexity: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  grok: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  deepseek: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  janus: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

// Mock data for content performance analysis
const mockPerformanceByType = [
  {
    type: "FAQ Pages",
    icon: List,
    citations: 342,
    avgPosition: 1.4,
    avgVisibility: 94,
    trend: 18,
    topPlatforms: ["chatgpt", "claude", "perplexity"],
    schemaImpact: "+42% with FAQ schema",
  },
  {
    type: "Tutorial Content",
    icon: FileText,
    citations: 287,
    avgPosition: 2.1,
    avgVisibility: 88,
    trend: 12,
    topPlatforms: ["claude", "gemini", "perplexity"],
    schemaImpact: "+28% with HowTo schema",
  },
  {
    type: "Video Content",
    icon: Video,
    citations: 198,
    avgPosition: 2.8,
    avgVisibility: 82,
    trend: -5,
    topPlatforms: ["gemini", "perplexity"],
    schemaImpact: "+15% with VideoObject schema",
  },
  {
    type: "Infographics",
    icon: Image,
    citations: 156,
    avgPosition: 3.2,
    avgVisibility: 76,
    trend: 8,
    topPlatforms: ["gemini", "chatgpt"],
    schemaImpact: "+10% with ImageObject schema",
  },
];

// Platform preferences for different content types
const platformPreferences = [
  {
    platform: "chatgpt",
    displayName: "ChatGPT",
    preferences: [
      { type: "FAQ Pages", affinity: 95, reasoning: "Strong preference for structured Q&A format" },
      { type: "Tutorial Content", affinity: 88, reasoning: "Values step-by-step instructions" },
      { type: "Comparison Tables", affinity: 82, reasoning: "Cites tables for feature comparisons" },
    ],
  },
  {
    platform: "claude",
    displayName: "Claude",
    preferences: [
      { type: "Tutorial Content", affinity: 92, reasoning: "Prefers detailed, nuanced explanations" },
      { type: "FAQ Pages", affinity: 89, reasoning: "Values comprehensive answers" },
      { type: "Case Studies", affinity: 85, reasoning: "Cites real-world examples" },
    ],
  },
  {
    platform: "gemini",
    displayName: "Gemini",
    preferences: [
      { type: "Video Content", affinity: 93, reasoning: "Strong multimodal content preference" },
      { type: "Infographics", affinity: 87, reasoning: "Visual content gets higher visibility" },
      { type: "Data Visualizations", affinity: 84, reasoning: "Cites charts and graphs frequently" },
    ],
  },
  {
    platform: "perplexity",
    displayName: "Perplexity",
    preferences: [
      { type: "FAQ Pages", affinity: 91, reasoning: "Direct answers format preferred" },
      { type: "Video Content", affinity: 86, reasoning: "Embeds video responses" },
      { type: "Tutorial Content", affinity: 83, reasoning: "Structured how-to content" },
    ],
  },
];

// Schema impact analysis
const schemaImpactData = [
  {
    schema: "FAQPage",
    implementedPages: 45,
    citationIncrease: 42,
    avgPositionImprovement: 1.3,
    mostEffectivePlatforms: ["chatgpt", "claude", "perplexity"],
  },
  {
    schema: "HowTo",
    implementedPages: 32,
    citationIncrease: 28,
    avgPositionImprovement: 0.9,
    mostEffectivePlatforms: ["claude", "gemini"],
  },
  {
    schema: "Article",
    implementedPages: 78,
    citationIncrease: 18,
    avgPositionImprovement: 0.6,
    mostEffectivePlatforms: ["claude", "perplexity"],
  },
  {
    schema: "VideoObject",
    implementedPages: 23,
    citationIncrease: 15,
    avgPositionImprovement: 0.5,
    mostEffectivePlatforms: ["gemini", "perplexity"],
  },
];

// Freshness impact (how content age affects citations)
const freshnessImpact = [
  { ageRange: "0-30 days", citations: 412, avgVisibility: 92, percentage: 35 },
  { ageRange: "31-90 days", citations: 368, avgVisibility: 87, percentage: 31 },
  { ageRange: "91-180 days", citations: 245, avgVisibility: 81, percentage: 21 },
  { ageRange: "180+ days", citations: 148, avgVisibility: 74, percentage: 13 },
];

export function ContentPerformanceAnalyzer() {
  // API data with fallback to mock data
  const {
    performanceByType: apiPerformanceByType,
    schemaImpact: apiSchemaImpact,
    freshnessImpact: apiFreshnessImpact,
    isLoading,
    isError,
    error,
  } = useContentPerformance();

  // Use API data if available, otherwise fallback to mock
  const performanceByType = apiPerformanceByType.length > 0 ? apiPerformanceByType : mockPerformanceByType;
  const totalCitations = performanceByType.reduce((sum, item) => sum + (item.citations || 0), 0);

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading content performance data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load content performance data</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching content performance"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading and no error */}
      {!isLoading && !isError && (
        <>
          {/* Content Type Performance */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Performance by Content Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {performanceByType.map((content) => {
            // Type cast to handle union type - mock data has icon, API data doesn't
            const contentAny = content as Record<string, unknown>;
            const Icon = (contentAny.icon as React.ComponentType<{ className?: string }>) || FileText;
            const citations = (content.citations || 0);
            const sharePercentage = totalCitations > 0 ? ((citations / totalCitations) * 100).toFixed(1) : "0";

            const contentType = (contentAny.type || contentAny.contentType || "Unknown") as string;

            return (
              <Card key={contentType} className="p-4 bg-gray-800/50 border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <Icon className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{contentType}</h4>
                      <p className="text-sm text-gray-400">
                        {citations} citations ({sharePercentage}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {(content.trend || 0) > 0 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-green-400">+{content.trend}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-400" />
                        <span className="text-red-400">{content.trend}%</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Avg Position</p>
                    <p className="text-lg font-semibold text-white">#{content.avgPosition}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Avg Visibility</p>
                    <p className="text-lg font-semibold text-white">{content.avgVisibility}%</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2">Top Platforms</p>
                  <div className="flex flex-wrap gap-1">
                    {content.topPlatforms.map((platform) => (
                      <Badge
                        key={platform}
                        variant="outline"
                        className={`text-xs ${platformColors[platform as keyof typeof platformColors]}`}
                      >
                        {platform === "chatgpt" && "ChatGPT"}
                        {platform === "claude" && "Claude"}
                        {platform === "gemini" && "Gemini"}
                        {platform === "perplexity" && "Perplexity"}
                        {platform === "grok" && "Grok"}
                        {platform === "deepseek" && "DeepSeek"}
                        {platform === "janus" && "Janus"}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Schema Impact</p>
                  <p className="text-sm font-medium text-cyan-400">{content.schemaImpact}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Platform Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Platform Content Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platformPreferences.map((platform) => (
            <Card key={platform.platform} className="p-4 bg-gray-800/50 border-gray-700">
              <div className="mb-4">
                <Badge
                  variant="outline"
                  className={`${platformColors[platform.platform as keyof typeof platformColors]}`}
                >
                  {platform.displayName}
                </Badge>
              </div>

              <div className="space-y-3">
                {platform.preferences.map((pref, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{pref.type}</span>
                      <span className="text-sm font-semibold text-cyan-400">{pref.affinity}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${pref.affinity}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{pref.reasoning}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Schema Impact Analysis */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Schema Markup Impact
        </h3>
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="space-y-4">
            {schemaImpactData.map((schema) => (
              <div key={schema.schema} className="pb-4 border-b border-gray-700 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-white mb-1">{schema.schema}</h4>
                    <p className="text-sm text-gray-400">
                      {schema.implementedPages} pages implemented
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-400 mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-semibold">+{schema.citationIncrease}%</span>
                    </div>
                    <p className="text-xs text-gray-400">citation increase</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Position Improvement</p>
                    <p className="text-sm font-semibold text-white">
                      +{schema.avgPositionImprovement} positions
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Most Effective On</p>
                    <div className="flex flex-wrap gap-1">
                      {schema.mostEffectivePlatforms.slice(0, 2).map((platform) => (
                        <Badge
                          key={platform}
                          variant="outline"
                          className={`text-xs ${platformColors[platform as keyof typeof platformColors]}`}
                        >
                          {platform === "chatgpt" && "ChatGPT"}
                          {platform === "claude" && "Claude"}
                          {platform === "gemini" && "Gemini"}
                          {platform === "perplexity" && "Perplexity"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Content Freshness Impact */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Content Freshness Impact
        </h3>
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <p className="text-sm text-gray-400 mb-4">
            Analysis of how content age affects citation rate and visibility
          </p>
          <div className="space-y-4">
            {freshnessImpact.map((age) => (
              <div key={age.ageRange}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{age.ageRange}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">{age.citations} citations</span>
                    <span className="text-sm font-semibold text-cyan-400">{age.avgVisibility}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                  <div
                    className="bg-gradient-to-r from-green-500 to-cyan-500 h-2 rounded-full transition-all"
                    style={{ width: `${age.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">{age.percentage}% of total citations</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white mb-1">Key Insight</p>
                <p className="text-sm text-gray-400">
                  Content under 90 days old receives 66% of all citations and maintains
                  significantly higher visibility scores. Regular content updates and
                  publishing frequency strongly correlate with citation performance.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}
