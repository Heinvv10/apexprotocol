"use client";

import * as React from "react";
import Link from "next/link";
import { Radar, Settings, ArrowRight, Bot, Sparkles } from "lucide-react";
import { FilterSidebar, SmartTable, QueryRow } from "@/components/monitor";

// Empty filter configuration - will be populated from API/database
const emptyFilterGroups = [
  {
    id: "topics",
    label: "Tracked Topics",
    count: 0,
    options: [],
  },
  {
    id: "entity",
    label: "Entity Types",
    count: 0,
    options: [],
  },
  {
    id: "engines",
    label: "AI Engines",
    count: 0,
    options: [],
  },
];

// Decorative star component
function DecorativeStar() {
  return (
    <div className="decorative-star absolute bottom-8 right-8 w-12 h-12 opacity-60">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradient)"
        />
        <defs>
          <linearGradient id="starGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Empty state component for when no monitoring is configured
function MonitorEmptyState() {
  const aiPlatforms = [
    { name: "ChatGPT", color: "#10A37F" },
    { name: "Claude", color: "#D97757" },
    { name: "Gemini", color: "#4285F4" },
    { name: "Perplexity", color: "#20B8CD" },
    { name: "Grok", color: "#FFFFFF" },
    { name: "DeepSeek", color: "#6366F1" },
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
            <Radar className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">AI Monitoring</span>
        </div>

        {/* Title and description */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            No Monitoring Configured Yet
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Set up your brand profile and monitoring keywords to start tracking how AI platforms mention your brand in real-time.
          </p>
        </div>

        {/* AI Platforms preview */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">
            Platforms you can monitor
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

        {/* CTA Button */}
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(0,229,204,0.3)] hover:shadow-[0_0_35px_rgba(0,229,204,0.4)]"
        >
          <Settings className="w-5 h-5" />
          Configure Monitoring
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function MonitorPage() {
  // TODO: Fetch queries from API endpoint
  // const { data: queries, isLoading } = useQuery(['queries'], fetchQueries);
  const queries: QueryRow[] = []; // Empty array - no mock data

  // TODO: Fetch filter options from API/database
  // const { data: filterGroups } = useQuery(['filters'], fetchFilterGroups);
  const filterGroups = emptyFilterGroups;

  const [selectedFilters, setSelectedFilters] = React.useState<Record<string, string[]>>({
    topics: [],
    entity: [],
    engines: [],
  });

  const handleFilterChange = (groupId: string, optionId: string, checked: boolean) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [groupId]: checked
        ? [...(prev[groupId] || []), optionId]
        : (prev[groupId] || []).filter((id) => id !== optionId),
    }));
  };

  const handleClearAll = () => {
    setSelectedFilters({
      topics: [],
      entity: [],
      engines: [],
    });
  };

  // Check if there's any data to show
  const hasData = queries.length > 0;

  return (
    <div className="dashboard-bg min-h-screen relative">
      {/* Header Row */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="apex-logo-icon w-8 h-8">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGrad)" />
              <defs>
                <linearGradient id="apexGrad" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00E5CC"/>
                  <stop offset="1" stopColor="#8B5CF6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            APEX
          </span>
          <span className="text-xl font-light text-white ml-1">Monitor</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-8">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
            Orbit
          </Link>
          <Link href="/dashboard/monitor" className="text-sm text-cyan-400 font-medium relative">
            Monitor
            <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          </Link>
          <Link href="/dashboard/feedback" className="text-sm text-slate-400 hover:text-white transition-colors">
            Feedback
          </Link>
          <Link href="/dashboard/engine-room" className="text-sm text-slate-400 hover:text-white transition-colors">
            Engines
          </Link>
          <Link href="/dashboard/settings" className="text-sm text-slate-400 hover:text-white transition-colors">
            Settings
          </Link>
        </nav>

        {/* AI Status */}
        <div className="ai-status-indicator">
          <span className="ai-status-dot active" />
          <span className="text-xs text-slate-400">AI Status:</span>
          <span className="text-xs text-cyan-400 font-medium">Active</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 p-6 relative">
        {hasData ? (
          <>
            {/* Filter Sidebar - only show when there's data */}
            <FilterSidebar
              filters={filterGroups}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAll}
            />

            {/* Live Query Analysis Section */}
            <div className="flex-1 min-w-0">
              <div className="monitor-content-card">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Live Query Analysis</h2>
                </div>

                {/* Smart Table Badge */}
                <div className="mb-4">
                  <span className="smart-table-badge">
                    Smart Table
                  </span>
                </div>

                {/* Table */}
                <SmartTable data={queries} />
              </div>
            </div>
          </>
        ) : (
          <MonitorEmptyState />
        )}

        {/* Decorative Star */}
        <DecorativeStar />
      </div>
    </div>
  );
}
