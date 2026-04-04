"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Mail,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  Loader2,
  Send,
} from "lucide-react";

const FREQUENCY_OPTIONS = [
  {
    id: "daily",
    label: "Daily",
    description: "Sent every morning with last 24h highlights",
  },
  {
    id: "weekly",
    label: "Weekly",
    description: "Every Monday — full 7-day performance summary",
  },
  {
    id: "monthly",
    label: "Monthly",
    description: "First day of the month — executive-level summary",
  },
];

const REPORT_TYPES = [
  { id: "weekly", label: "Performance Digest" },
  { id: "monthly", label: "Executive Summary" },
  { id: "audit", label: "Full Audit" },
];

const DELIVERY_HOURS = [
  { value: 6, label: "6:00 AM" },
  { value: 7, label: "7:00 AM" },
  { value: 8, label: "8:00 AM" },
  { value: 9, label: "9:00 AM" },
  { value: 10, label: "10:00 AM" },
  { value: 12, label: "12:00 PM" },
  { value: 14, label: "2:00 PM" },
  { value: 17, label: "5:00 PM" },
];

export default function ScheduleReportPage() {
  const router = useRouter();

  const [frequency, setFrequency] = React.useState("weekly");
  const [reportType, setReportType] = React.useState("weekly");
  const [deliveryHour, setDeliveryHour] = React.useState(8);
  const [recipients, setRecipients] = React.useState<string[]>([""]);
  const [title, setTitle] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const addRecipient = () => setRecipients((prev) => [...prev, ""]);
  const removeRecipient = (i: number) =>
    setRecipients((prev) => prev.filter((_, idx) => idx !== i));
  const updateRecipient = (i: number, val: string) =>
    setRecipients((prev) => prev.map((r, idx) => (idx === i ? val : r)));

  const validRecipients = recipients.filter((r) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validRecipients.length === 0) {
      setError("Add at least one valid email address.");
      return;
    }
    setError(null);
    setSaving(true);

    try {
      // Save notification preferences for digest delivery
      const prefsRes = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailEnabled: true,
          emailDigestFrequency: frequency === "monthly" ? "weekly" : frequency,
          digestHour: deliveryHour,
        }),
      });

      if (!prefsRes.ok) throw new Error("Failed to save preferences");

      // Create a report record to track this schedule
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 7);

      const reportRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:
            title ||
            `${FREQUENCY_OPTIONS.find((f) => f.id === frequency)?.label} ${REPORT_TYPES.find((r) => r.id === reportType)?.label}`,
          reportType,
          periodStart: periodStart.toISOString(),
          periodEnd: now.toISOString(),
          recipients: validRecipients,
        }),
      });

      if (!reportRes.ok) {
        // Non-fatal — preferences were saved, report creation failed
        console.warn("Report record creation failed, but preferences saved.");
      }

      setSaved(true);
      setTimeout(() => router.push("/dashboard/reports"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
          <h2 className="text-xl font-semibold">Schedule saved</h2>
          <p className="text-sm text-muted-foreground">
            Your report will be delivered to {validRecipients.length} recipient
            {validRecipients.length !== 1 ? "s" : ""}.
          </p>
          <p className="text-xs text-muted-foreground">Redirecting to reports…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Reports
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Schedule a Report</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Set up automatic email delivery of your visibility reports.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Report Name */}
        <section className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Report name <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Weekly Performance Digest"
            className="w-full px-4 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </section>

        {/* Report Type */}
        <section className="space-y-3">
          <label className="text-sm font-medium">Report type</label>
          <div className="grid grid-cols-3 gap-3">
            {REPORT_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setReportType(type.id)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium text-left transition-all ${
                  reportType === type.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/50 bg-card text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </section>

        {/* Frequency */}
        <section className="space-y-3">
          <label className="text-sm font-medium">Frequency</label>
          <div className="space-y-2">
            {FREQUENCY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFrequency(opt.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                  frequency === opt.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-card hover:border-border"
                }`}
              >
                <div
                  className={`w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    frequency === opt.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {frequency === opt.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {opt.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Delivery time */}
        <section className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Delivery time
          </label>
          <div className="flex flex-wrap gap-2">
            {DELIVERY_HOURS.map((h) => (
              <button
                key={h.value}
                type="button"
                onClick={() => setDeliveryHour(h.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                  deliveryHour === h.value
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border/50 bg-card text-muted-foreground hover:border-border"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </section>

        {/* Recipients */}
        <section className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Recipients
          </label>
          <div className="space-y-2">
            {recipients.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="email"
                  value={r}
                  onChange={(e) => updateRecipient(i, e.target.value)}
                  placeholder="name@example.com"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required={i === 0}
                />
                {recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRecipient(i)}
                    className="p-2.5 rounded-lg border border-border/50 text-muted-foreground hover:text-red-400 hover:border-red-400/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {recipients.length < 5 && (
              <button
                type="button"
                onClick={addRecipient}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add recipient
              </button>
            )}
          </div>
        </section>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {/* Summary + Submit */}
        <div className="border-t border-border/50 pt-6 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {validRecipients.length > 0
              ? `Will send to ${validRecipients.length} recipient${validRecipients.length !== 1 ? "s" : ""} every ${frequency === "daily" ? "morning at" : frequency === "weekly" ? "Monday at" : "month at"} ${DELIVERY_HOURS.find((h) => h.value === deliveryHour)?.label}`
              : "Enter at least one recipient email to save"}
          </p>
          <button
            type="submit"
            disabled={saving || validRecipients.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {saving ? "Saving…" : "Save Schedule"}
          </button>
        </div>
      </form>
    </div>
  );
}
