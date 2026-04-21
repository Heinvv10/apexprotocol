/**
 * Regional Platform Routing (Phase 5.4)
 *
 * Maps AI platforms to their primary regions/locales so that monitoring can
 * prioritize region-specific platforms for brands targeting a given market,
 * and recommendations can be localized.
 */

export type SupportedLocale = "en" | "zu" | "xh" | "af" | "sw" | "yo";

export type AiPlatform =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "grok"
  | "deepseek"
  | "copilot"
  | "openai_search"
  | "bing_copilot"
  | "notebooklm"
  | "cohere"
  | "janus"
  | "mistral"
  | "llama"
  | "yandexgpt"
  | "kimi"
  | "qwen";

/** ISO-3166 region codes. "global" = region-agnostic / usage worldwide. */
export type RegionCode =
  | "global"
  | "us"
  | "eu"
  | "uk"
  | "fr"
  | "de"
  | "ru"
  | "cn"
  | "kr"
  | "jp"
  | "za"
  | "ke"
  | "ng"
  | "in"
  | "br";

export interface PlatformRegionInfo {
  platform: AiPlatform;
  /** Primary regions where this platform has material usage */
  primaryRegions: RegionCode[];
  /** Locales natively supported / most accurate */
  supportedLocales: SupportedLocale[];
  /** Ranking in a region's usage mix (1 = dominant). Optional. */
  regionalWeight?: Partial<Record<RegionCode, number>>;
}

export const PLATFORM_REGION_MAP: Record<AiPlatform, PlatformRegionInfo> = {
  chatgpt: {
    platform: "chatgpt",
    primaryRegions: ["global"],
    supportedLocales: ["en", "zu", "xh", "af", "sw", "yo"],
    regionalWeight: { global: 1, us: 1, eu: 1, za: 2, uk: 1 },
  },
  claude: {
    platform: "claude",
    primaryRegions: ["global", "us", "uk"],
    supportedLocales: ["en", "af"],
    regionalWeight: { global: 2, us: 2, uk: 2, eu: 3 },
  },
  gemini: {
    platform: "gemini",
    primaryRegions: ["global", "us", "eu", "in"],
    supportedLocales: ["en", "sw", "yo"],
    regionalWeight: { global: 2, us: 2, in: 1, eu: 2 },
  },
  perplexity: {
    platform: "perplexity",
    primaryRegions: ["global", "us"],
    supportedLocales: ["en"],
    regionalWeight: { global: 3, us: 2 },
  },
  grok: {
    platform: "grok",
    primaryRegions: ["us", "global"],
    supportedLocales: ["en"],
    regionalWeight: { us: 3, global: 4 },
  },
  deepseek: {
    platform: "deepseek",
    primaryRegions: ["cn", "global"],
    supportedLocales: ["en"],
    regionalWeight: { cn: 1, global: 5 },
  },
  copilot: {
    platform: "copilot",
    primaryRegions: ["global", "us", "eu"],
    supportedLocales: ["en"],
    regionalWeight: { global: 2, us: 1 },
  },
  openai_search: {
    platform: "openai_search",
    primaryRegions: ["global", "us"],
    supportedLocales: ["en"],
  },
  bing_copilot: {
    platform: "bing_copilot",
    primaryRegions: ["global", "us", "eu"],
    supportedLocales: ["en"],
  },
  notebooklm: {
    platform: "notebooklm",
    primaryRegions: ["global", "us", "eu"],
    supportedLocales: ["en"],
  },
  cohere: {
    platform: "cohere",
    primaryRegions: ["global", "us", "eu"],
    supportedLocales: ["en"],
  },
  janus: {
    platform: "janus",
    primaryRegions: ["global"],
    supportedLocales: ["en"],
  },
  mistral: {
    platform: "mistral",
    primaryRegions: ["eu", "fr", "global"],
    supportedLocales: ["en"],
    regionalWeight: { fr: 1, eu: 2, global: 4 },
  },
  llama: {
    platform: "llama",
    primaryRegions: ["global", "us"],
    supportedLocales: ["en"],
  },
  yandexgpt: {
    platform: "yandexgpt",
    primaryRegions: ["ru"],
    supportedLocales: ["en"],
    regionalWeight: { ru: 1 },
  },
  kimi: {
    platform: "kimi",
    primaryRegions: ["cn"],
    supportedLocales: ["en"],
    regionalWeight: { cn: 2 },
  },
  qwen: {
    platform: "qwen",
    primaryRegions: ["cn", "global"],
    supportedLocales: ["en"],
    regionalWeight: { cn: 3, global: 6 },
  },
};

