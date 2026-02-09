"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PlatformPicker } from "./platform-picker";
import { useSimulationStore } from "@/stores/simulation-store";
import { useCreateSimulation } from "@/hooks/useSimulation";
import { useSelectedBrand } from "@/stores";
import { FlaskConical, Loader2 } from "lucide-react";

const CONTENT_TYPES = [
  { value: "", label: "Select type..." },
  { value: "blog", label: "Blog Post" },
  { value: "faq", label: "FAQ" },
  { value: "product", label: "Product Page" },
  { value: "landing", label: "Landing Page" },
  { value: "press_release", label: "Press Release" },
  { value: "whitepaper", label: "Whitepaper" },
  { value: "case_study", label: "Case Study" },
];

export function SimulationSetupForm() {
  const selectedBrand = useSelectedBrand();
  const { form, updateForm, setStep, setActiveSimulationId } = useSimulationStore();
  const createMutation = useCreateSimulation();

  const canSubmit =
    form.query.trim() &&
    form.contentBody.trim() &&
    form.platforms.length > 0 &&
    selectedBrand?.id &&
    !createMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedBrand) return;

    try {
      const result = await createMutation.mutateAsync({
        brandId: selectedBrand.id,
        query: form.query,
        contentTitle: form.contentTitle || undefined,
        contentBody: form.contentBody,
        contentType: form.contentType || undefined,
        variantBTitle: form.enableAB ? form.variantBTitle || undefined : undefined,
        variantBBody: form.enableAB ? form.variantBBody || undefined : undefined,
        platforms: form.platforms,
      });

      setActiveSimulationId(result.id);
      setStep("running");
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card-primary space-y-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Test Before Publish</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Simulate how your draft content will impact brand visibility across AI platforms.
          We&apos;ll compare scores with and without your content to predict its impact.
        </p>
      </div>

      {/* Query */}
      <div className="space-y-2">
        <Label htmlFor="sim-query">Search Query</Label>
        <Input
          id="sim-query"
          placeholder="e.g., What are the best tools for project management?"
          value={form.query}
          onChange={(e) => updateForm({ query: e.target.value })}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          The question users would ask AI platforms about your industry
        </p>
      </div>

      {/* Content Type */}
      <div className="space-y-2">
        <Label htmlFor="sim-content-type">Content Type</Label>
        <select
          id="sim-content-type"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={form.contentType}
          onChange={(e) => updateForm({ contentType: e.target.value })}
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content Title */}
      <div className="space-y-2">
        <Label htmlFor="sim-title">Content Title (optional)</Label>
        <Input
          id="sim-title"
          placeholder="e.g., The Ultimate Guide to Project Management in 2026"
          value={form.contentTitle}
          onChange={(e) => updateForm({ contentTitle: e.target.value })}
          maxLength={200}
        />
      </div>

      {/* Content Body */}
      <div className="space-y-2">
        <Label htmlFor="sim-body">Content Body</Label>
        <Textarea
          id="sim-body"
          placeholder="Paste your draft content here..."
          value={form.contentBody}
          onChange={(e) => updateForm({ contentBody: e.target.value })}
          rows={8}
          maxLength={10000}
        />
        <p className="text-xs text-muted-foreground">
          {form.contentBody.length}/10,000 characters
        </p>
      </div>

      {/* A/B Toggle */}
      <div className="card-secondary space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>A/B Test</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compare two content variants side by side
            </p>
          </div>
          <Switch
            checked={form.enableAB}
            onCheckedChange={(checked) => updateForm({ enableAB: checked })}
          />
        </div>

        {form.enableAB && (
          <div className="space-y-4 pt-2 border-t border-white/10">
            <div className="space-y-2">
              <Label htmlFor="sim-b-title">Variant B Title (optional)</Label>
              <Input
                id="sim-b-title"
                placeholder="Alternative title..."
                value={form.variantBTitle}
                onChange={(e) => updateForm({ variantBTitle: e.target.value })}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sim-b-body">Variant B Content</Label>
              <Textarea
                id="sim-b-body"
                placeholder="Paste your alternative content here..."
                value={form.variantBBody}
                onChange={(e) => updateForm({ variantBBody: e.target.value })}
                rows={6}
                maxLength={10000}
              />
            </div>
          </div>
        )}
      </div>

      {/* Platform Picker */}
      <PlatformPicker
        selected={form.platforms}
        onChange={(platforms) => updateForm({ platforms })}
      />

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {createMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Starting Simulation...
          </>
        ) : (
          <>
            <FlaskConical className="w-4 h-4 mr-2" />
            Run Simulation ({form.platforms.length} platform{form.platforms.length !== 1 ? "s" : ""})
          </>
        )}
      </Button>

      {createMutation.isError && (
        <p className="text-sm text-error text-center">
          {createMutation.error?.message || "Failed to create simulation"}
        </p>
      )}
    </form>
  );
}
