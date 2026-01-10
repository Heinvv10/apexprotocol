"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Base skeleton component with pulse animation.
 * Provides visual feedback that content is loading.
 */
function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted/30 rounded",
        className
      )}
    />
  );
}

/**
 * Loading skeleton for the RichTextEditor component.
 *
 * PURPOSE
 * =======
 * This component displays while the TipTap editor chunk (~143KB) is being downloaded
 * from the server on first visit to a content creation page. It provides immediate
 * visual feedback to users that the editor is loading, preventing a blank screen or
 * layout shift.
 *
 * LOADING STATE BEHAVIOR
 * ======================
 * 1. First visit: User navigates to /dashboard/create/new
 * 2. This skeleton appears immediately (0ms)
 * 3. Browser downloads TipTap chunk in background (1-3 seconds)
 * 4. Smooth transition to actual editor once chunk loads
 * 5. Subsequent visits: Chunk is cached, editor loads instantly (<500ms)
 *
 * DESIGN APPROACH
 * ===============
 * The skeleton closely matches the actual editor's structure to minimize perceived
 * layout shift when the real editor appears:
 * - Toolbar: 19 button placeholders matching EditorToolbar layout
 * - Content area: min-h-[300px] matching the editor's minimum height
 * - Styling: Same card-secondary, borders, and spacing as real editor
 * - Animation: Subtle pulse effect to indicate active loading
 *
 * This creates a professional loading experience that feels fast and polished even
 * when downloading a 143KB chunk on slower connections.
 */
export function RichTextEditorLoading() {
  return (
    <div className="card-secondary rounded-lg overflow-hidden">
      {/*
        Toolbar skeleton - Matches EditorToolbar height and structure.
        Shows 19 button placeholders organized in the same groups as the real toolbar:
        - Undo/Redo (2)
        - Headings (3: H1, H2, H3)
        - Text Formatting (5: Bold, Italic, Underline, Strikethrough, Code)
        - Lists (3: Bullet, Numbered, Blockquote)
        - Link (1)
        - Clear Formatting (1)
        - Optimize for GEO (1)
      */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
        {/* Undo/Redo group */}
        <SkeletonPulse className="h-8 w-8 rounded" />
        <SkeletonPulse className="h-8 w-8 rounded" />

        {/* Divider */}
        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Headings group */}
        <SkeletonPulse className="h-8 w-8 rounded" />
        <SkeletonPulse className="h-8 w-8 rounded" />
        <SkeletonPulse className="h-8 w-8 rounded" />

        {/* Divider */}
        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Text formatting group */}
        <SkeletonPulse className="h-8 w-8 rounded" />
        <SkeletonPulse className="h-8 w-8 rounded" />
        <SkeletonPulse className="h-8 w-8 rounded" />
        <SkeletonPulse className="h-8 w-8 rounded" />
        <SkeletonPulse className="h-8 w-8 rounded" />

        {/* Divider */}
        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Lists group */}
        <SkeletonPulse className="h-8 w-8 rounded" />
        <SkeletonPulse className="h-8 w-8 rounded" />
        <SkeletonPulse className="h-8 w-8 rounded" />

        {/* Divider */}
        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Link button */}
        <SkeletonPulse className="h-8 w-8 rounded" />

        {/* Divider */}
        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Clear formatting */}
        <SkeletonPulse className="h-8 w-8 rounded" />

        {/* Divider */}
        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Optimize button */}
        <SkeletonPulse className="h-8 w-8 rounded" />
      </div>

      {/*
        Editor content skeleton - Matches min-h-[300px] from actual editor.
        Simulates text content with varying line widths to look like real content
        being loaded. This prevents a completely blank content area which would
        feel slower and less polished.
      */}
      <div className="min-h-[300px] p-4 space-y-3">{/* Simulated content lines with varying widths */}
        <SkeletonPulse className="w-3/4 h-4 rounded" />
        <SkeletonPulse className="w-full h-4 rounded" />
        <SkeletonPulse className="w-5/6 h-4 rounded" />
        <SkeletonPulse className="w-2/3 h-4 rounded" />
        <div className="h-4" /> {/* Empty space */}
        <SkeletonPulse className="w-4/5 h-4 rounded" />
        <SkeletonPulse className="w-full h-4 rounded" />
        <SkeletonPulse className="w-1/2 h-4 rounded" />
      </div>
    </div>
  );
}
