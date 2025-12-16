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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Brand, BrandCompetitor } from "@/stores/brand-store";
import { Button } from "@/components/ui/button";

// AI Platforms for monitoring display (colors from UI_UX_DESIGN_STRATEGY.md)
const AI_PLATFORMS = [
  { id: "chatgpt", name: "ChatGPT", color: "#10A37F" },
  { id: "claude", name: "Claude", color: "#CC785C" }, // Terracotta per design docs
  { id: "gemini", name: "Gemini", color: "#4285F4" },
  { id: "perplexity", name: "Perplexity", color: "#20B8CD" },
  { id: "grok", name: "Grok", color: "#1DA1F2" },
  { id: "deepseek", name: "DeepSeek", color: "#FF6B35" }, // Orange per design docs
  { id: "copilot", name: "Copilot", color: "#0078D4" },
];

// Design system colors (from UI_UX_DESIGN_STRATEGY.md)
const DESIGN_COLORS = {
  primaryCyan: "#00E5CC",
  accentPurple: "#7C3AED",
  accentPink: "#D82F71",
  successGreen: "#22C55E",
  warningYellow: "#F59E0B",
  errorRed: "#EF4444",
  infoBlue: "#3B82F6",
};

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
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</h4>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-2.5 py-1 rounded-md text-xs font-medium border"
              style={{
                backgroundColor: `${color}15`,
                color,
                borderColor: `${color}30`,
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
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: DESIGN_COLORS.errorRed }} />
          Competitors
        </h4>
        <div className="space-y-2">
          {competitors.map((competitor, index) => (
            <div
              key={index}
              className="card-tertiary p-3 rounded-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{competitor.name}</p>
                  {competitor.reason && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {competitor.reason}
                    </p>
                  )}
                </div>
                {competitor.url && (
                  <a
                    href={competitor.url.startsWith("http") ? competitor.url : `https://${competitor.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 shrink-0"
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
    const colors = [
      brand.visual?.primaryColor,
      brand.visual?.secondaryColor,
      brand.visual?.accentColor,
      ...(brand.visual?.colorPalette || []),
    ].filter(Boolean) as string[];

    if (colors.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Palette className="h-4 w-4" style={{ color: DESIGN_COLORS.accentPurple }} />
          Brand Colors
        </h4>
        <div className="flex gap-2">
          {colors.slice(0, 6).map((color, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              <div
                className="w-10 h-10 rounded-lg border border-border shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-muted-foreground font-mono">
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
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Link2 className="h-4 w-4" style={{ color: DESIGN_COLORS.infoBlue }} />
          Social Links
        </h4>
        <div className="flex flex-wrap gap-2">
          {entries.map(([platform, url]) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-sm flex items-center gap-2 transition-colors"
            >
              <span className="capitalize">{platform}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </div>
    );
  };

  // Render confidence score - card-tertiary styling per design system
  const renderConfidenceScore = () => {
    const confidence = brand.confidence?.overall || 0;
    if (confidence === 0) return null;

    return (
      <div className="card-tertiary flex items-center gap-3 !p-4">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${DESIGN_COLORS.primaryCyan}20` }}
        >
          <Award className="h-5 w-5" style={{ color: DESIGN_COLORS.primaryCyan }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">AI Analysis Confidence</p>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex-1 h-2 bg-[#1E293B] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${confidence}%`,
                  background: `linear-gradient(90deg, ${DESIGN_COLORS.primaryCyan}, ${DESIGN_COLORS.accentPurple})`,
                }}
              />
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: DESIGN_COLORS.primaryCyan }}
            >
              {confidence}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay - using deep space navy with opacity per design system */}
      <div
        className="absolute inset-0 bg-[#02030A]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal - using glass-modal per design docs (glassmorphism for modals only) */}
      <div className="relative glass-modal p-0 max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header - card-secondary styling for elevated section */}
        <div className="p-6 border-b border-border/50 flex items-start justify-between gap-4 shrink-0 bg-[#0E1558]/50">
          <div className="flex items-center gap-4">
            {/* Brand Logo/Avatar - using primary cyan as fallback per design system */}
            <div
              className="flex items-center justify-center h-16 w-16 rounded-xl text-lg font-semibold text-[#02030A] shrink-0 border border-primary/20"
              style={{ backgroundColor: brand.visual?.primaryColor || DESIGN_COLORS.primaryCyan }}
            >
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                getBrandInitials(brand.name)
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold truncate">{brand.name}</h2>
              {brand.tagline && (
                <p className="text-sm text-muted-foreground italic">{brand.tagline}</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                {brand.domain && (
                  <a
                    href={`https://${brand.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    {brand.domain}
                  </a>
                )}
                {brand.industry && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                    {brand.industry}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Confidence Score */}
          {renderConfidenceScore()}

          {/* Description */}
          {brand.description && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="h-4 w-4" style={{ color: DESIGN_COLORS.primaryCyan }} />
                Description
              </h4>
              <p className="text-sm leading-relaxed text-foreground/90">{brand.description}</p>
            </div>
          )}

          {/* Value Propositions */}
          {brand.valuePropositions && brand.valuePropositions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="h-4 w-4" style={{ color: DESIGN_COLORS.warningYellow }} />
                Value Propositions
              </h4>
              <ul className="space-y-2">
                {brand.valuePropositions.map((prop, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span style={{ color: DESIGN_COLORS.primaryCyan }} className="mt-0.5">•</span>
                    <span className="text-foreground/90">{prop}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Target Audience */}
          {brand.voice?.targetAudience && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Target className="h-4 w-4" style={{ color: DESIGN_COLORS.accentPink }} />
                Target Audience
              </h4>
              <p className="text-sm text-foreground/90">{brand.voice.targetAudience}</p>
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
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: DESIGN_COLORS.successGreen }} />
              AI Platform Monitoring
            </h4>
            <div className="flex flex-wrap gap-2">
              {(brand.monitoringPlatforms || []).map((platformId) => {
                const platform = AI_PLATFORMS.find((p) => p.id === platformId);
                return (
                  <span
                    key={platformId}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: `${platform?.color}20`,
                      color: platform?.color,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: platform?.color }}
                    />
                    {platform?.name || platformId}
                  </span>
                );
              })}
              {(!brand.monitoringPlatforms || brand.monitoringPlatforms.length === 0) && (
                <span className="text-sm text-muted-foreground">No platforms configured</span>
              )}
            </div>
            {brand.monitoringEnabled === false && (
              <p className="text-xs text-muted-foreground mt-1">Monitoring is currently disabled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
