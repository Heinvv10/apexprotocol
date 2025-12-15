"use client";

import * as React from "react";
import { FileText, Edit3, Trash2, Eye, MoreVertical, Clock, Calendar, Check, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ContentStatus = "draft" | "published" | "scheduled" | "archived";
export type ContentType = "article" | "faq" | "landing" | "product";

export interface ContentItem {
  id: string;
  title: string;
  excerpt: string;
  status: ContentStatus;
  type: ContentType;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  aiScore?: number;
  scheduledFor?: string;
}

interface ContentCardProps {
  content: ContentItem;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: ContentStatus) => void;
  className?: string;
}

const statusConfig: Record<
  ContentStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  draft: {
    label: "Draft",
    icon: Edit3,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  published: {
    label: "Published",
    icon: Check,
    className: "bg-success/10 text-success border-success/20",
  },
  scheduled: {
    label: "Scheduled",
    icon: Clock,
    className: "bg-accent-blue/10 text-accent-blue border-accent-blue/20",
  },
  archived: {
    label: "Archived",
    icon: AlertCircle,
    className: "bg-muted text-muted-foreground border-border",
  },
};

const typeConfig: Record<ContentType, { label: string; color: string }> = {
  article: { label: "Article", color: "text-primary" },
  faq: { label: "FAQ", color: "text-accent-blue" },
  landing: { label: "Landing Page", color: "text-accent-pink" },
  product: { label: "Product", color: "text-success" },
};

export function ContentCard({
  content,
  onDelete,
  onStatusChange,
  className,
}: ContentCardProps) {
  const StatusIcon = statusConfig[content.status].icon;
  const statusStyle = statusConfig[content.status];

  return (
    <div
      className={cn(
        "card-secondary group hover:border-primary/30 transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>

          {/* Content Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/dashboard/create/${content.id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors truncate"
              >
                {content.title}
              </Link>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full border",
                  statusStyle.className
                )}
              >
                <span className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusStyle.label}
                </span>
              </span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {content.excerpt}
            </p>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className={cn("font-medium", typeConfig[content.type].color)}>
                {typeConfig[content.type].label}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {content.updatedAt}
              </span>
              <span>{content.wordCount.toLocaleString()} words</span>
              {content.aiScore !== undefined && (
                <span className="flex items-center gap-1 text-success">
                  AI Score: {content.aiScore}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/create/${content.id}/preview`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/dashboard/create/${content.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit3 className="h-4 w-4" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onStatusChange?.(content.id, "published")}
                disabled={content.status === "published"}
              >
                <Check className="h-4 w-4 mr-2" />
                Publish
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange?.(content.id, "draft")}
                disabled={content.status === "draft"}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Move to Draft
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange?.(content.id, "archived")}
                disabled={content.status === "archived"}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(content.id)}
                className="text-error focus:text-error"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
