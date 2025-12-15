"use client";

import * as React from "react";
import { ChevronDown, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterGroup {
  id: string;
  label: string;
  count?: number;
  options: {
    id: string;
    label: string;
    count?: number;
    icon?: React.ReactNode;
    color?: string;
  }[];
}

interface FilterSidebarProps {
  filters: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (groupId: string, optionId: string, checked: boolean) => void;
  onClearAll: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  className?: string;
}

// AI Engine icons matching reference exactly
const AIEngineIcons = () => (
  <div className="flex items-center gap-2 mt-3">
    {/* ChatGPT */}
    <button className="ai-engine-filter-icon active" title="ChatGPT">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494z"/>
      </svg>
    </button>
    {/* Claude */}
    <button className="ai-engine-filter-icon" title="Claude">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </button>
    {/* Gemini */}
    <button className="ai-engine-filter-icon" title="Gemini">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.5L18 8v8l-6 3.5L6 16V8l6-3.5z"/>
      </svg>
    </button>
    {/* Perplexity */}
    <button className="ai-engine-filter-icon" title="Perplexity">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <circle cx="12" cy="12" r="3"/>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </button>
    {/* Grok (X) */}
    <button className="ai-engine-filter-icon" title="Grok">
      <span className="text-sm font-bold">X</span>
    </button>
  </div>
);

export function FilterSidebar({
  filters,
  selectedFilters,
  onFilterChange,
  className,
}: FilterSidebarProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>(
    filters.reduce((acc, group) => ({ ...acc, [group.id]: true }), {})
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <div className={cn("w-72 flex-shrink-0", className)}>
      <div className="monitor-filter-sidebar">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Filters</h3>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Groups */}
        <div className="space-y-5">
          {filters.map((group) => (
            <div key={group.id} className="filter-group">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-2 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <div className={cn(
                  "w-5 h-5 rounded flex items-center justify-center border transition-colors",
                  selectedFilters[group.id]?.length > 0
                    ? "bg-primary/20 border-primary/50"
                    : "border-border/50"
                )}>
                  {selectedFilters[group.id]?.length > 0 && (
                    <svg className="w-3 h-3 text-primary" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="flex-1 text-left">{group.label}</span>
                {group.count !== undefined && (
                  <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                    {group.count}
                  </span>
                )}
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  expandedGroups[group.id] && "transform rotate-180"
                )} />
              </button>

              {/* Group Options */}
              {expandedGroups[group.id] && (
                <div className="space-y-1 mt-2 ml-7">
                  {group.id === "engines" ? (
                    <AIEngineIcons />
                  ) : (
                    group.options.map((option) => {
                      const isSelected = selectedFilters[group.id]?.includes(option.id);
                      return (
                        <label
                          key={option.id}
                          className="filter-option flex items-center gap-3 py-2 px-2 rounded-lg cursor-pointer"
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-sm border transition-colors flex items-center justify-center",
                            isSelected
                              ? "bg-primary/20 border-primary"
                              : "border-border/50 hover:border-muted-foreground"
                          )}>
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-primary" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              onFilterChange(group.id, option.id, e.target.checked)
                            }
                            className="sr-only"
                          />
                          <span className="flex-1 text-sm text-slate-300">
                            {option.label}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add New Tracking Scenario Button */}
        <button className="monitor-add-scenario-btn mt-6">
          <Plus className="w-4 h-4" />
          <span>Add New Tracking Scenario</span>
        </button>
      </div>
    </div>
  );
}
