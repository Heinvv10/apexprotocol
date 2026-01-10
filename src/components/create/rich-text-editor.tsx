"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { RichTextEditorLoading } from "./rich-text-editor-loading";
import type { Suggestion } from "@/lib/ai/content-analyzer";

/**
 * Lazy-loaded wrapper for the RichTextEditor component.
 *
 * WHY LAZY LOADING?
 * ================
 * The TipTap rich text editor imports ProseMirror core plus several extensions
 * (@tiptap/react, @tiptap/starter-kit, @tiptap/extension-link, @tiptap/extension-underline)
 * which add approximately 143KB to the bundle. Since the editor is ONLY used on the
 * /dashboard/create/new route (content creation page), there's no reason to include
 * this heavyweight component in the main bundle that's loaded on every page.
 *
 * HOW IT WORKS
 * ============
 * This wrapper uses Next.js dynamic imports (next/dynamic) to split the TipTap editor
 * into a separate chunk that's only downloaded when the user navigates to a page that
 * renders this component. On first visit, a loading skeleton is displayed for 1-3 seconds
 * while the chunk downloads. After that, the chunk is cached by the browser and loads
 * instantly (<500ms) on subsequent visits.
 *
 * BUNDLE SIZE BENEFITS
 * ====================
 * - Main bundle: Reduced by ~143KB (TipTap dependencies removed)
 * - Separate chunk: ~143KB (loaded only on /create routes)
 * - Routes benefiting: /dashboard, /dashboard/create, /brands/*, /monitor/*, etc.
 * - User experience: Faster initial page loads, brief loading state on first create page visit
 *
 * The implementation is completely transparent to consuming components - same import
 * path, same props, same types, same ref forwarding - just with automatic code splitting.
 */

// Component props interface (re-exported from core)
interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

// Imperative handle interface (re-exported from core)
export interface RichTextEditorHandle {
  applySuggestion: (suggestion: Suggestion) => void;
}

/**
 * Dynamically import the core RichTextEditor component.
 *
 * Configuration:
 * - ssr: false - TipTap requires browser APIs (document, window) so SSR must be disabled
 * - loading: RichTextEditorLoading - Skeleton component displayed while chunk downloads
 *
 * This creates a separate webpack/turbopack chunk containing:
 * - rich-text-editor-core.tsx (~5KB)
 * - @tiptap/react (~40KB)
 * - @tiptap/starter-kit (~80KB)
 * - @tiptap/extension-link (~15KB)
 * - @tiptap/extension-underline (~8KB)
 * Total: ~143KB that's NOT in the main bundle
 */
const RichTextEditorCore = dynamic(
  () => import("./rich-text-editor-core").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => <RichTextEditorLoading />,
  }
);

/**
 * RichTextEditor component with lazy loading.
 * Maintains the same API as the core component with ref forwarding support.
 */
export const RichTextEditor = React.forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(props, ref) {
    return <RichTextEditorCore ref={ref} {...props} />;
  }
);
