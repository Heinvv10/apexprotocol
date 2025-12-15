"use client";

import * as React from "react";
import { X, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ContentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  contentType: string;
}

export function ContentPreviewModal({
  open,
  onOpenChange,
  title,
  content,
  contentType,
}: ContentPreviewModalProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    // Strip HTML tags for plain text copy
    const plainText = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Word count from HTML content
  const wordCount = React.useMemo(() => {
    const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return text ? text.split(" ").length : 0;
  }, [content]);

  // Reading time estimate (average 200 words per minute)
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold pr-8">
              {title || "Untitled Content"}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span className="capitalize">{contentType}</span>
            <span>•</span>
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{readingTime} min read</span>
          </div>
        </DialogHeader>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto mt-4">
          <div
            className={cn(
              "prose prose-invert max-w-none",
              "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6",
              "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5",
              "[&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4",
              "[&_p]:mb-3 [&_p]:leading-relaxed",
              "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3",
              "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3",
              "[&_li]:mb-1",
              "[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4",
              "[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm",
              "[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4",
              "[&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80"
            )}
            dangerouslySetInnerHTML={{ __html: content || "<p class='text-muted-foreground'>No content to preview</p>" }}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4 flex-shrink-0">
          <div className="text-xs text-muted-foreground">
            Preview mode - content rendered as it will appear
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Text
                </>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Full Preview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
