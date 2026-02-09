"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { id: "chatgpt", label: "ChatGPT", icon: "🤖" },
  { id: "claude", label: "Claude", icon: "🟣" },
  { id: "gemini", label: "Gemini", icon: "🔵" },
  { id: "perplexity", label: "Perplexity", icon: "🔍" },
  { id: "grok", label: "Grok", icon: "⚡" },
  { id: "deepseek", label: "DeepSeek", icon: "🌊" },
  { id: "copilot", label: "Copilot", icon: "🪟" },
];

interface PlatformPickerProps {
  selected: string[];
  onChange: (platforms: string[]) => void;
}

export function PlatformPicker({ selected, onChange }: PlatformPickerProps) {
  const allSelected = selected.length === PLATFORMS.length;

  const togglePlatform = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((p) => p !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">AI Platforms</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => onChange(PLATFORMS.map((p) => p.id))}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => onChange([])}
          >
            None
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {PLATFORMS.map((platform) => (
          <label
            key={platform.id}
            className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all border ${
              selected.includes(platform.id)
                ? "border-primary/40 bg-primary/5"
                : "border-white/5 bg-white/[0.02] hover:border-white/10"
            }`}
          >
            <Checkbox
              checked={selected.includes(platform.id)}
              onCheckedChange={() => togglePlatform(platform.id)}
            />
            <span className="text-base">{platform.icon}</span>
            <span className="text-sm text-foreground">{platform.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
