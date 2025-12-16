"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Home,
  BarChart2,
  FileText,
  Settings,
  HelpCircle,
  User,
  Sparkles,
  Zap,
  Bell,
  LogOut,
  Moon,
  Sun,
  Command,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  category: string;
  shortcut?: string[];
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Command items
  const commands: CommandItem[] = React.useMemo(
    () => [
      // Navigation
      {
        id: "home",
        title: "Go to Dashboard",
        subtitle: "Main overview",
        icon: Home,
        category: "Navigation",
        shortcut: ["G", "H"],
        action: () => router.push("/dashboard"),
      },
      {
        id: "monitor",
        title: "Go to Monitor",
        subtitle: "Brand monitoring",
        icon: BarChart2,
        category: "Navigation",
        shortcut: ["G", "M"],
        action: () => router.push("/dashboard/monitor"),
      },
      {
        id: "competitive",
        title: "Go to Competitive",
        subtitle: "Competitive intelligence",
        icon: Target,
        category: "Navigation",
        shortcut: ["G", "I"],
        action: () => router.push("/dashboard/competitive"),
      },
      {
        id: "recommendations",
        title: "Go to Recommendations",
        subtitle: "AI-powered suggestions",
        icon: Sparkles,
        category: "Navigation",
        shortcut: ["G", "R"],
        action: () => router.push("/dashboard/recommendations"),
      },
      {
        id: "create",
        title: "Go to Content Engine",
        subtitle: "Create AI content",
        icon: FileText,
        category: "Navigation",
        shortcut: ["G", "C"],
        action: () => router.push("/dashboard/create"),
      },
      {
        id: "audit",
        title: "Go to Audit",
        subtitle: "Site auditing",
        icon: Zap,
        category: "Navigation",
        shortcut: ["G", "A"],
        action: () => router.push("/dashboard/audit"),
      },
      {
        id: "settings",
        title: "Go to Settings",
        subtitle: "Account settings",
        icon: Settings,
        category: "Navigation",
        shortcut: ["G", "S"],
        action: () => router.push("/dashboard/settings"),
      },
      // Actions
      {
        id: "new-content",
        title: "Create New Content",
        subtitle: "Start a new AI-generated piece",
        icon: FileText,
        category: "Actions",
        shortcut: ["N"],
        action: () => router.push("/dashboard/create/new"),
      },
      {
        id: "run-audit",
        title: "Run New Audit",
        subtitle: "Start a site audit",
        icon: Zap,
        category: "Actions",
        action: () => router.push("/dashboard/audit"),
      },
      {
        id: "notifications",
        title: "View Notifications",
        subtitle: "Check recent alerts",
        icon: Bell,
        category: "Actions",
        action: () => {},
      },
      // Settings
      {
        id: "profile",
        title: "Edit Profile",
        subtitle: "Update your information",
        icon: User,
        category: "Settings",
        action: () => router.push("/dashboard/settings"),
      },
      {
        id: "theme-toggle",
        title: "Toggle Theme",
        subtitle: "Switch dark/light mode",
        icon: Moon,
        category: "Settings",
        action: () => {},
      },
      {
        id: "help",
        title: "Open Help",
        subtitle: "Documentation and support",
        icon: HelpCircle,
        category: "Settings",
        shortcut: ["?"],
        action: () => {},
      },
      {
        id: "logout",
        title: "Sign Out",
        subtitle: "Log out of your account",
        icon: LogOut,
        category: "Settings",
        action: () => {},
      },
    ],
    [router]
  );

  // Filter commands by query
  const filteredCommands = React.useMemo(() => {
    if (!query.trim()) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(lowerQuery) ||
        cmd.subtitle?.toLowerCase().includes(lowerQuery) ||
        cmd.category.toLowerCase().includes(lowerQuery)
    );
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Flatten for keyboard navigation
  const flatCommands = React.useMemo(
    () => Object.values(groupedCommands).flat(),
    [groupedCommands]
  );

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < flatCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : flatCommands.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            flatCommands[selectedIndex].action();
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, flatCommands, onClose]);

  // Reset on open
  React.useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Scroll selected item into view
  React.useEffect(() => {
    const selected = listRef.current?.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  let currentIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal with glassmorphism */}
      <div
        className="relative w-full max-w-[640px] mx-4 overflow-hidden rounded-xl animate-in fade-in zoom-in-95 duration-150"
        style={{
          background: "rgba(24, 24, 27, 0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground bg-white/5 border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto py-2"
          style={{ scrollbarWidth: "thin" }}
        >
          {flatCommands.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Command className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="mb-2">
                {/* Category header */}
                <div className="px-4 py-1.5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {category}
                  </span>
                </div>

                {/* Items */}
                {items.map((item) => {
                  currentIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  const Icon = item.icon;
                  const itemIndex = currentIndex;

                  return (
                    <button
                      key={item.id}
                      data-selected={isSelected}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        isSelected ? "bg-white/10" : "hover:bg-white/5"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          isSelected
                            ? "bg-primary/20 text-primary"
                            : "bg-white/5 text-muted-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-foreground" : "text-foreground/80"
                          )}
                        >
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-xs text-muted-foreground truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>

                      {item.shortcut && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.shortcut.map((key, i) => (
                            <kbd
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground bg-white/5 border border-white/10 min-w-[22px] text-center"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer with hints */}
        <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10">
                <ArrowUp className="w-2.5 h-2.5" />
              </kbd>
              <kbd className="px-1 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10">
                <ArrowDown className="w-2.5 h-2.5" />
              </kbd>
              <span className="ml-1">to navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10">
                <CornerDownLeft className="w-2.5 h-2.5" />
              </kbd>
              <span className="ml-1">to select</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>K to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to control command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

// Trigger button
export function CommandPaletteTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
    >
      <Search className="w-4 h-4" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10">
        ⌘K
      </kbd>
    </button>
  );
}
