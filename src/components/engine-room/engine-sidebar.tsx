"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  id: string;
  label: string;
  checked?: boolean;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

interface EngineSidebarProps {
  filters: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (groupId: string, optionId: string, checked: boolean) => void;
  className?: string;
}

export function EngineSidebar({
  filters,
  selectedFilters,
  onFilterChange,
  className,
}: EngineSidebarProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(
    filters.map((f) => f.id)
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className={cn("w-56 flex-shrink-0", className)}>
      <div className="card-secondary h-full space-y-4">
        {filters.map((group) => {
          const isExpanded = expandedGroups.includes(group.id);
          const selectedCount = selectedFilters[group.id]?.length || 0;

          return (
            <div key={group.id}>
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between py-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {group.label}
                  </span>
                  {selectedCount > 0 && (
                    <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {selectedCount}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>

              {/* Options */}
              {isExpanded && (
                <div className="space-y-1 mt-1">
                  {group.options.map((option) => {
                    const isSelected = selectedFilters[group.id]?.includes(
                      option.id
                    );

                    return (
                      <label
                        key={option.id}
                        className="flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted/10 transition-colors"
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-border/50"
                          )}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
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
                        <span className="text-sm text-muted-foreground">
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
