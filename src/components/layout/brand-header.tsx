"use client";

import * as React from "react";
import { getActiveBrand } from "@/config/brand-presets";

interface BrandHeaderProps {
  /** Page name shown after the brand wordmark (e.g. "Monitor", "Audit"). */
  pageName: string;
  /** AI Status indicator in the top-right. Set `false` to hide. */
  aiStatus?: { active: boolean; label?: string } | false;
  /** Optional slot for additional right-side content (e.g. LIVE badge). */
  rightSlot?: React.ReactNode;
  className?: string;
}

/**
 * Standardised dashboard page header.
 *
 * Replaces the inline `APEX <pagename>` + gradient-triangle + AI Status
 * block that was copy-pasted across ~22 dashboard page.tsx files. The
 * wordmark reads from the active brand preset, and the gradient stops
 * bind to `--color-primary` / `--color-accent-purple`, so white-label
 * tenants get their own palette automatically.
 */
export function BrandHeader({
  pageName,
  aiStatus = { active: true },
  rightSlot,
  className = "",
}: BrandHeaderProps) {
  const brand = getActiveBrand();
  const gradientId = React.useId();
  const wordmark = brand.name.toUpperCase();

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 28H4L16 4Z" fill={`url(#${gradientId})`} />
            <defs>
              <linearGradient
                id={gradientId}
                x1="4"
                y1="28"
                x2="28"
                y2="4"
                gradientUnits="userSpaceOnUse"
              >
                <stop style={{ stopColor: "hsl(var(--color-primary))" }} />
                <stop offset="1" style={{ stopColor: "hsl(var(--color-accent-purple))" }} />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span
          className="text-xl font-bold bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--color-primary)), hsl(var(--color-accent-purple)))",
          }}
        >
          {wordmark}
        </span>
        <span className="text-xl font-light text-foreground ml-1">{pageName}</span>
      </div>

      <div className="flex items-center gap-2">
        {rightSlot}
        {aiStatus !== false && (
          <>
            <span
              className={`w-2 h-2 rounded-full ${
                aiStatus.active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span className="text-xs text-muted-foreground">AI Status:</span>
            <span className="text-xs text-primary font-medium">
              {aiStatus.label ?? (aiStatus.active ? "Active" : "Offline")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
