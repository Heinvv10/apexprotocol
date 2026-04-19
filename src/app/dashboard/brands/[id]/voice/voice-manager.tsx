"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BrandVoiceDescriptor } from "@/lib/db/schema";

interface SampleRow {
  id: string;
  label: string;
  sourceType: "paste" | "url" | "upload";
  sourceUrl: string | null;
  rawText: string;
  descriptor: BrandVoiceDescriptor | null;
  extractionError: string | null;
  extractedAt: string | null;
  createdAt: string;
}

export function VoiceManager({
  brandId,
  initialSamples,
}: {
  brandId: string;
  initialSamples: SampleRow[];
}) {
  const [samples, setSamples] = useState<SampleRow[]>(initialSamples);
  const [label, setLabel] = useState("");
  const [rawText, setRawText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const canAddMore = samples.length < 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canAddMore) {
      setError("Maximum 5 samples per brand. Delete one first.");
      return;
    }
    if (rawText.trim().length < 200) {
      setError("Sample must be at least 200 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/brands/${brandId}/voice-samples`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || "Untitled sample",
          sourceType: sourceUrl.trim() ? "url" : "paste",
          sourceUrl: sourceUrl.trim() || null,
          rawText,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(
          body?.message ?? body?.error ?? `Request failed (${res.status})`,
        );
        return;
      }
      setSamples((prev) => [
        {
          id: body.data.id,
          label: body.data.label,
          sourceType: sourceUrl.trim() ? "url" : "paste",
          sourceUrl: sourceUrl.trim() || null,
          rawText,
          descriptor: body.data.descriptor,
          extractionError: body.data.extractionError ?? null,
          extractedAt: body.data.extractedAt ?? null,
          createdAt: body.data.createdAt,
        },
        ...prev,
      ]);
      setLabel("");
      setRawText("");
      setSourceUrl("");
      startTransition(() => router.refresh());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(sampleId: string) {
    const res = await fetch(
      `/api/brands/${brandId}/voice-samples/${sampleId}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setSamples((prev) => prev.filter((s) => s.id !== sampleId));
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium text-foreground">
          Add a new sample {samples.length > 0 && <span className="text-sm text-muted-foreground">({samples.length}/5)</span>}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="label" className="mb-1 block text-sm font-medium text-foreground">
              Label
            </label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={100}
              placeholder="e.g. Homepage hero, Founder letter"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label htmlFor="url" className="mb-1 block text-sm font-medium text-foreground">
              Source URL <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="url"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://your-brand.com/about"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label htmlFor="text" className="mb-1 block text-sm font-medium text-foreground">
              Writing sample ({rawText.length.toLocaleString()} / 40,000 chars)
            </label>
            <textarea
              id="text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              minLength={200}
              maxLength={40_000}
              rows={12}
              required
              placeholder="Paste a representative piece of your brand's writing — ideally a full page or blog post."
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground"
            />
          </div>
          {error && (
            <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || !canAddMore}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Extracting voice… (~10s)" : "Add sample & extract"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          Extracted voice descriptors
        </h2>
        {samples.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No samples yet. Add one above to start building this brand&apos;s voice profile.
          </p>
        ) : (
          samples.map((s) => <SampleCard key={s.id} sample={s} onDelete={handleDelete} />)
        )}
      </section>
    </div>
  );
}

function SampleCard({
  sample,
  onDelete,
}: {
  sample: SampleRow;
  onDelete: (id: string) => void;
}) {
  const d = sample.descriptor;
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-foreground">{sample.label}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {sample.sourceType === "url" && sample.sourceUrl ? (
              <a href={sample.sourceUrl} className="hover:underline" target="_blank" rel="noopener noreferrer">
                {sample.sourceUrl}
              </a>
            ) : (
              `${sample.rawText.length.toLocaleString()} characters · added ${new Date(sample.createdAt).toLocaleDateString()}`
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(sample.id)}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Delete
        </button>
      </div>

      {sample.extractionError && (
        <div className="mb-3 rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          Extraction failed: {sample.extractionError}
        </div>
      )}

      {d && (
        <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="font-medium text-muted-foreground">Tone</dt>
            <dd className="mt-0.5 text-foreground">{d.tone}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Perspective</dt>
            <dd className="mt-0.5 text-foreground">{d.perspective.replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Formality</dt>
            <dd className="mt-0.5 text-foreground">{d.formality}/10</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Reading level</dt>
            <dd className="mt-0.5 text-foreground">grade {d.readingLevel}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Avg sentence</dt>
            <dd className="mt-0.5 text-foreground">
              ~{Math.round(d.avgSentenceLength)} words (std dev ~{Math.round(d.sentenceLengthStdev)})
            </dd>
          </div>
          {d.vocabulary.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="font-medium text-muted-foreground">Vocabulary</dt>
              <dd className="mt-0.5 text-foreground">{d.vocabulary.join(" · ")}</dd>
            </div>
          )}
          {d.signaturePhrases.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="font-medium text-muted-foreground">Signature phrases</dt>
              <dd className="mt-0.5 text-foreground">
                {d.signaturePhrases.map((p) => `"${p}"`).join(" · ")}
              </dd>
            </div>
          )}
          {d.avoid.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="font-medium text-muted-foreground">Avoid</dt>
              <dd className="mt-0.5 text-foreground">
                {d.avoid.map((p) => `"${p}"`).join(" · ")}
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
