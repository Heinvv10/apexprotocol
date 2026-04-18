"use client";

import * as React from "react";
import {
  X,
  Globe,
  ExternalLink,
  Target,
  Lightbulb,
  Users,
  Palette,
  TrendingUp,
  MessageSquare,
  Link2,
  Award,
  Pencil,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Brand, BrandCompetitor } from "@/stores/brand-store";
import { Button } from "@/components/ui/button";
import { LocationsSection } from "@/components/locations";
import { BrandLogo } from "@/components/brands/brand-logo";

// AI Platforms for monitoring display (colors from UI_DESIGN_SYSTEM.md)
const AI_PLATFORMS = [
  { id: "chatgpt", name: "ChatGPT", color: "#10A37F" },
  { id: "claude", name: "Claude", color: "#D97757" }, // Orange/terracotta per UI_DESIGN_SYSTEM.md
  { id: "gemini", name: "Gemini", color: "#4285F4" },
  { id: "perplexity", name: "Perplexity", color: "#20B8CD" },
  { id: "grok", name: "Grok", color: "#FFFFFF" }, // White per UI_DESIGN_SYSTEM.md
  { id: "deepseek", name: "DeepSeek", color: "#6366F1" }, // Indigo per UI_DESIGN_SYSTEM.md
  { id: "copilot", name: "Copilot", color: "#0078D4" },
];

// Design system colors (from UI_DESIGN_SYSTEM.md - the authoritative source)
const DESIGN = {
  // Primary brand colors
  primaryCyan: "hsl(var(--color-primary))",
  cyanBright: "hsl(var(--color-primary-bright))",
  cyanMuted: "#00B8A3",
  accentPurple: "hsl(var(--color-accent-purple))",
  purpleLight: "hsl(var(--color-accent-purple-light))",
  accentPink: "hsl(var(--color-accent-pink))",
  accentBlue: "hsl(var(--color-info))",
  // Semantic colors
  successGreen: "hsl(var(--color-success))",
  warningYellow: "hsl(var(--color-warning))",
  errorRed: "hsl(var(--color-error))",
  infoBlue: "hsl(var(--color-info))",
  // Backgrounds (from UI_DESIGN_SYSTEM.md)
  bgDeep: "hsl(var(--color-surface-deep))",
  bgBase: "#060812",
  bgElevated: "#0A0D1A",
  bgCard: "#0F1225",
  bgCardHover: "#151935",
  bgInput: "#0D1020",
  // Text colors
  textPrimary: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textAccent: "hsl(var(--color-primary))",
  textLink: "hsl(var(--color-link))",
  // Borders (rgba-based per UI_DESIGN_SYSTEM.md)
  borderSubtle: "rgba(255, 255, 255, 0.05)",
  borderDefault: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.12)",
  borderAccent: "rgba(0, 229, 204, 0.3)",
  borderGlow: "rgba(0, 229, 204, 0.5)",
};

// Backwards compatibility alias
const DESIGN_COLORS = DESIGN;

interface BrandDetailViewProps {
  brand: Brand;
  onClose: () => void;
  onEdit: () => void;
}

