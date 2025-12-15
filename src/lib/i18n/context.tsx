"use client";

import * as React from "react";
import {
  type Language,
  type TranslationKey,
  translations,
  getTranslation,
  getLanguageInfo,
  languages,
} from "./translations";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  languages: typeof languages;
  currentLanguageInfo: ReturnType<typeof getLanguageInfo>;
}

const I18nContext = React.createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = "apex-language";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>("en");

  // Load saved language on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && languages.some((l) => l.code === saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = React.useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);

    // Update document direction for RTL languages
    const langInfo = getLanguageInfo(lang);
    if (langInfo) {
      document.documentElement.dir = langInfo.direction;
      document.documentElement.lang = lang;
    }
  }, []);

  const t = React.useCallback(
    (key: TranslationKey): string => {
      return getTranslation(language, key);
    },
    [language]
  );

  const currentLanguageInfo = React.useMemo(
    () => getLanguageInfo(language),
    [language]
  );

  const value = React.useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languages,
      currentLanguageInfo,
    }),
    [language, setLanguage, t, currentLanguageInfo]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

// Hook for accessing translations only (no language switching)
export function useTranslation() {
  const { t, language } = useI18n();
  return { t, language };
}
