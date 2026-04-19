/**
 * Trust Center data registry.
 *
 * Requirement: NFR-CMP-009 (Trust Center UI), premium marker #6 (🏆).
 *
 * Single source of truth for security + compliance state shown at /trust.
 * The page reads from here. Certification state + sub-processor list +
 * data-residency options + DPA URLs all live here so the Trust page
 * cannot drift from the org's actual posture.
 *
 * When compliance state changes (SOC 2 report signed, new sub-processor
 * added, residency region enabled), update this module — nowhere else.
 */

export type ComplianceStatus =
  | "certified"
  | "in_progress"
  | "planned"
  | "not_applicable";

export interface CertificationRecord {
  name: string;
  status: ComplianceStatus;
  /** ISO date — when the most recent attestation is valid through */
  validThrough?: string;
  /** Public URL for the report, if available */
  reportUrl?: string;
  /** Plain-language explanation visible on the Trust page */
  summary: string;
}

export interface SubProcessor {
  name: string;
  purpose: string;
  dataProcessed: string;
  /** Two-letter country code — primary data center */
  country: string;
  /** Privacy/DPA page of the sub-processor */
  privacyUrl: string;
}

export interface DataResidencyOption {
  region: "eu" | "us" | "za" | "apac";
  label: string;
  description: string;
  status: "available" | "planned";
  /** ISO date when this region becomes GA, if planned */
  availableFrom?: string;
}

export interface IncidentSummary {
  /** Last 12 months rolling uptime percent */
  uptime12mo: number | null;
  /** Count of incidents in the last 12 months with public postmortems */
  incidentsWithPostmortems: number;
  /** URL to the public status page */
  statusPageUrl: string;
}

export const CERTIFICATIONS: readonly CertificationRecord[] = [
  {
    name: "SOC 2 Type II",
    status: "in_progress",
    summary:
      "Readiness audit kicked off Sprint 4 with Vanta. Target Type II report by Q2 2027.",
  },
  {
    name: "ISO 27001",
    status: "planned",
    summary: "Post-launch Q3 2027. Prerequisite for EU enterprise deals.",
  },
  {
    name: "GDPR",
    status: "certified",
    summary:
      "DPA available on request; sub-processor list below; right-to-erasure + right-to-portability implemented.",
  },
  {
    name: "POPIA (South Africa)",
    status: "certified",
    summary:
      "Compliant with Protection of Personal Information Act — our primary launch jurisdiction.",
  },
  {
    name: "CCPA",
    status: "in_progress",
    summary: "Opt-out + data-subject-request flows implemented; full registration pending.",
  },
  {
    name: "EU AI Act Article 50",
    status: "in_progress",
    summary:
      "AI-generated content disclosure + machine-readable marking ships Q2 2027.",
  },
];

/**
 * Sub-processors we use that touch customer data. Keep this list honest —
 * when you add a vendor that handles tenant data, add them here.
 */
export const SUB_PROCESSORS: readonly SubProcessor[] = [
  {
    name: "Anthropic",
    purpose: "LLM inference (Claude)",
    dataProcessed: "Brand metadata, content samples, generated drafts",
    country: "US",
    privacyUrl: "https://www.anthropic.com/legal/privacy",
  },
  {
    name: "OpenAI",
    purpose: "LLM inference (GPT-4/5)",
    dataProcessed: "Brand metadata, content samples, generated drafts",
    country: "US",
    privacyUrl: "https://openai.com/policies/privacy-policy",
  },
  {
    name: "Google",
    purpose: "LLM inference (Gemini), Search Console, Analytics",
    dataProcessed: "Brand queries, site analytics, search performance",
    country: "US",
    privacyUrl: "https://policies.google.com/privacy",
  },
  {
    name: "Cloudflare",
    purpose: "CDN, DDoS protection, R2 backup storage",
    dataProcessed: "All traffic; encrypted backups",
    country: "US",
    privacyUrl: "https://www.cloudflare.com/privacypolicy/",
  },
  {
    name: "Upstash",
    purpose: "Redis cache + queue",
    dataProcessed: "Ephemeral job payloads, rate-limit counters",
    country: "US",
    privacyUrl: "https://upstash.com/trust/privacy.pdf",
  },
  {
    name: "Sentry",
    purpose: "Error tracking",
    dataProcessed: "Application errors, redacted stack traces",
    country: "US",
    privacyUrl: "https://sentry.io/privacy/",
  },
  {
    name: "Stripe",
    purpose: "Billing + payment processing",
    dataProcessed: "Billing emails, payment tokens (card data never touches our servers)",
    country: "US",
    privacyUrl: "https://stripe.com/privacy",
  },
  {
    name: "DataForSEO",
    purpose: "AI keyword volume data for Prompt Radar",
    dataProcessed: "Keywords only; no brand-identifying data",
    country: "US",
    privacyUrl: "https://dataforseo.com/privacy-policy",
  },
];

export const DATA_RESIDENCY_OPTIONS: readonly DataResidencyOption[] = [
  {
    region: "eu",
    label: "European Union (Frankfurt)",
    description: "Primary data center in Frankfurt; backups in Ireland.",
    status: "planned",
    availableFrom: "2027-06-01",
  },
  {
    region: "us",
    label: "United States (us-east-1)",
    description: "Primary data center in Virginia; backups in Oregon.",
    status: "available",
  },
  {
    region: "za",
    label: "South Africa (Johannesburg)",
    description:
      "Primary data center in Johannesburg. Our default for African-market customers — POPIA-aligned.",
    status: "available",
  },
  {
    region: "apac",
    label: "Asia-Pacific (Singapore)",
    description: "Singapore; covers APAC enterprise customers.",
    status: "planned",
    availableFrom: "2027-09-01",
  },
];

export const INCIDENT_SUMMARY: IncidentSummary = {
  uptime12mo: null, // Honest-empty until 12 months of data exists
  incidentsWithPostmortems: 0,
  statusPageUrl: "https://status.apex.dev",
};

export const SECURITY_CONTACTS = {
  securityEmail: "security@apex.dev",
  vulnDisclosurePolicy: "https://apex.dev/.well-known/security.txt",
  bugBounty: "https://apex.dev/security/bug-bounty",
};

export const LEGAL_DOCS = {
  dpa: "https://apex.dev/legal/dpa",
  privacy: "https://apex.dev/legal/privacy",
  terms: "https://apex.dev/legal/terms",
  cookies: "https://apex.dev/legal/cookies",
  acceptableUse: "https://apex.dev/legal/acceptable-use",
};
