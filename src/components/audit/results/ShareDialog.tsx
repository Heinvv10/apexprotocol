"use client";

import * as React from "react";
import { Share2, Copy, Check, Trash2, Mail, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Expiry = "7d" | "14d" | "30d" | "never";

interface ActiveShare {
  id: string;
  token: string;
  url: string;
  expiresAt: string | null;
  createdAt: string;
  viewCount: number;
}

const EXPIRY_LABEL: Record<Expiry, string> = {
  "7d": "7 days",
  "14d": "14 days",
  "30d": "30 days",
  never: "No expiry",
};

function formatExpiry(iso: string | null): string {
  if (!iso) return "No expiry";
  const date = new Date(iso);
  const days = Math.round((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Expired";
  if (days === 1) return "Expires in 1 day";
  return `Expires in ${days} days`;
}

export function ShareDialog({ auditId }: { auditId: string }) {
  const [open, setOpen] = React.useState(false);
  const [expiry, setExpiry] = React.useState<Expiry>("30d");
  const [creating, setCreating] = React.useState(false);
  const [shares, setShares] = React.useState<ActiveShare[]>([]);
  const [loadingList, setLoadingList] = React.useState(false);
  const [latestUrl, setLatestUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [emailTo, setEmailTo] = React.useState("");
  const [emailNote, setEmailNote] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const loadShares = React.useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/audit/${auditId}/share`);
      if (!res.ok) throw new Error("Failed to load shares");
      const data = await res.json();
      setShares(data.shares ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load shares");
    } finally {
      setLoadingList(false);
    }
  }, [auditId]);

  React.useEffect(() => {
    if (open) loadShares();
  }, [open, loadShares]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/audit/${auditId}/share`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expiry }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create share link");
      }
      const data = await res.json();
      setLatestUrl(data.url);
      toast.success("Share link created");
      await loadShares();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create share link");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleRevoke = async (token: string) => {
    try {
      const res = await fetch(`/api/audit/share/${token}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      toast.success("Share link revoked");
      if (latestUrl?.includes(token)) setLatestUrl(null);
      await loadShares();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke");
    }
  };

  const handleSendEmail = async () => {
    if (!latestUrl) return;
    const token = latestUrl.split("/").pop();
    if (!token) return;
    setSending(true);
    try {
      const res = await fetch(`/api/audit/share/${token}/email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: emailTo.trim(), message: emailNote.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send email");
      }
      toast.success(`Report sent to ${emailTo.trim()}`);
      setEmailTo("");
      setEmailNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Share this report</DialogTitle>
          <DialogDescription>
            Create a read-only link. Recipients see only the report — no dashboard or settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Link expires after</p>
            <div className="grid grid-cols-4 gap-2">
              {(["7d", "14d", "30d", "never"] as Expiry[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setExpiry(opt)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    expiry === opt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {EXPIRY_LABEL[opt]}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleCreate} disabled={creating} className="w-full gap-2">
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            Create share link
          </Button>

          {latestUrl && (
            <Tabs defaultValue="copy">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="copy" className="gap-2">
                  <Copy className="h-3.5 w-3.5" /> Copy link
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="h-3.5 w-3.5" /> Send email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="copy" className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
                  <Input
                    readOnly
                    value={latestUrl}
                    className="border-0 bg-transparent font-mono text-xs focus-visible:ring-0"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy(latestUrl)}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Recipient email
                  </label>
                  <Input
                    type="email"
                    placeholder="client@example.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Message (optional)
                  </label>
                  <Textarea
                    placeholder="Hi — here's the latest AI visibility report for your review."
                    value={emailNote}
                    onChange={(e) => setEmailNote(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSendEmail}
                  disabled={sending || !emailTo.trim()}
                  className="w-full gap-2"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Send email
                </Button>
              </TabsContent>
            </Tabs>
          )}

          {(loadingList || shares.length > 0) && (
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-sm font-medium">Active share links</p>
              {loadingList ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ul className="space-y-2">
                  {shares.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {s.url}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatExpiry(s.expiresAt)} · {s.viewCount}{" "}
                          {s.viewCount === 1 ? "view" : "views"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => handleCopy(s.url)}
                        aria-label="Copy link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-error hover:text-error"
                        onClick={() => handleRevoke(s.token)}
                        aria-label="Revoke link"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
