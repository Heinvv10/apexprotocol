"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Bot, Sparkles, Settings, ArrowRight, Cpu, Loader2 } from "lucide-react";
import { BrandHeader } from "@/components/layout/brand-header";
import {
  CompetitiveRadar,
  type RadarDataPoint,
} from "@/components/engine-room";
import { useEngineRoom } from "@/hooks/useEngineRoom";
import { useSelectedBrand } from "@/stores";

// Types for engine room data
export interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface MetricBadge {
  id: string;
  label: string;
  active: boolean;
}

export interface PerceptionBubble {
  id: string;
  label: string;
  size: "sm" | "md" | "lg";
  top: string;
  left: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  count?: number;
  options: Array<{ id: string; label: string; checked: boolean }>;
}

export interface PlatformData {
  model: string;
  perception: string;
}

// Loading state component
function EngineRoomLoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading engine room data...</p>
      </div>
    </div>
  );
}

// Empty state component for Engine Room
function EngineRoomEmptyState() {
  const aiPlatforms = [
    { name: "ChatGPT", color: "#10A37F" },
    { name: "Claude", color: "#D97757" },
    { name: "Gemini", color: "#4285F4" },
    { name: "Perplexity", color: "#20B8CD" },
    { name: "Grok", color: "#FFFFFF" },
    { name: "DeepSeek", color: "#6366F1" },
  ];

  const features = [
    { title: "Brand Perception", description: "See how each AI platform understands your brand" },
    { title: "Competitive Radar", description: "Compare your performance against industry averages" },
    { title: "Citation Analysis", description: "Track how often AI platforms cite your content" },
  ];

  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-lg space-y-8">
        {/* Animated icon */}
        <div className="relative mx-auto w-24 h-24">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          />
          <div className="relative w-24 h-24 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Cpu className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">AI Engine Analysis</span>
        </div>

        {/* Title and description */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            No Engine Data Available
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Configure your brand monitoring to see how different AI platforms perceive and represent your brand.
          </p>
        </div>

        {/* AI Platforms preview */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">
            AI Platforms We Track
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {aiPlatforms.map((platform) => (
              <div
                key={platform.name}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2"
              >
                <Bot className="w-3.5 h-3.5" style={{ color: platform.color }} />
                <span className="text-xs text-muted-foreground">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid gap-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{feature.title}</div>
                <div className="text-xs text-muted-foreground">{feature.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(0,229,204,0.3)] hover:shadow-[0_0_35px_rgba(0,229,204,0.4)]"
        >
          <Settings className="w-5 h-5" />
          Configure Brand Profile
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// Decorative star component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientEngine)"
        />
        <defs>
          <linearGradient id="starGradientEngine" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(var(--color-primary))" stopOpacity="0.6"/>
            <stop offset="1" stopColor="hsl(var(--color-accent-purple))" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function EngineRoomPage() {
  const selectedBrand = useSelectedBrand();

  // Track selected time range
  const [selectedTimeRange, setSelectedTimeRange] = React.useState<'7d' | '30d' | '90d'>('30d');

  // Track active platform
  const [activePlatform, setActivePlatform] = React.useState("");

  // Fetch engine room data from API with platform filtering
  const { data: engineData, isLoading } = useEngineRoom(
    selectedBrand?.id,
    selectedTimeRange,
    activePlatform || undefined // Only filter if platform is selected
  );

  // Extract data from API response
  const platforms = engineData?.platforms || [];
  const metricBadges = engineData?.metricBadges || [];
  const radarData = engineData?.radarData || [];
  const perceptionBubbles = engineData?.perceptionBubbles || [];
  const filterGroups = engineData?.filterGroups || [];
  const platformData = engineData?.platformData || {};

  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});
  const [activeMetric, setActiveMetric] = React.useState("visibility");
  const [filterState, setFilterState] = React.useState<Record<string, Record<string, boolean>>>({});

  // Set initial active platform when data loads
  React.useEffect(() => {
    if (platforms.length > 0 && !activePlatform) {
      setActivePlatform(platforms[0].id);
    }
  }, [platforms, activePlatform]);

  // Initialize filter state from API data
  React.useEffect(() => {
    if (filterGroups.length > 0 && Object.keys(filterState).length === 0) {
      const initialFilters: Record<string, Record<string, boolean>> = {};
      filterGroups.forEach((group) => {
        initialFilters[group.id] = {};
        group.options.forEach((option) => {
          initialFilters[group.id][option.id] = option.checked;
        });
      });
      setFilterState(initialFilters);
    }
  }, [filterGroups, filterState]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleFilter = (groupId: string, optionId: string) => {
    // Handle time range changes
    if (groupId === 'timeRange') {
      console.log(`[Engine Room] Time range changed: ${selectedTimeRange} → ${optionId}`);
      setSelectedTimeRange(optionId as '7d' | '30d' | '90d');

      // Update filter state to show only the selected time range as checked
      setFilterState((prev) => {
        const newState = {
          ...prev,
          [groupId]: {
            '7d': optionId === '7d',
            '30d': optionId === '30d',
            '90d': optionId === '90d',
          },
        };
        return newState;
      });
      return;
    }

    // Handle other filters (sentiment, platforms)
    setFilterState((prev) => {
      const newState = {
        ...prev,
        [groupId]: {
          ...prev[groupId],
          [optionId]: !prev[groupId]?.[optionId],
        },
      };
      console.log(`[Engine Room] Filter toggled: ${groupId}/${optionId} = ${newState[groupId][optionId]}`);
      return newState;
    });
  };

  const toggleMetric = (metricId: string) => {
    console.log(`[Engine Room] Metric changed: ${activeMetric} → ${metricId}`);
    setActiveMetric(metricId);
  };

  // Filter radar data based on active metric
  const filteredRadarData = React.useMemo(() => {
    if (!radarData || radarData.length === 0) return [];

    console.log(`[Engine Room] Filtering radar data for metric: ${activeMetric}`);

    if (activeMetric === 'visibility') {
      // Show metrics related to brand visibility
      return radarData.filter(d =>
        ['Brand Visibility', 'Citation Rate', 'Response Quality'].includes(d.metric)
      );
    } else if (activeMetric === 'sentiment') {
      // Show sentiment and accuracy metrics
      return radarData.filter(d =>
        ['Sentiment Score', 'Knowledge Accuracy', 'Recommendation Rate'].includes(d.metric)
      );
    } else if (activeMetric === 'citations') {
      // Show citation and quality metrics
      return radarData.filter(d =>
        ['Citation Rate', 'Response Quality', 'Knowledge Accuracy'].includes(d.metric)
      );
    } else if (activeMetric === 'competitors') {
      // Show competitive metrics
      return radarData.filter(d =>
        ['Recommendation Rate', 'Brand Visibility', 'Response Quality'].includes(d.metric)
      );
    }

    // Default: show all metrics
    return radarData;
  }, [radarData, activeMetric]);

  // Filter perception bubbles based on sentiment filters
  const filteredPerceptionBubbles = React.useMemo(() => {
    if (!perceptionBubbles || perceptionBubbles.length === 0) return [];

    const sentimentFilters = filterState['sentiment'] || {};

    // If positive sentiment is unchecked, hide all bubbles (they're from positive responses)
    if (sentimentFilters['positive'] === false) {
      console.log('[Engine Room] Hiding perception bubbles (positive sentiment unchecked)');
      return [];
    }

    return perceptionBubbles;
  }, [perceptionBubbles, filterState]);

  // Check if there's any data
  const hasData = platforms.length > 0;

  const currentPlatform = platforms.find((p) => p.id === activePlatform) || platforms[0];
  const currentData = platformData[activePlatform] || { model: "", perception: "" };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6 relative">
        <BrandHeader pageName="Engines" />
        <EngineRoomLoadingState />
        <DecorativeStar />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* APEX Header */}
      <BrandHeader pageName="Engines" />

      {/* Main Content */}
      {hasData ? (
        <div className="space-y-6">
          {/* Platform Tabs Row */}
          <div className="flex items-center gap-2">
            {platforms.map((platform) => {
              const isActive = activePlatform === platform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => setActivePlatform(platform.id)}
                  className={`engine-platform-tab ${isActive ? "active" : ""}`}
                  style={{
                    borderColor: isActive ? platform.color : "transparent",
                  }}
                >
                  <span className="text-sm">{platform.icon}</span>
                  <span>{platform.name}</span>
                </button>
              );
            })}
          </div>

          {/* Content Grid */}
          <div className="flex gap-6">
            {/* Filter Sidebar */}
            <div className="w-56 flex-shrink-0">
              <div className="engine-sidebar-card">
                {/* Filter Groups */}
                <div className="space-y-4">
                  {filterGroups.map((group) => (
                    <div key={group.id} className="filter-group-engine">
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center gap-2 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                      >
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform ${
                            expandedGroups[group.id] ? "rotate-180" : ""
                          }`}
                        />
                        <span className="flex-1 text-left">{group.label}</span>
                        {group.count !== undefined && (
                          <span className="text-xs text-muted-foreground">({group.count})</span>
                        )}
                      </button>

                      {/* Group Options */}
                      {expandedGroups[group.id] && group.options.length > 0 && (
                        <div className="space-y-1 mt-2 ml-6">
                          {group.options.map((option) => {
                            const isChecked = filterState[group.id]?.[option.id] ?? option.checked;
                            return (
                              <label
                                key={option.id}
                                className="flex items-center gap-3 py-1.5 cursor-pointer group"
                                onClick={() => toggleFilter(group.id, option.id)}
                              >
                                <div
                                  className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                                    isChecked
                                      ? "bg-primary/20 border-primary"
                                      : "border-muted-foreground/50 group-hover:border-muted-foreground"
                                  }`}
                                >
                                  {isChecked && (
                                    <svg className="w-2.5 h-2.5 text-primary" viewBox="0 0 12 12" fill="none">
                                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                                <span className="text-sm text-muted-foreground group-hover:text-foreground">
                                  {option.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Metric Badges Row */}
              <div className="flex items-center gap-3 mb-6">
                {metricBadges.map((badge) => {
                  const isActive = activeMetric === badge.id;
                  return (
                    <button
                      key={badge.id}
                      onClick={() => toggleMetric(badge.id)}
                      className={`engine-metric-badge ${isActive ? "active" : ""}`}
                    >
                      {isActive && <span className="w-2 h-2 rounded-full bg-primary" />}
                      <span>{badge.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Engine Room Card */}
              <div className="engine-content-card">
                {/* Engine Header */}
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold text-foreground">
                    Engine Room - {currentPlatform?.name || ""}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tracking Model: {currentData.model}
                  </p>
                </div>

                {/* Perception Section */}
                <h2 className="text-lg font-medium text-foreground mb-6">
                  {currentData.perception}
                </h2>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Competitive Radar */}
                  <div className="engine-radar-section">
                    <CompetitiveRadar
                      data={filteredRadarData}
                      brandName="Your Brand"
                    />
                  </div>

                  {/* Brand Perception Bubbles */}
                  <div className="relative h-[300px]">
                    {filteredPerceptionBubbles.length > 0 ? (
                      filteredPerceptionBubbles.map((bubble) => {
                        const sizeClasses = {
                          sm: "w-16 h-16 text-xs",
                          md: "w-20 h-20 text-xs",
                          lg: "w-24 h-24 text-sm",
                        };
                        return (
                          <div
                            key={bubble.id}
                            className={`engine-perception-bubble ${sizeClasses[bubble.size]}`}
                            style={{
                              top: bubble.top,
                              left: bubble.left,
                            }}
                          >
                            {bubble.label}
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No perception data for current filters
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EngineRoomEmptyState />
      )}

      {/* Decorative Star */}
      <DecorativeStar />
    </div>
  );
}