/**
 * Get the platforms to prioritize for a given region. Results sorted by
 * regional usage weight (lower = more dominant).
 */
export function platformsForRegion(region: RegionCode): AiPlatform[] {
  const matches = Object.values(PLATFORM_REGION_MAP).filter((info) =>
    info.primaryRegions.includes(region),
  );
  matches.sort((a, b) => {
    const wa = a.regionalWeight?.[region] ?? 99;
    const wb = b.regionalWeight?.[region] ?? 99;
    return wa - wb;
  });
  return matches.map((i) => i.platform);
}

/**
 * Get platforms that natively support a locale. Useful for brands whose
 * audience speaks one of the supported African languages.
 */
export function platformsForLocale(locale: SupportedLocale): AiPlatform[] {
  return Object.values(PLATFORM_REGION_MAP)
    .filter((info) => info.supportedLocales.includes(locale))
    .map((i) => i.platform);
}

/**
 * Locale-specific recommendation templates. Keys match recommendation IDs
 * or categories; values are locale-keyed strings. Falls back to English.
 */
export const LOCALIZED_RECOMMENDATION_TEMPLATES: Record<
  string,
  Partial<Record<SupportedLocale, { title: string; description: string }>>
> = {
  "add-faq-schema": {
    en: {
      title: "Add FAQ schema",
      description:
        "Mark up your FAQ content with schema.org/FAQPage so AI engines can extract questions and answers directly.",
    },
    af: {
      title: "Voeg FAQ-skema by",
      description:
        "Merk jou FAQ-inhoud met schema.org/FAQPage sodat AI-enjins vrae en antwoorde direk kan onttrek.",
    },
    zu: {
      title: "Engeza FAQ schema",
      description:
        "Maka okuqukethwe kwakho kwe-FAQ nge-schema.org/FAQPage ukuze ama-enjini we-AI akwazi ukuthola imibuzo nezimpendulo ngqo.",
    },
  },
  "refresh-stale-content": {
    en: {
      title: "Refresh stale content",
      description:
        "Update pages with outdated facts or timestamps. AI engines weight freshness.",
    },
    af: {
      title: "Verfris verouderde inhoud",
      description:
        "Werk bladsye met verouderde feite of tydstempels op. AI-enjins weeg vars data.",
    },
  },
  "build-author-authority": {
    en: {
      title: "Build author authority",
      description:
        "Add author bios, E-E-A-T signals, and cross-references to improve authority on cited domains.",
    },
  },
};

export function getLocalizedRecommendation(
  templateId: string,
  locale: SupportedLocale,
): { title: string; description: string } | null {
  const template = LOCALIZED_RECOMMENDATION_TEMPLATES[templateId];
  if (!template) return null;
  return template[locale] ?? template.en ?? null;
}

/**
 * Core function for "given a brand's target region + locale, what platforms
 * should we monitor". Combines regional dominance and locale support.
 */
export function recommendedPlatformMix(params: {
  region: RegionCode;
  locale?: SupportedLocale;
  maxPlatforms?: number;
}): { primary: AiPlatform[]; secondary: AiPlatform[] } {
  const max = params.maxPlatforms ?? 7;
  const regional = platformsForRegion(params.region);
  const localeMatches = params.locale
    ? new Set(platformsForLocale(params.locale))
    : null;

  // Primary = regional dominant platforms (locale-safe if locale specified)
  const primary: AiPlatform[] = [];
  for (const p of regional) {
    if (localeMatches && !localeMatches.has(p)) continue;
    if (primary.length < Math.min(5, max)) primary.push(p);
  }

  // Secondary = global/top-tier platforms not already included
  const globalTier: AiPlatform[] = ["chatgpt", "claude", "gemini", "perplexity"];
  const secondary: AiPlatform[] = [];
  for (const p of globalTier) {
    if (primary.includes(p)) continue;
    if (localeMatches && !localeMatches.has(p)) continue;
    secondary.push(p);
  }

  return { primary, secondary: secondary.slice(0, Math.max(0, max - primary.length)) };
}
