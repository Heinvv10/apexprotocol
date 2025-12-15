/**
 * White-Label Brand Presets
 * ============================================
 * Pre-configured brand themes for different clients
 * Based on WHITE_LABEL_ARCHITECTURE.md
 */

export interface BrandPreset {
  name: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  colors: {
    // Core colors (HSL values as "H S% L%")
    primary: string;
    primaryForeground: string;
    accentBlue: string;
    accentPink: string;
    // Status colors
    success: string;
    warning: string;
    error: string;
    // Background/Card colors
    background: string;
    card: string;
    muted: string;
    // Typography
    foreground: string;
    mutedForeground: string;
    border: string;
  };
  typography?: {
    headingFont?: string;
    bodyFont?: string;
  };
}

/**
 * Default Apex brand preset
 * Deep black-blue with purple primary
 */
export const APEX_PRESET: BrandPreset = {
  name: "Apex",
  tagline: "AI Visibility Platform",
  logoUrl: "/logo.svg",
  faviconUrl: "/favicon.ico",
  colors: {
    primary: "250 95% 57%",           // #4926FA - Apex Purple
    primaryForeground: "0 0% 100%",
    accentBlue: "232 74% 51%",        // #273ADB
    accentPink: "338 71% 51%",        // #D82F71
    success: "128 80% 44%",           // #17CA29
    warning: "38 100% 56%",           // #FFB020
    error: "0 70% 50%",               // #D4292A
    background: "235 79% 3%",         // #02030F
    card: "235 73% 20%",              // #0E1558
    muted: "235 30% 15%",
    foreground: "0 0% 98%",
    mutedForeground: "235 10% 60%",
    border: "235 30% 25%",
  },
};

/**
 * Example Client A preset
 * Teal/Cyan focused brand
 */
export const CLIENT_A_PRESET: BrandPreset = {
  name: "BrandWatch AI",
  tagline: "AI-Powered Brand Intelligence",
  logoUrl: "/brands/client-a/logo.svg",
  faviconUrl: "/brands/client-a/favicon.ico",
  colors: {
    primary: "180 80% 45%",           // Teal
    primaryForeground: "0 0% 100%",
    accentBlue: "200 85% 50%",
    accentPink: "320 70% 50%",
    success: "142 76% 36%",
    warning: "45 93% 47%",
    error: "0 84% 60%",
    background: "200 50% 3%",
    card: "200 45% 15%",
    muted: "200 30% 12%",
    foreground: "0 0% 98%",
    mutedForeground: "200 10% 55%",
    border: "200 30% 22%",
  },
};

/**
 * Example Client B preset
 * Orange/Amber focused brand
 */
export const CLIENT_B_PRESET: BrandPreset = {
  name: "AISearch Pro",
  tagline: "Dominate AI Search",
  logoUrl: "/brands/client-b/logo.svg",
  faviconUrl: "/brands/client-b/favicon.ico",
  colors: {
    primary: "25 95% 53%",            // Orange
    primaryForeground: "0 0% 100%",
    accentBlue: "215 90% 55%",
    accentPink: "340 75% 55%",
    success: "142 71% 45%",
    warning: "48 96% 53%",
    error: "0 72% 51%",
    background: "20 14% 4%",
    card: "20 25% 12%",
    muted: "20 20% 10%",
    foreground: "60 9% 98%",
    mutedForeground: "25 5% 55%",
    border: "20 25% 20%",
  },
};

/**
 * All available presets
 */
export const BRAND_PRESETS: Record<string, BrandPreset> = {
  apex: APEX_PRESET,
  "client-a": CLIENT_A_PRESET,
  "client-b": CLIENT_B_PRESET,
};

/**
 * Get brand preset from environment or default to Apex
 */
export function getBrandPreset(): BrandPreset {
  const presetKey = process.env.NEXT_PUBLIC_BRAND_PRESET || "apex";
  return BRAND_PRESETS[presetKey] || APEX_PRESET;
}

/**
 * Get custom brand from environment variables
 * Allows complete customization via env vars
 */
export function getCustomBrand(): Partial<BrandPreset> {
  return {
    name: process.env.NEXT_PUBLIC_BRAND_NAME,
    tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE,
    logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL,
    faviconUrl: process.env.NEXT_PUBLIC_BRAND_FAVICON_URL,
  };
}

/**
 * Merge custom brand settings with preset
 */
export function getBrand(): BrandPreset {
  const preset = getBrandPreset();
  const custom = getCustomBrand();

  return {
    ...preset,
    name: custom.name || preset.name,
    tagline: custom.tagline || preset.tagline,
    logoUrl: custom.logoUrl || preset.logoUrl,
    faviconUrl: custom.faviconUrl || preset.faviconUrl,
  };
}

/**
 * Generate CSS custom properties from brand preset
 */
export function generateBrandCSS(brand: BrandPreset): string {
  return `
    :root {
      --primary: ${brand.colors.primary};
      --primary-foreground: ${brand.colors.primaryForeground};
      --accent-blue: ${brand.colors.accentBlue};
      --accent-pink: ${brand.colors.accentPink};
      --success: ${brand.colors.success};
      --warning: ${brand.colors.warning};
      --error: ${brand.colors.error};
      --background: ${brand.colors.background};
      --card: ${brand.colors.card};
      --muted: ${brand.colors.muted};
      --foreground: ${brand.colors.foreground};
      --muted-foreground: ${brand.colors.mutedForeground};
      --border: ${brand.colors.border};
    }
  `.trim();
}
