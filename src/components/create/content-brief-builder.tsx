"use client";

import * as React from "react";
import {
  FileText,
  Target,
  HelpCircle,
  List,
  Sparkles,
  BookOpen,
  LinkIcon,
  Users,
  ChevronRight,
  Check,
  Loader2,
  Copy,
  Download,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSelectedBrand } from "@/stores";
import type {
  ContentBrief,
  BriefContentType,
  QuestionBrief,
  SectionBrief,
  EntityMention,
  SchemaRecommendation,
  BriefQualityReport,
} from "@/lib/content";

// Content type options
const CONTENT_TYPES: Array<{ value: BriefContentType; label: string }> = [
  { value: "blog_post", label: "Blog Post" },
  { value: "landing_page", label: "Landing Page" },
  { value: "product_description", label: "Product Description" },
  { value: "how_to_guide", label: "How-To Guide" },
  { value: "listicle", label: "Listicle" },
  { value: "comparison", label: "Comparison" },
  { value: "case_study", label: "Case Study" },
  { value: "press_release", label: "Press Release" },
  { value: "faq_page", label: "FAQ Page" },
];

// Score Badge Component
function ScoreBadge({ score, label }: { score: number; label: string }) {
  const getColorClass = (s: number) => {
    if (s >= 80) return "text-success bg-success/10";
    if (s >= 60) return "text-warning bg-warning/10";
    return "text-error bg-error/10";
  };

  return (
    <div className="flex flex-col items-center">
      <div className={cn("px-3 py-1.5 rounded-lg font-semibold", getColorClass(score))}>
        {score}
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

// Quality Indicator Component
function QualityIndicator({ report }: { report: BriefQualityReport }) {
  const qualityColors = {
    excellent: "text-success bg-success/10 border-success/30",
    good: "text-primary bg-primary/10 border-primary/30",
    fair: "text-warning bg-warning/10 border-warning/30",
    poor: "text-error bg-error/10 border-error/30",
  };

  const severityColors = {
    error: "text-error",
    warning: "text-warning",
    info: "text-muted-foreground",
  };

  const [expanded, setExpanded] = React.useState(false);
  const errorCount = report.issues.filter((i) => i.severity === "error").length;
  const warningCount = report.issues.filter((i) => i.severity === "warning").length;

  return (
    <div className="card-tertiary p-3 space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "px-2 py-1 rounded-md text-xs font-medium border",
              qualityColors[report.overallQuality]
            )}
          >
            {report.overallQuality.charAt(0).toUpperCase() + report.overallQuality.slice(1)} Quality
          </span>
          <span className="text-sm text-muted-foreground">
            Score: <span className="font-medium text-foreground">{report.qualityScore}/100</span>
          </span>
          {errorCount > 0 && (
            <span className="text-xs text-error">
              {errorCount} error{errorCount !== 1 ? "s" : ""}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-xs text-warning">
              {warningCount} warning{warningCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            expanded && "rotate-90"
          )}
        />
      </button>

      {expanded && (
        <div className="pt-2 border-t border-border/50 space-y-2">
          {report.issues.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Issues</p>
              {report.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <AlertCircle
                    className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", severityColors[issue.severity])}
                  />
                  <div>
                    <span className={severityColors[issue.severity]}>{issue.message}</span>
                    {issue.actual !== undefined && (
                      <span className="text-muted-foreground">
                        {" "}
                        (got {issue.actual}, expected {issue.expected})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {report.suggestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Suggestions</p>
              <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                {report.suggestions.map((suggestion, i) => (
                  <li key={i} className="list-disc">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Section Card Component
function SectionCard({
  section,
  index,
}: {
  section: SectionBrief;
  index: number;
}) {
  return (
    <div className="card-tertiary p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
            H2.{index + 1}
          </span>
          <span className="font-medium text-sm">{section.heading}</span>
        </div>
        <span className="text-xs text-muted-foreground">{section.targetLength} words</span>
      </div>
      <p className="text-xs text-muted-foreground">{section.purpose}</p>
      {section.keyPoints.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1 pl-4">
          {section.keyPoints.slice(0, 3).map((point, i) => (
            <li key={i} className="list-disc">
              {point}
            </li>
          ))}
        </ul>
      )}
      {section.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {section.keywords.map((kw, i) => (
            <span
              key={i}
              className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Question Card Component
function QuestionCard({ question }: { question: QuestionBrief }) {
  return (
    <div className="card-tertiary p-3 space-y-2">
      <div className="flex items-start gap-2">
        <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm">{question.question}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {question.answerGuidelines}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Placement: {question.placement}</span>
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Snippet: {question.featuredSnippetPotential}/10
        </span>
      </div>
    </div>
  );
}

// Entity Card Component
function EntityCard({ entity }: { entity: EntityMention }) {
  const importanceColors = {
    required: "text-error bg-error/10",
    recommended: "text-warning bg-warning/10",
    optional: "text-muted-foreground bg-muted",
  };

  return (
    <div className="card-tertiary p-3 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{entity.entity}</span>
        <span className={cn("text-xs px-1.5 py-0.5 rounded", importanceColors[entity.importance])}>
          {entity.importance}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="text-muted-foreground/70">Type:</span> {entity.type}
      </p>
      <p className="text-xs text-muted-foreground italic">
        {entity.contextSuggestion}
      </p>
    </div>
  );
}

// Schema Card Component
function SchemaCard({ schema }: { schema: SchemaRecommendation }) {
  const priorityColors = {
    required: "text-error",
    recommended: "text-warning",
    optional: "text-muted-foreground",
  };

  return (
    <div className="card-tertiary p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{schema.type}</span>
        <span className={cn("text-xs", priorityColors[schema.priority])}>
          {schema.priority}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{schema.reason}</p>
      <div className="flex flex-wrap gap-1">
        {schema.requiredFields.map((field, i) => (
          <span key={i} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
            {field}
          </span>
        ))}
      </div>
    </div>
  );
}

interface ContentBriefBuilderProps {
  onBriefGenerated?: (brief: ContentBrief) => void;
  className?: string;
}

export function ContentBriefBuilder({
  onBriefGenerated,
  className,
}: ContentBriefBuilderProps) {
  const selectedBrand = useSelectedBrand();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [brief, setBrief] = React.useState<ContentBrief | null>(null);
  const [qualityReport, setQualityReport] = React.useState<BriefQualityReport | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [targetKeyword, setTargetKeyword] = React.useState("");
  const [secondaryKeywords, setSecondaryKeywords] = React.useState("");
  const [contentType, setContentType] = React.useState<BriefContentType>("blog_post");
  const [targetWordCount, setTargetWordCount] = React.useState(1500);

  const handleGenerate = async () => {
    if (!selectedBrand) {
      setError("Please select a brand first");
      return;
    }

    if (!targetKeyword.trim()) {
      setError("Please enter a target keyword");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/create/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          targetKeyword: targetKeyword.trim(),
          secondaryKeywords: secondaryKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          contentType,
          targetWordCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate brief");
      }

      setBrief(data.data);
      setQualityReport(data.quality || null);
      onBriefGenerated?.(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate brief");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyBrief = async () => {
    if (!brief) return;

    const briefText = formatBriefAsText(brief);
    await navigator.clipboard.writeText(briefText);
  };

  const handleExportBrief = () => {
    if (!brief) return;

    const briefJson = JSON.stringify(brief, null, 2);
    const blob = new Blob([briefJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-brief-${brief.targetKeyword.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Form Section */}
      <div className="card-secondary rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Content Brief Generator</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="targetKeyword">Target Keyword *</Label>
            <Input
              id="targetKeyword"
              placeholder="e.g., AI optimization strategies"
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentType">Content Type</Label>
            <Select
              value={contentType}
              onValueChange={(v) => setContentType(v as BriefContentType)}
              disabled={isGenerating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryKeywords">Secondary Keywords</Label>
            <Input
              id="secondaryKeywords"
              placeholder="keyword1, keyword2, keyword3"
              value={secondaryKeywords}
              onChange={(e) => setSecondaryKeywords(e.target.value)}
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">Separate with commas</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wordCount">Target Word Count</Label>
            <Input
              id="wordCount"
              type="number"
              min={300}
              max={10000}
              value={targetWordCount}
              onChange={(e) => setTargetWordCount(Number(e.target.value))}
              disabled={isGenerating}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-error">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedBrand}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Brief...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Brief
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Brief Display */}
      {brief && (
        <div className="space-y-4">
          {/* Brief Header */}
          <div className="card-primary rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{brief.title.primary}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {brief.metaDescription}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {brief.targetWordCount} words
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {brief.estimatedReadTime}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyBrief}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportBrief}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Predicted Scores */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-3">Predicted Scores</p>
              <div className="flex items-center justify-around">
                <ScoreBadge score={brief.predictedScores.seoScore} label="SEO" />
                <ScoreBadge score={brief.predictedScores.geoScore} label="GEO" />
                <ScoreBadge score={brief.predictedScores.aeoScore} label="AEO" />
                <ScoreBadge
                  score={brief.predictedScores.overallScore}
                  label="Overall"
                />
              </div>
            </div>
          </div>

          {/* Quality Report */}
          {qualityReport && (
            <QualityIndicator report={qualityReport} />
          )}

          {/* Content Structure */}
          <div className="card-secondary rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <List className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Content Structure</span>
            </div>
            <div className="p-3 space-y-3">
              {/* Introduction */}
              <div className="card-tertiary p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Intro
                  </span>
                  <span className="font-medium text-sm">Introduction</span>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  {brief.introduction.hook}
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 pl-4 mt-2">
                  {brief.introduction.keyPoints.map((point, i) => (
                    <li key={i} className="list-disc">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sections */}
              {brief.sections.map((section, i) => (
                <SectionCard key={i} section={section} index={i} />
              ))}

              {/* Conclusion */}
              <div className="card-tertiary p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    End
                  </span>
                  <span className="font-medium text-sm">Conclusion</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                  {brief.conclusion.summary.map((point, i) => (
                    <li key={i} className="list-disc">
                      {point}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-primary mt-2">
                  CTA: {brief.conclusion.callToAction}
                </p>
              </div>
            </div>
          </div>

          {/* Questions to Answer */}
          {brief.questionsToAnswer.length > 0 && (
            <div className="card-secondary rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-border">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Questions to Answer</span>
                <span className="text-xs text-muted-foreground">
                  ({brief.questionsToAnswer.length})
                </span>
              </div>
              <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
                {brief.questionsToAnswer.map((q, i) => (
                  <QuestionCard key={i} question={q} />
                ))}
              </div>
            </div>
          )}

          {/* Entities */}
          {brief.entities.length > 0 && (
            <div className="card-secondary rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-border">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Entities to Mention</span>
                <span className="text-xs text-muted-foreground">
                  ({brief.entities.length})
                </span>
              </div>
              <div className="p-3 grid gap-3 sm:grid-cols-2 max-h-[400px] overflow-y-auto">
                {brief.entities.map((e, i) => (
                  <EntityCard key={i} entity={e} />
                ))}
              </div>
            </div>
          )}

          {/* Recommended Schemas */}
          {brief.recommendedSchemas.length > 0 && (
            <div className="card-secondary rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-border">
                <LinkIcon className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Recommended Schema</span>
              </div>
              <div className="p-3 grid gap-3 sm:grid-cols-2">
                {brief.recommendedSchemas.map((s, i) => (
                  <SchemaCard key={i} schema={s} />
                ))}
              </div>
            </div>
          )}

          {/* Unique Angle & Competitor Gaps */}
          {(brief.uniqueAngle || brief.competitorGaps.length > 0) && (
            <div className="card-secondary rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-border">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Strategic Angle</span>
              </div>
              <div className="p-3 space-y-3">
                {brief.uniqueAngle && (
                  <div className="card-tertiary p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      Unique Angle
                    </p>
                    <p className="text-sm">{brief.uniqueAngle}</p>
                  </div>
                )}
                {brief.competitorGaps.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Competitor Gaps
                    </p>
                    {brief.competitorGaps.map((gap, i) => (
                      <div key={i} className="card-tertiary p-3 mb-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">{gap.topic}</span>
                          <span
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded",
                              gap.priority === "high"
                                ? "text-error bg-error/10"
                                : gap.priority === "medium"
                                  ? "text-warning bg-warning/10"
                                  : "text-muted-foreground bg-muted"
                            )}
                          >
                            {gap.priority}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {gap.description}
                        </p>
                        <p className="text-xs text-primary mt-1">
                          <ChevronRight className="h-3 w-3 inline" />{" "}
                          {gap.opportunity}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatBriefAsText(brief: ContentBrief): string {
  return `# Content Brief: ${brief.title.primary}

## Meta Description
${brief.metaDescription}

## Target Word Count: ${brief.targetWordCount}
## Estimated Read Time: ${brief.estimatedReadTime}

---

## Content Structure

### Introduction
${brief.introduction.hook}

Key Points:
${brief.introduction.keyPoints.map((p) => `- ${p}`).join("\n")}

### Sections
${brief.sections
  .map(
    (s, i) => `
#### H2.${i + 1}: ${s.heading}
Purpose: ${s.purpose}
Target Length: ${s.targetLength} words

Key Points:
${s.keyPoints.map((p) => `- ${p}`).join("\n")}

Keywords: ${s.keywords.join(", ")}
`
  )
  .join("\n")}

### Conclusion
${brief.conclusion.summary.map((p) => `- ${p}`).join("\n")}

CTA: ${brief.conclusion.callToAction}

---

## Questions to Answer
${brief.questionsToAnswer.map((q) => `- ${q.question}\n  Guidelines: ${q.answerGuidelines}`).join("\n\n")}

---

## Entities to Mention
${brief.entities.map((e) => `- ${e.entity} (${e.type}) - ${e.importance}: ${e.contextSuggestion}`).join("\n")}

---

## Recommended Schema
${brief.recommendedSchemas.map((s) => `- ${s.type}: ${s.reason}`).join("\n")}

---

## Predicted Scores
- SEO: ${brief.predictedScores.seoScore}
- GEO: ${brief.predictedScores.geoScore}
- AEO: ${brief.predictedScores.aeoScore}
- Overall: ${brief.predictedScores.overallScore}
`;
}
