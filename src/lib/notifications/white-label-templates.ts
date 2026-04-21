/**
 * White-label Email + Report Templates (Phase 4.1)
 *
 * Renders org-branded HTML for all transactional and digest emails. Branding
 * comes from `organizations.branding` JSONB (already populated) — no schema
 * change required.
 *
 * The templates are deliberately simple (inline CSS, no external fonts) so
 * they render consistently across Gmail/Outlook/Apple Mail.
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import type { BrandingSettings } from "@/lib/db/schema/organizations";

export interface ResolvedBranding {
  appName: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  tagline: string | null;
  supportEmail: string | null;
  customFooterText: string | null;
  showPoweredBy: boolean;
  customDomain: string | null;
}

const DEFAULT_BRANDING: ResolvedBranding = {
  appName: "ApexGEO",
  primaryColor: "#00E5CC",
  accentColor: "#8B5CF6",
  logoUrl: null,
  logoDarkUrl: null,
  tagline: "Visibility across AI search engines",
  supportEmail: "support@apexgeo.app",
  customFooterText: null,
  showPoweredBy: true,
  customDomain: null,
};

/**
 * Resolve branding for an organization. Falls back to Apex defaults when
 * the org hasn't configured a branding override.
 */
export async function resolveOrgBranding(
  organizationId: string,
): Promise<ResolvedBranding> {
  const [org] = await db
    .select({ branding: organizations.branding })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!org?.branding) return DEFAULT_BRANDING;
  const b = org.branding as BrandingSettings;

  return {
    appName: b.appName ?? DEFAULT_BRANDING.appName,
    primaryColor: b.primaryColor ?? DEFAULT_BRANDING.primaryColor,
    accentColor: b.accentColor ?? DEFAULT_BRANDING.accentColor,
    logoUrl: b.logoUrl ?? null,
    logoDarkUrl: b.logoDarkUrl ?? null,
    tagline: b.tagline ?? DEFAULT_BRANDING.tagline,
    supportEmail: b.supportEmail ?? DEFAULT_BRANDING.supportEmail,
    customFooterText: b.customFooterText ?? null,
    showPoweredBy: b.showPoweredBy ?? true,
    customDomain: b.customDomain ?? null,
  };
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface EmailLayoutOptions {
  branding: ResolvedBranding;
  /** The email subject — used as the meta title */
  subject: string;
  /** Optional preheader text shown in inbox previews */
  preheader?: string;
  /** Optional CTA button */
  cta?: { label: string; href: string };
  /** Main body HTML (already escaped / trusted) */
  bodyHtml: string;
}

/**
 * Wrap body HTML in a branded, email-client-safe shell.
 */
