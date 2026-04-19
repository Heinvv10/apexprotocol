/**
 * Brand Preset Registry — single source of truth for white-label tenants.
 *
 * To add a new brand:
 *   1. Copy src/styles/themes/brand/_template.css to brand/<name>.css
 *   2. Customize its palette values
 *   3. Add an entry here
 *   4. Drop assets into public/brands/<name>/
 *   5. Set env NEXT_PUBLIC_BRAND_PRESET=<name>
 */

export type BrandPresetKey = keyof typeof BRAND_PRESETS;

export interface BrandPreset {
  readonly name: string;                   // Display name in UI ("Apex", "Solstice")
  readonly wordmarkSuffix?: string;        // Accent-coloured suffix appended to the name in the sidebar wordmark (e.g. Apex's "GEO"). Omit for brands that don't want a coloured suffix.
  readonly tagline: string;                // Subtitle/tagline
  readonly cssFile: string;                // Filename under src/styles/themes/brand/
  readonly logoUrl: string;                // Light-bg logo
  readonly logoDarkUrl: string;            // Dark-bg logo
  readonly faviconUrl: string;
}

export const BRAND_PRESETS = {
  apex: {
    name: 'Apex',
    wordmarkSuffix: 'GEO',
    tagline: 'The Credibility Engine for African Business',
    cssFile: 'apex.css',
    logoUrl: '/apex-linkedin-logo.svg',
    logoDarkUrl: '/apex-linkedin-logo.svg',
    faviconUrl: '/favicon.ico',
  },
  solstice: {
    name: 'Solstice',
    tagline: 'AI Visibility for Warm-Market Brands',
    cssFile: 'solstice.css',
    logoUrl: '/brands/solstice/logo.svg',
    logoDarkUrl: '/brands/solstice/logo-dark.svg',
    faviconUrl: '/brands/solstice/favicon.ico',
  },
} as const satisfies Record<string, BrandPreset>;

const FALLBACK: BrandPresetKey = 'apex';

/**
 * Resolve the active brand preset from env, with safe fallback.
 * Called in src/app/layout.tsx at build time.
 */
export function getActiveBrand(): BrandPreset {
  const envKey = process.env.NEXT_PUBLIC_BRAND_PRESET;
  if (envKey && envKey in BRAND_PRESETS) {
    return BRAND_PRESETS[envKey as BrandPresetKey];
  }
  return BRAND_PRESETS[FALLBACK];
}

/** Type guard — used for validating env input. */
export function isBrandPresetKey(v: string): v is BrandPresetKey {
  return v in BRAND_PRESETS;
}
