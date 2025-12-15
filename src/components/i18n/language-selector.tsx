"use client";

import * as React from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n, type Language, type LanguageInfo } from "@/lib/i18n";

interface LanguageSelectorProps {
  className?: string;
  variant?: "dropdown" | "grid" | "inline";
  showNativeName?: boolean;
  showFlag?: boolean;
}

export function LanguageSelector({
  className,
  variant = "dropdown",
  showNativeName = true,
  showFlag = true,
}: LanguageSelectorProps) {
  const { language, setLanguage, languages, currentLanguageInfo, t } =
    useI18n();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  if (variant === "grid") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {t("language")}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {languages.map((lang) => (
            <LanguageOption
              key={lang.code}
              lang={lang}
              isSelected={language === lang.code}
              onSelect={handleSelect}
              showNativeName={showNativeName}
              showFlag={showFlag}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              language === lang.code
                ? "bg-primary text-primary-foreground"
                : "bg-muted/20 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
            )}
          >
            {showFlag && <span className="mr-1.5">{lang.flag}</span>}
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Default: dropdown
  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 hover:bg-muted/30 border border-border/50 transition-colors"
      >
        {showFlag && currentLanguageInfo && (
          <span className="text-base">{currentLanguageInfo.flag}</span>
        )}
        <Globe className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-foreground">
          {showNativeName && currentLanguageInfo
            ? currentLanguageInfo.nativeName
            : currentLanguageInfo?.name}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 py-1 rounded-lg border border-border/50 bg-card shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2">
          <div className="px-3 py-2 border-b border-border/30">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("language")}
            </p>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                  language === lang.code
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted/20"
                )}
              >
                {showFlag && <span className="text-base">{lang.flag}</span>}
                <div className="flex-1 text-left">
                  <p className="font-medium">{lang.nativeName}</p>
                  {showNativeName && lang.name !== lang.nativeName && (
                    <p className="text-xs text-muted-foreground">{lang.name}</p>
                  )}
                </div>
                {language === lang.code && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LanguageOption({
  lang,
  isSelected,
  onSelect,
  showNativeName,
  showFlag,
}: {
  lang: LanguageInfo;
  isSelected: boolean;
  onSelect: (code: Language) => void;
  showNativeName: boolean;
  showFlag: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(lang.code)}
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg border transition-all text-left",
        isSelected
          ? "bg-primary/10 border-primary text-primary"
          : "bg-muted/10 border-border/50 text-foreground hover:bg-muted/20 hover:border-border"
      )}
    >
      {showFlag && <span className="text-xl">{lang.flag}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{lang.nativeName}</p>
        {showNativeName && lang.name !== lang.nativeName && (
          <p className="text-xs text-muted-foreground truncate">{lang.name}</p>
        )}
      </div>
      {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
    </button>
  );
}

// Compact language switcher for header/navbar
export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, languages, currentLanguageInfo } = useI18n();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-muted/20 transition-colors"
        title="Change language"
      >
        <span className="text-base">{currentLanguageInfo?.flag}</span>
        <span className="text-xs font-medium text-muted-foreground">
          {language.toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 py-1 rounded-lg border border-border/50 bg-card shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                language === lang.code
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted/20"
              )}
            >
              <span>{lang.flag}</span>
              <span className="flex-1 text-left">{lang.nativeName}</span>
              {language === lang.code && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