export function renderBrandedEmail(options: EmailLayoutOptions): string {
  const { branding, subject, preheader, cta, bodyHtml } = options;
  const logo = branding.logoUrl
    ? `<img src="${xmlEscape(branding.logoUrl)}" alt="${xmlEscape(branding.appName)}" style="max-height:40px;border:0;display:block" />`
    : `<div style="font-size:20px;font-weight:700;color:${xmlEscape(branding.primaryColor)}">${xmlEscape(branding.appName)}</div>`;

  const poweredBy = branding.showPoweredBy
    ? `<div style="margin-top:16px;font-size:11px;color:#9ca3af">Powered by ApexGEO</div>`
    : "";
  const footerNote = branding.customFooterText
    ? `<div style="margin-top:12px;font-size:12px;color:#6b7280">${xmlEscape(branding.customFooterText)}</div>`
    : "";
  const supportLine = branding.supportEmail
    ? `<div style="margin-top:8px;font-size:12px;color:#6b7280">Questions? <a href="mailto:${xmlEscape(branding.supportEmail)}" style="color:${xmlEscape(branding.primaryColor)}">${xmlEscape(branding.supportEmail)}</a></div>`
    : "";
  const ctaHtml = cta
    ? `<div style="margin:24px 0;text-align:center">
        <a href="${xmlEscape(cta.href)}" style="background:${xmlEscape(branding.primaryColor)};color:#0a0f1a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">${xmlEscape(cta.label)}</a>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${xmlEscape(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${xmlEscape(preheader)}</div>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7">
<tr><td align="center" style="padding:24px 12px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
<tr><td style="padding:24px 32px 16px;border-bottom:1px solid #e5e7eb">${logo}</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-size:22px;color:#111827">${xmlEscape(subject)}</h1>
${bodyHtml}
${ctaHtml}
</td></tr>
<tr><td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center">
${branding.tagline ? `<div>${xmlEscape(branding.tagline)}</div>` : ""}
${supportLine}
${footerNote}
${poweredBy}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export interface CrisisEmailInput {
  organizationId: string;
  brandName: string;
  severity: "warning" | "critical" | "emergency";
  title: string;
  description: string;
  dashboardUrl?: string;
}

export async function renderCrisisEmail(
  input: CrisisEmailInput,
): Promise<{ subject: string; html: string }> {
  const branding = await resolveOrgBranding(input.organizationId);
  const severityBadge =
    input.severity === "emergency"
      ? `<span style="background:#fee2e2;color:#991b1b;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700">EMERGENCY</span>`
      : input.severity === "critical"
        ? `<span style="background:#fed7aa;color:#9a3412;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700">CRITICAL</span>`
        : `<span style="background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700">WARNING</span>`;

  const body = `
<div style="margin-bottom:16px">${severityBadge}</div>
<p style="font-size:15px;line-height:1.5;margin:0 0 12px">Brand: <strong>${xmlEscape(input.brandName)}</strong></p>
<p style="font-size:15px;line-height:1.5;margin:0 0 16px">${xmlEscape(input.description)}</p>`;

  return {
    subject: `[${input.severity.toUpperCase()}] ${input.title}`,
    html: renderBrandedEmail({
      branding,
      subject: input.title,
      preheader: `${input.brandName} · ${input.description.slice(0, 100)}`,
      cta: input.dashboardUrl
        ? { label: "Open War Room", href: input.dashboardUrl }
        : undefined,
      bodyHtml: body,
    }),
  };
}

export interface DigestEmailInput {
  organizationId: string;
  brandName: string;
  currentScore: number;
  previousScore: number;
  mentionsThisWeek: number;
  topRecommendations: string[];
  dashboardUrl?: string;
}

export async function renderDigestEmail(
  input: DigestEmailInput,
): Promise<{ subject: string; html: string }> {
  const branding = await resolveOrgBranding(input.organizationId);
  const delta = input.currentScore - input.previousScore;
  const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "—";
  const color = delta > 0 ? "#22c55e" : delta < 0 ? "#ef4444" : "#6b7280";

  const recList = input.topRecommendations.length
    ? `<ul style="margin:8px 0;padding-left:20px;font-size:14px;line-height:1.6">
        ${input.topRecommendations.map((r) => `<li>${xmlEscape(r)}</li>`).join("")}
      </ul>`
    : `<p style="font-size:14px;color:#6b7280">No pending recommendations — nice work.</p>`;

  const body = `
<p style="font-size:15px;margin:0 0 20px">Your weekly ${xmlEscape(branding.appName)} roll-up for <strong>${xmlEscape(input.brandName)}</strong>:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
<tr>
<td style="padding:16px;background:#f9fafb;border-radius:8px;width:50%"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">GEO Score</div><div style="font-size:30px;font-weight:700;margin-top:4px">${input.currentScore}</div><div style="font-size:13px;color:${color};margin-top:4px">${arrow} ${Math.abs(delta)} pts</div></td>
<td style="width:12px"></td>
<td style="padding:16px;background:#f9fafb;border-radius:8px;width:50%"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Mentions (7d)</div><div style="font-size:30px;font-weight:700;margin-top:4px">${input.mentionsThisWeek}</div></td>
</tr>
</table>
<h3 style="margin:20px 0 8px;font-size:15px">This week's priorities</h3>
${recList}`;

  return {
    subject: `${branding.appName} weekly digest — ${input.brandName}`,
    html: renderBrandedEmail({
      branding,
      subject: `Weekly digest: ${input.brandName}`,
      preheader: `Score ${input.currentScore} (${arrow}${Math.abs(delta)}) · ${input.mentionsThisWeek} mentions`,
      cta: input.dashboardUrl
        ? { label: "Open Dashboard", href: input.dashboardUrl }
        : undefined,
      bodyHtml: body,
    }),
  };
}

export interface ReportCoverInput {
  organizationId: string;
  reportTitle: string;
  brandName: string;
  dateRange: { start: Date; end: Date };
}

/**
 * Renders a branded cover page (HTML) to be embedded at the top of PDF/PPTX
 * report exports.
 */
export async function renderReportCover(
  input: ReportCoverInput,
): Promise<string> {
  const branding = await resolveOrgBranding(input.organizationId);
  const formattedRange = `${input.dateRange.start.toLocaleDateString()} – ${input.dateRange.end.toLocaleDateString()}`;
  const logo = branding.logoUrl
    ? `<img src="${xmlEscape(branding.logoUrl)}" alt="${xmlEscape(branding.appName)}" style="max-height:48px;margin-bottom:24px" />`
    : `<div style="font-size:24px;font-weight:700;color:${xmlEscape(branding.primaryColor)};margin-bottom:24px">${xmlEscape(branding.appName)}</div>`;

  return `<div style="padding:48px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;min-height:400px;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(180deg,#fff 0%,#f9fafb 100%)">
<div>
${logo}
<h1 style="margin:0 0 12px;font-size:32px;color:#111827">${xmlEscape(input.reportTitle)}</h1>
<div style="font-size:20px;color:#374151">${xmlEscape(input.brandName)}</div>
<div style="font-size:14px;color:#6b7280;margin-top:8px">${xmlEscape(formattedRange)}</div>
</div>
<div style="margin-top:48px;font-size:11px;color:#9ca3af">${branding.customFooterText ? xmlEscape(branding.customFooterText) + " · " : ""}${branding.showPoweredBy ? "Powered by ApexGEO" : ""}</div>
</div>`;
}
