"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Save, Eye, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor, AISuggestionsPanel, ContentPreviewModal } from "@/components/create";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const contentTypes = [
  { value: "article", label: "Article", description: "Long-form blog post or guide" },
  { value: "faq", label: "FAQ", description: "Frequently asked questions" },
  { value: "landing", label: "Landing Page", description: "Product or service landing page" },
  { value: "product", label: "Product Page", description: "Product specifications and details" },
];

export default function NewContentPage() {
  const [title, setTitle] = React.useState("");
  const [contentType, setContentType] = React.useState("article");
  const [content, setContent] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);

  const selectedType = contentTypes.find((t) => t.value === contentType);

  const handleSave = async (status: "draft" | "published") => {
    setIsSaving(true);
    // Simulate save - in real app this would call API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Would redirect to content list or show success toast
  };

  // Calculate word count from HTML content
  const wordCount = React.useMemo(() => {
    const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return text ? text.split(" ").length : 0;
  }, [content]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/create">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">New Content</h2>
            <p className="text-muted-foreground">
              Create AI-optimized content for your brand
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={isSaving} onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave("draft")}
            disabled={isSaving || !title}
          >
            Save Draft
          </Button>
          <Button onClick={() => handleSave("published")} disabled={isSaving || !title}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Publish"}
          </Button>
        </div>
      </div>

      {/* Content Form */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main Editor */}
        <div className="space-y-4">
          {/* Title Input */}
          <div className="card-secondary p-4">
            <Input
              placeholder="Enter content title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold border-0 bg-transparent px-0 focus-visible:ring-0 placeholder:text-muted-foreground"
            />
          </div>

          {/* Rich Text Editor */}
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your AI-optimized content..."
          />

          {/* Word Count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
            <span>{wordCount} words</span>
            <span>Auto-saved</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Content Type */}
          <div className="card-secondary p-4 space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <FileText className="h-4 w-4" />
              Content Type
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>{selectedType?.label}</span>
                  <Settings className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[260px]">
                {contentTypes.map((type) => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() => setContentType(type.value)}
                    className={contentType === type.value ? "bg-accent" : ""}
                  >
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* AI Optimization Tips */}
          <div className="card-tertiary p-4 space-y-3">
            <div className="font-medium">AI Optimization Tips</div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-success mt-1">•</span>
                Use clear, descriptive headings
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-1">•</span>
                Include FAQ-style Q&A sections
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-1">•</span>
                Add structured data markup
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-1">•</span>
                Keep paragraphs concise
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-1">•</span>
                Use bullet points for lists
              </li>
            </ul>
          </div>

          {/* SEO Preview */}
          <div className="card-tertiary p-4 space-y-3">
            <div className="font-medium">Preview</div>
            <div className="bg-background/50 p-3 rounded-lg space-y-1">
              <div className="text-primary text-sm font-medium truncate">
                {title || "Your Content Title"}
              </div>
              <div className="text-xs text-muted-foreground">
                yourdomain.com/blog/{title ? title.toLowerCase().replace(/\s+/g, "-").slice(0, 30) : "..."}
              </div>
              <div className="text-xs text-foreground/70 line-clamp-2">
                {content.replace(/<[^>]*>/g, " ").slice(0, 150) || "Your content description will appear here..."}
              </div>
            </div>
          </div>

          {/* AI Suggestions Panel */}
          <AISuggestionsPanel
            onInsertSuggestion={(suggestion) => {
              setContent((prev) => prev + "\n\n" + suggestion);
            }}
          />
        </div>
      </div>

      {/* Preview Modal */}
      <ContentPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        title={title}
        content={content}
        contentType={contentType}
      />
    </div>
  );
}