export function BrandDetailView({ brand, onClose, onEdit }: BrandDetailViewProps) {
  // Get brand initials for avatar fallback
  const getBrandInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Render keyword tags - using design system tag styling
  const renderKeywords = (keywords: string[], color: string, label: string) => {
    if (!keywords || keywords.length === 0) return null;
    return (
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: DESIGN.textSecondary }}>
          {label}
        </h4>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium"
              style={{
                backgroundColor: color.startsWith("hsl(") ? color.replace(/\)$/, " / 0.13)") : `${color}20`,
                color: color,
                border: `1px solid ${color.startsWith("hsl(") ? color.replace(/\)$/, " / 0.25)") : `${color}40`}`,
              }}
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Render competitors
  const renderCompetitors = (competitors: BrandCompetitor[]) => {
    if (!competitors || competitors.length === 0) return null;
    return (
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: DESIGN.textSecondary }}>
          <Users className="h-4 w-4" style={{ color: DESIGN.errorRed }} />
          Competitors
        </h4>
        <div className="space-y-2">
          {competitors.map((competitor, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: DESIGN.bgElevated,
                borderColor: DESIGN.borderDefault,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm" style={{ color: DESIGN.textPrimary }}>
                    {competitor.name || "Unknown Competitor"}
                  </p>
                  {competitor.reason && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: DESIGN.textSecondary }}>
                      {competitor.reason}
                    </p>
                  )}
                </div>
                {competitor.url && (
                  <a
                    href={competitor.url.startsWith("http") ? competitor.url : `https://${competitor.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 hover:opacity-80 transition-opacity"
                    style={{ color: DESIGN.primaryCyan }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render color palette
  const renderColorPalette = () => {
    // Combine all colors and deduplicate (case-insensitive)
    const allColors = [
      brand.visual?.primaryColor,
      brand.visual?.secondaryColor,
      brand.visual?.accentColor,
      ...(brand.visual?.colorPalette || []),
    ].filter(Boolean) as string[];

    // Deduplicate by lowercase comparison, keep original case
    const seen = new Set<string>();
    const colors = allColors.filter(color => {
      const lower = color.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });

    if (colors.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: DESIGN.textSecondary }}>
          <Palette className="h-4 w-4" style={{ color: DESIGN.accentPurple }} />
          Brand Colors
        </h4>
        <div className="flex gap-3">
          {colors.slice(0, 6).map((color, index) => (
            <div key={index} className="flex flex-col items-center gap-1.5">
              <div
                className="w-12 h-12 rounded-lg shadow-md"
                style={{
                  backgroundColor: color,
                  border: `2px solid ${DESIGN.borderDefault}`,
                }}
              />
              <span className="text-[10px] font-mono" style={{ color: DESIGN.textMuted }}>
                {color}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render social links
  const renderSocialLinks = () => {
    const links = brand.socialLinks || {};
    const entries = Object.entries(links).filter(([, url]) => url);

    if (entries.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: DESIGN.textSecondary }}>
          <Link2 className="h-4 w-4" style={{ color: DESIGN.infoBlue }} />
          Social Links
        </h4>
        <div className="flex flex-wrap gap-2">
          {entries.map(([platform, url]) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all hover:scale-105"
              style={{
                backgroundColor: DESIGN.bgElevated,
                color: DESIGN.textPrimary,
                border: `1px solid ${DESIGN.borderDefault}`,
              }}
            >
              <span className="capitalize">{platform}</span>
              <ExternalLink className="h-3 w-3" style={{ color: DESIGN.primaryCyan }} />
            </a>
          ))}
        </div>
      </div>
    );
  };

  // Render confidence score
  const renderConfidenceScore = () => {
    const confidence = brand.confidence?.overall || 0;
    if (confidence === 0) return null;

    return (
      <div
        className="flex items-center gap-4 p-4 rounded-xl"
        style={{
          backgroundColor: DESIGN.bgElevated,
          border: `1px solid ${DESIGN.borderAccent}`,
        }}
      >
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `hsl(var(--color-primary) / 0.13)` }}
        >
          <Award className="h-6 w-6" style={{ color: DESIGN.primaryCyan }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium mb-2" style={{ color: DESIGN.textSecondary }}>
            AI Analysis Confidence
          </p>
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-2.5 rounded-full overflow-hidden"
              style={{ backgroundColor: DESIGN.borderDefault }}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${confidence}%`,
                  background: `linear-gradient(90deg, ${DESIGN.primaryCyan}, ${DESIGN.accentPurple})`,
                }}
              />
            </div>
            <span
              className="text-base font-bold tabular-nums"
              style={{ color: DESIGN.primaryCyan }}
            >
              {confidence}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay - using deep space navy with opacity per design system */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: `hsl(var(--color-surface-deep) / 0.9)` }}
        onClick={onClose}
      />
      {/* Modal - translucent glass effect */}
      <div
        className="relative max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col rounded-2xl backdrop-blur-xl"
        style={{
          backgroundColor: `${DESIGN.bgCard}80`, // 50% opacity for glass effect
          border: `1px solid hsl(var(--color-primary) / 0.2)`,
          boxShadow: `0 0 40px hsl(var(--color-primary) / 0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {/* Header */}
        <div
          className="p-6 flex items-start justify-between gap-4 shrink-0"
          style={{
            borderBottom: `1px solid ${DESIGN.borderDefault}`,
            background: `linear-gradient(180deg, ${DESIGN.bgElevated} 0%, ${DESIGN.bgCard} 100%)`,
          }}
        >
          <div className="flex items-center gap-4">
            {/* Brand Logo/Avatar */}
            <div
              style={{
                border: `2px solid ${DESIGN.borderAccent}`,
              }}
              className="rounded-xl overflow-hidden"
            >
              <BrandLogo
                logoUrl={brand.logoUrl}
                brandName={brand.name}
                fallbackColor={brand.visual?.primaryColor || DESIGN.primaryCyan}
                size="lg"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold truncate" style={{ color: DESIGN.textPrimary }}>
                {brand.name}
              </h2>
              {brand.tagline && (
                <p className="text-sm italic" style={{ color: DESIGN.textSecondary }}>
                  {brand.tagline}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                {brand.domain && (
                  <a
                    href={`https://${brand.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs hover:underline flex items-center gap-1 transition-colors"
                    style={{ color: DESIGN.primaryCyan }}
                  >
                    <Globe className="h-3 w-3" />
                    {brand.domain}
                  </a>
                )}
                {brand.industry && (
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: `hsl(var(--color-primary) / 0.13)`,
                      color: DESIGN.primaryCyan,
                    }}
                  >
                    {brand.industry}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/10"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ backgroundColor: DESIGN.bgCard }}>
          {/* Confidence Score */}
          {renderConfidenceScore()}

          {/* Description */}
          {brand.description && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: DESIGN.textSecondary }}>
                <MessageSquare className="h-4 w-4" style={{ color: DESIGN.primaryCyan }} />
                Description
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: DESIGN.textPrimary }}>
                {brand.description}
              </p>
            </div>
          )}

          {/* Value Propositions */}
          {brand.valuePropositions && brand.valuePropositions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: DESIGN.textSecondary }}>
                <Lightbulb className="h-4 w-4" style={{ color: DESIGN.warningYellow }} />
                Value Propositions
              </h4>
              <ul className="space-y-2">
                {brand.valuePropositions.map((prop, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm">
                    <span style={{ color: DESIGN.primaryCyan }} className="mt-0.5 text-base">•</span>
                    <span style={{ color: DESIGN.textPrimary }}>{prop}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Target Audience */}
          {brand.voice?.targetAudience && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: DESIGN.textSecondary }}>
                <Target className="h-4 w-4" style={{ color: DESIGN.accentPink }} />
                Target Audience
              </h4>
              <p className="text-sm" style={{ color: DESIGN.textPrimary }}>{brand.voice.targetAudience}</p>
            </div>
          )}

          {/* Keywords Section - Using design system colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Keywords - Primary Cyan */}
            {renderKeywords(brand.keywords || [], DESIGN_COLORS.primaryCyan, "Keywords")}

            {/* SEO Keywords - Success Green */}
            {renderKeywords(brand.seoKeywords || [], DESIGN_COLORS.successGreen, "SEO Keywords")}

            {/* GEO Keywords - Warning Yellow */}
            {renderKeywords(brand.geoKeywords || [], DESIGN_COLORS.warningYellow, "GEO Keywords")}
          </div>

          {/* Competitors */}
          {renderCompetitors(brand.competitors || [])}

          {/* Color Palette */}
          {renderColorPalette()}

          {/* Social Links */}
          {renderSocialLinks()}

          {/* Monitoring Platforms */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: DESIGN.textSecondary }}>
              <TrendingUp className="h-4 w-4" style={{ color: DESIGN.successGreen }} />
              AI Platform Monitoring
            </h4>
            <div className="flex flex-wrap gap-2">
              {(brand.monitoringPlatforms || []).map((platformId) => {
                const platform = AI_PLATFORMS.find((p) => p.id === platformId);
                return (
                  <span
                    key={platformId}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: `${platform?.color}25`,
                      color: platform?.color,
                      border: `1px solid ${platform?.color}40`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: platform?.color }}
                    />
                    {platform?.name || platformId}
                  </span>
                );
              })}
              {(!brand.monitoringPlatforms || brand.monitoringPlatforms.length === 0) && (
                <span className="text-sm" style={{ color: DESIGN.textMuted }}>No platforms configured</span>
              )}
            </div>
            {brand.monitoringEnabled === false && (
              <p className="text-xs mt-1" style={{ color: DESIGN.textMuted }}>Monitoring is currently disabled</p>
            )}
          </div>

          {/* Locations Section (Phase 9.2) */}
          <div
            className="pt-6"
            style={{ borderTop: `1px solid ${DESIGN.borderDefault}` }}
          >
            <LocationsSection
              brandId={brand.id}
              brandName={brand.name}
              compact={false}
              maxLocations={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
