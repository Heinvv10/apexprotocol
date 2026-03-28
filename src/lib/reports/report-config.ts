/**
 * Report Branding Configuration
 * White-label configuration for PDF reports
 */

export interface ReportBranding {
  /** URL to the company logo */
  logoUrl: string | null;
  /** Primary accent color (hex) */
  accentColor: string;
  /** Background color (hex) */
  bgColor: string;
  /** Font family for the report */
  fontFamily: string;
  /** Company name to display */
  companyName: string;
  /** Company website/URL */
  companyUrl: string;
}

/** Default branding configuration */
const DEFAULT_BRANDING: ReportBranding = {
  logoUrl: null,
  accentColor: "#C87941", // Copper accent
  bgColor: "#0D1117", // Deep dark background
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  companyName: "ApexGEO",
  companyUrl: "apexgeo.app",
};

/**
 * Organization branding data from database
 */
interface OrgBrandingData {
  id: string;
  name: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
  } | null;
}

/**
 * Get report branding configuration for an organization
 * Falls back to default ApexGEO branding if org has no custom branding
 */
export function getReportBranding(org: OrgBrandingData | null): ReportBranding {
  if (!org) {
    return DEFAULT_BRANDING;
  }

  const branding = org.branding;

  return {
    logoUrl: branding?.logoUrl ?? DEFAULT_BRANDING.logoUrl,
    accentColor: branding?.primaryColor ?? DEFAULT_BRANDING.accentColor,
    bgColor: branding?.backgroundColor ?? DEFAULT_BRANDING.bgColor,
    fontFamily: branding?.fontFamily ?? DEFAULT_BRANDING.fontFamily,
    companyName: org.name || DEFAULT_BRANDING.companyName,
    companyUrl: DEFAULT_BRANDING.companyUrl,
  };
}

/**
 * Get CSS variables from branding config
 */
export function getBrandingCSSVariables(branding: ReportBranding): string {
  return `
    --report-accent: ${branding.accentColor};
    --report-bg: ${branding.bgColor};
    --report-bg-card: ${lightenColor(branding.bgColor, 5)};
    --report-bg-card-alt: ${lightenColor(branding.bgColor, 10)};
    --report-border: ${lightenColor(branding.bgColor, 15)};
    --report-text: #E6EDF3;
    --report-text-muted: #8B949E;
    --report-font: ${branding.fontFamily};
  `;
}

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
