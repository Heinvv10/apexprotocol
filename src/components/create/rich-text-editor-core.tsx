"use client";

import * as React from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  RemoveFormatting,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOptimizationStore, useHasSuggestions, useIsAnalyzing, useOptimizationError, useAnalysisResult } from "@/lib/stores/optimization-store";
import { applySuggestion, type Suggestion } from "@/lib/ai/content-analyzer";
import { SuggestionPanel } from "@/components/optimization/suggestion-panel";

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-8 w-8 p-0",
        isActive && "bg-accent text-accent-foreground"
      )}
    >
      {children}
    </Button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-1" />;
}

interface EditorToolbarProps {
  editor: Editor | null;
  onOptimize: () => Promise<void>;
  isOptimizing: boolean;
}

function EditorToolbar({ editor, onOptimize, isOptimizing }: EditorToolbarProps) {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Inline Code"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Links */}
      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive("link")}
        title="Add Link"
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Clear Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Clear Formatting"
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Optimize for GEO */}
      <ToolbarButton
        onClick={onOptimize}
        disabled={isOptimizing}
        title="Optimize for GEO"
      >
        {isOptimizing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </ToolbarButton>
    </div>
  );
}

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export interface RichTextEditorHandle {
  applySuggestion: (suggestion: Suggestion) => void;
}

export const RichTextEditor = React.forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor({
    content = "",
    onChange,
    placeholder = "Start writing your content...",
    className,
    editable = true,
  }: RichTextEditorProps, ref) {
  // Optimization store hooks
  const hasSuggestions = useHasSuggestions();
  const isAnalyzing = useIsAnalyzing();
  const error = useOptimizationError();
  const analysisResult = useAnalysisResult();
  const { clearSuggestions, setAnalysisResult, setSuggestions, setAnalyzing, setError } = useOptimizationStore();

  // Local state for optimization
  const [isOptimizing, setIsOptimizing] = React.useState(false);

  // Determine if panel should be shown
  const showPanel = hasSuggestions || isAnalyzing || error !== null || analysisResult !== null;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer hover:text-primary/80",
        },
      }),
      Underline,
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none min-h-[300px] p-4 focus:outline-none",
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
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Handler for optimizing content
  const handleOptimize = React.useCallback(async () => {
    if (!editor) return;

    try {
      setIsOptimizing(true);
      setAnalyzing(true);
      setError(null);

      const content = editor.getHTML();

      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to analyze content" }));
        throw new Error(errorData.error || "Failed to analyze content");
      }

      const data = await response.json();

      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }

      if (data.analysis) {
        setAnalysisResult(data.analysis);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to optimize content";
      setError(errorMessage);
    } finally {
      setIsOptimizing(false);
      setAnalyzing(false);
    }
  }, [editor, setAnalyzing, setError, setSuggestions, setAnalysisResult]);

  // Expose applySuggestion method to parent via ref
  React.useImperativeHandle(ref, () => ({
    applySuggestion: (suggestion: Suggestion) => {
      if (!editor) {
        console.error("Editor not initialized");
        return;
      }

      try {
        const currentContent = editor.getHTML();
        const updatedContent = applySuggestion(currentContent, suggestion);

        // Update editor content
        editor.commands.setContent(updatedContent);

        // Trigger onChange to sync with parent state
        onChange?.(updatedContent);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to apply suggestion";
        console.error("Error applying suggestion:", errorMessage);
        throw error;
      }
    },
  }), [editor, onChange]);

  // Handler for applying suggestions from the panel
  const handleApplySuggestion = (suggestion: Suggestion) => {
    if (!editor) {
      console.error("Editor not initialized");
      return;
    }

    try {
      const currentContent = editor.getHTML();
      const updatedContent = applySuggestion(currentContent, suggestion);

      // Update editor content
      editor.commands.setContent(updatedContent);

      // Trigger onChange to sync with parent state
      onChange?.(updatedContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to apply suggestion";
      console.error("Error applying suggestion:", errorMessage);
    }
  };

  // Handler for closing the suggestion panel
  const handleClosePanel = () => {
    clearSuggestions();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="card-secondary rounded-lg overflow-hidden">
        <EditorToolbar
          editor={editor}
          onOptimize={handleOptimize}
          isOptimizing={isOptimizing}
        />
        <EditorContent editor={editor} />
        {editor?.isEmpty && (
          <div className="absolute top-[60px] left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Suggestion Panel - appears after optimization */}
      {showPanel && (
        <SuggestionPanel
          onApply={handleApplySuggestion}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
});
