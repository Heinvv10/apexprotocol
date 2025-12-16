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

// AI Platforms for monitoring display
const AI_PLATFORMS = [
  { id: "chatgpt", name: "ChatGPT", color: "#10A37F" },
  { id: "claude", name: "Claude", color: "#D97706" },
  { id: "gemini", name: "Gemini", color: "#4285F4" },
  { id: "perplexity", name: "Perplexity", color: "#1FB8CD" },
  { id: "grok", name: "Grok", color: "#1DA1F2" },
  { id: "deepseek", name: "DeepSeek", color: "#6366F1" },
  { id: "copilot", name: "Copilot", color: "#0078D4" },
];

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

  // Render keyword tags
  const renderKeywords = (keywords: string[], color: string, label: string) => {
    if (!keywords || keywords.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</h4>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-md text-xs font-medium"
              style={{ backgroundColor: `${color}20`, color }}
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
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Users className="h-3.5 w-3.5" />
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
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Palette className="h-3.5 w-3.5" />
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
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Link2 className="h-3.5 w-3.5" />
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

  // Render confidence score
  const renderConfidenceScore = () => {
    const confidence = brand.confidence?.overall || 0;
    if (confidence === 0) return null;

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <Award className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">AI Analysis Confidence</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="text-sm font-medium text-primary">{confidence}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative glass-modal p-0 max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            {/* Brand Logo/Avatar */}
            <div
              className="flex items-center justify-center h-16 w-16 rounded-xl text-lg font-semibold text-white shrink-0"
              style={{ backgroundColor: brand.visual?.primaryColor || "#4926FA" }}
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
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5" />
                Description
              </h4>
              <p className="text-sm leading-relaxed">{brand.description}</p>
            </div>
          )}

          {/* Value Propositions */}
          {brand.valuePropositions && brand.valuePropositions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5" />
                Value Propositions
              </h4>
              <ul className="space-y-1.5">
                {brand.valuePropositions.map((prop, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span>{prop}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Target Audience */}
          {brand.voice?.targetAudience && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Target className="h-3.5 w-3.5" />
                Target Audience
              </h4>
              <p className="text-sm">{brand.voice.targetAudience}</p>
            </div>
          )}

          {/* Keywords Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Keywords */}
            {renderKeywords(brand.keywords || [], "#4926FA", "Keywords")}

            {/* SEO Keywords */}
            {renderKeywords(brand.seoKeywords || [], "#17CA29", "SEO Keywords")}

            {/* GEO Keywords */}
            {renderKeywords(brand.geoKeywords || [], "#FFB020", "GEO Keywords")}
          </div>

          {/* Competitors */}
          {renderCompetitors(brand.competitors || [])}

          {/* Color Palette */}
          {renderColorPalette()}

          {/* Social Links */}
          {renderSocialLinks()}

          {/* Monitoring Platforms */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
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
