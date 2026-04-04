"use client";

import * as React from "react";
import { X, Loader2, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Audit } from "@/hooks/useAudit";

type AuditIssueItem = NonNullable<Audit["issues"]>[number];

interface IssueFixModalProps {
  issue: AuditIssueItem | null;
  actionType: "ai-generate" | "view-guide" | "custom" | null;
  auditUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export function IssueFixModal({ issue, actionType, auditUrl, isOpen, onClose }: IssueFixModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !issue || !actionType) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine modal content based on action type
  const getModalContent = () => {
    switch (actionType) {
      case "ai-generate":
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Generate Fix with AI</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We'll use AI to generate a fix for this issue and guide you through implementation.
              </p>
            </div>

            <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Issue</p>
                <p className="text-sm">{issue.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">URL</p>
                <p className="text-sm truncate">{auditUrl}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Recommendation</p>
                <p className="text-sm">{issue.recommendation || "No recommendation available"}</p>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Next step:</strong> Click "Generate with AI" to open the content creation tool with this issue's context pre-filled.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Link href={`/dashboard/create?context=${encodeURIComponent(JSON.stringify({ issue, auditUrl }))}`}>
                <Button className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Generate with AI
                </Button>
              </Link>
            </div>
          </div>
        );

      case "view-guide":
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">How to Fix: {issue.title}</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{issue.description}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Recommended Fix</p>
                <div className="bg-muted/30 p-3 rounded text-sm">
                  {issue.recommendation || "Follow industry best practices for this issue type."}
                </div>
              </div>

              {issue.affectedPages && issue.affectedPages.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Affected Pages ({issue.affectedPages.length})
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    <ul className="text-sm space-y-1">
                      {issue.affectedPages.slice(0, 5).map((page: string) => (
                        <li key={page} className="text-muted-foreground truncate">
                          • {page}
                        </li>
                      ))}
                      {issue.affectedPages.length > 5 && (
                        <li className="text-muted-foreground">
                          • +{issue.affectedPages.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              <div className="bg-warning/5 border border-warning/20 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  ⏱️ <strong>Estimated time:</strong> 15-30 minutes to implement
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Link href={`/dashboard/create?context=${encodeURIComponent(JSON.stringify({ issue, auditUrl }))}`}>
                <Button className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Get AI Help
                </Button>
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-md w-full mx-4">
        <div className="card-primary rounded-lg p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Fix Issue</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {getModalContent()}
        </div>
      </div>
    </>
  );
}
