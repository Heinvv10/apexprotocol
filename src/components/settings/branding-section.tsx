"use client";

import { useEffect, useState } from "react";
import { Loader2, Palette, Save } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

/**
 * Branding & Theme settings.
 *
 * Reads + writes `organizations.branding` JSONB (shape defined in
 * src/lib/db/schema/organizations.ts:92-114). Updates go through
 * PUT /api/settings/organization, same endpoint the General tab uses —
 * avoiding a new route for a small surface area.
 */

interface BrandingShape {
  themeId: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
  appName: string | null;
  tagline: string | null;
  customDomain: string | null;
  supportEmail: string | null;
  showPoweredBy: boolean;
  customFooterText: string | null;
}

const THEME_PRESETS: Array<{ id: string; name: string; primary: string; accent: string; preview: [string, string] }> = [
  { id: "apexgeo-default", name: "Apex Cyan", primary: "#00E5CC", accent: "#8B5CF6", preview: ["#0a0f1a", "#00E5CC"] },
  { id: "apexgeo-copper", name: "Copper", primary: "#E2725B", accent: "#F4A261", preview: ["#1a0f0a", "#E2725B"] },
  { id: "apexgeo-midnight", name: "Midnight", primary: "#6366F1", accent: "#EC4899", preview: ["#0a0a1a", "#6366F1"] },
  { id: "custom", name: "Custom", primary: "", accent: "", preview: ["#141930", "#888"] },
];

const DEFAULT_BRANDING: BrandingShape = {
  themeId: "apexgeo-default",
  primaryColor: "#00E5CC",
  accentColor: "#8B5CF6",
  logoUrl: null,
  logoDarkUrl: null,
  faviconUrl: null,
  appName: null,
  tagline: null,
  customDomain: null,
  supportEmail: null,
  showPoweredBy: true,
  customFooterText: null,
};

export function BrandingSection(_props?: { branding?: unknown; onUpdate?: (updates: unknown) => Promise<void> }) {
  const [branding, setBranding] = useState<BrandingShape>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings/organization");
        const data = await res.json();
        if (data?.success && data?.data?.branding) {
          setBranding({ ...DEFAULT_BRANDING, ...data.data.branding });
        }
      } catch (err) {
        logger.warn("[branding] load failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateField = <K extends keyof BrandingShape>(key: K, value: BrandingShape[K]) => {
    setBranding((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    if (preset.id === "custom") {
      updateField("themeId", "custom");
      return;
    }
    setBranding((prev) => ({
      ...prev,
      themeId: preset.id,
      primaryColor: preset.primary,
      accentColor: preset.accent,
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branding }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Save failed");
      }
      toast.success("Branding saved");
    } catch (err) {
      toast.error("Couldn't save branding", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Branding & Theme
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize how Apex looks for your team and white-label clients.
        </p>
      </div>

      {/* Theme preset picker */}
      <div className="card-secondary p-6 rounded-lg">
        <h3 className="text-sm font-medium text-foreground mb-4">Theme preset</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {THEME_PRESETS.map((preset) => {
            const selected = branding.themeId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`flex flex-col items-stretch gap-2 p-3 rounded-lg border-2 transition-all ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-white/10 hover:border-white/20 bg-white/5"
                }`}
              >
                <div
                  className="h-16 rounded-md flex items-end p-2"
                  style={{ background: preset.preview[0] }}
                >
                  <div
                    className="h-2 w-2/3 rounded-full"
                    style={{ background: preset.preview[1] }}
                  />
                </div>
                <span className="text-sm font-medium text-left">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors (editable when custom or when override desired) */}
      <div className="card-secondary p-6 rounded-lg">
        <h3 className="text-sm font-medium text-foreground mb-4">Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Primary</span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.primaryColor || "#00E5CC"}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                className="h-10 w-14 rounded-md border border-white/10 bg-transparent cursor-pointer"
                aria-label="Primary color"
              />
              <input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                className="flex-1 h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm font-mono"
                placeholder="#00E5CC"
                aria-label="Primary color hex"
              />
            </div>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Accent</span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.accentColor || "#8B5CF6"}
                onChange={(e) => updateField("accentColor", e.target.value)}
                className="h-10 w-14 rounded-md border border-white/10 bg-transparent cursor-pointer"
                aria-label="Accent color"
              />
              <input
                type="text"
                value={branding.accentColor}
                onChange={(e) => updateField("accentColor", e.target.value)}
                className="flex-1 h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm font-mono"
                placeholder="#8B5CF6"
                aria-label="Accent color hex"
              />
            </div>
          </label>
        </div>
      </div>

      {/* Logos & identity */}
      <div className="card-secondary p-6 rounded-lg">
        <h3 className="text-sm font-medium text-foreground mb-4">Identity</h3>
        <div className="grid grid-cols-1 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Logo URL</span>
            <input
              type="url"
              value={branding.logoUrl || ""}
              onChange={(e) => updateField("logoUrl", e.target.value || null)}
              placeholder="https://yourcompany.com/logo.svg"
              className="h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Dark-mode logo URL (optional)</span>
            <input
              type="url"
              value={branding.logoDarkUrl || ""}
              onChange={(e) => updateField("logoDarkUrl", e.target.value || null)}
              placeholder="https://yourcompany.com/logo-dark.svg"
              className="h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Favicon URL</span>
            <input
              type="url"
              value={branding.faviconUrl || ""}
              onChange={(e) => updateField("faviconUrl", e.target.value || null)}
              placeholder="https://yourcompany.com/favicon.ico"
              className="h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">App name (white-label override)</span>
            <input
              type="text"
              value={branding.appName || ""}
              onChange={(e) => updateField("appName", e.target.value || null)}
              placeholder="Apex"
              className="h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Tagline</span>
            <input
              type="text"
              value={branding.tagline || ""}
              onChange={(e) => updateField("tagline", e.target.value || null)}
              placeholder="AI Visibility Platform"
              className="h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Support email</span>
            <input
              type="email"
              value={branding.supportEmail || ""}
              onChange={(e) => updateField("supportEmail", e.target.value || null)}
              placeholder="support@yourcompany.com"
              className="h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm"
            />
          </label>
        </div>
      </div>

      {/* Footer customization */}
      <div className="card-secondary p-6 rounded-lg">
        <h3 className="text-sm font-medium text-foreground mb-4">Footer</h3>
        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={branding.showPoweredBy}
            onChange={(e) => updateField("showPoweredBy", e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5"
          />
          <div>
            <div className="text-sm font-medium">Show &ldquo;Powered by Apex&rdquo;</div>
            <div className="text-xs text-muted-foreground">Uncheck on enterprise plans to hide Apex branding.</div>
          </div>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Custom footer text</span>
          <input
            type="text"
            value={branding.customFooterText || ""}
            onChange={(e) => updateField("customFooterText", e.target.value || null)}
            placeholder="© 2026 Your Company"
            className="h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm"
          />
        </label>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save branding"}
        </button>
      </div>
    </div>
  );
}
