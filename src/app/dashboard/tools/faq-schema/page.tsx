"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2, Copy, Check, ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

function mkId() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Build the FAQPage JSON-LD block. Follows the Google-documented shape:
 * https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */
function buildJsonLd(items: FAQItem[]): string {
  const clean = items
    .filter((x) => x.question.trim() && x.answer.trim())
    .map((x) => ({
      "@type": "Question",
      name: x.question.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: x.answer.trim(),
      },
    }));
  if (clean.length === 0) return "";
  const doc = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: clean,
  };
  return `<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>`;
}

export default function FaqSchemaPage() {
  const [items, setItems] = React.useState<FAQItem[]>([
    { id: mkId(), question: "", answer: "" },
    { id: mkId(), question: "", answer: "" },
    { id: mkId(), question: "", answer: "" },
  ]);
  const [copied, setCopied] = React.useState(false);

  const addRow = () => setItems((xs) => [...xs, { id: mkId(), question: "", answer: "" }]);
  const removeRow = (id: string) =>
    setItems((xs) => (xs.length > 1 ? xs.filter((x) => x.id !== id) : xs));
  const update = (id: string, patch: Partial<FAQItem>) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const jsonLd = React.useMemo(() => buildJsonLd(items), [items]);
  const validCount = items.filter((x) => x.question.trim() && x.answer.trim()).length;

  const copy = async () => {
    if (!jsonLd) return;
    await navigator.clipboard.writeText(jsonLd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <Link href="/dashboard/competitive/roadmap" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-3 w-3" /> Back to roadmap
        </Link>
        <h1 className="text-2xl font-semibold">FAQ Schema Generator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste your questions and answers. We&apos;ll produce ready-to-deploy JSON-LD that
          makes your FAQ content citable by AI platforms and eligible for rich results in Google.
        </p>
      </div>

      <div className="card-secondary p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Questions &amp; Answers</div>
          <div className="text-xs text-muted-foreground">
            {validCount} of {items.length} complete
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-lg border border-border/50 p-4 space-y-3 bg-muted/10"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">
                  Question {idx + 1}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(item.id)}
                  disabled={items.length <= 1}
                  className="h-7 w-7"
                  aria-label={`Remove question ${idx + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Question</label>
                <Input
                  value={item.question}
                  onChange={(e) => update(item.id, { question: e.target.value })}
                  placeholder="e.g. What is your refund policy?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Answer</label>
                <textarea
                  value={item.answer}
                  onChange={(e) => update(item.id, { answer: e.target.value })}
                  placeholder="Direct, 2-3 sentence answer. Include specific facts where possible."
                  rows={3}
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="text-[10px] text-muted-foreground text-right">
                  {item.answer.trim().split(/\s+/).filter(Boolean).length} words
                  {" · "}
                  Target: &lt; 60 words
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addRow} className="gap-2">
          <Plus className="h-4 w-4" /> Add question
        </Button>
      </div>

      {jsonLd && (
        <div className="card-secondary p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Generated JSON-LD</div>
              <div className="text-xs text-muted-foreground">
                Paste this inside the <code>&lt;head&gt;</code> of the page containing these FAQs.
              </div>
            </div>
            <Button onClick={copy} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="rounded-md bg-muted/40 border border-border/50 p-3 text-xs overflow-x-auto leading-relaxed">
            <code>{jsonLd}</code>
          </pre>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <span>Next step: validate with</span>
            <a
              href="https://search.google.com/test/rich-results"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Google Rich Results Test <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {!jsonLd && (
        <div className="card-secondary p-5 text-center text-sm text-muted-foreground">
          Fill in at least one question + answer to generate the JSON-LD.
        </div>
      )}
    </div>
  );
}
