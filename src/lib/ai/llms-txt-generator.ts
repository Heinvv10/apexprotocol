/**
 * llms.txt generator — produces the /llms.txt file a site serves to help
 * LLMs parse its content.
 *
 * Requirement: FR-CRE-009 (🏆 category-leading).
 *
 * Spec: https://llmstxt.org/ (AnswerDotAI / Jeremy Howard)
 *
 * Minimum valid file:
 *
 *   # Project name
 *   > Optional description
 *
 *   Optional longer prose.
 *
 *   ## Section
 *   - [Title](url): description
 *
 * Apex produces this from:
 *   - The brand's declared name, tagline, description
 *   - The brand's site URL + key URLs (home, pricing, docs, blog)
 *   - Optional extra sections the user provides (e.g. API docs, changelog)
 *
 * This generator is pure — takes structured input, returns a string. No DB,
 * no LLM. An API route wires the brand's DB state in as input.
 */

export interface LlmsTxtSection {
  title: string;
  links: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
}

export interface LlmsTxtInput {
  projectName: string;
  summary?: string;
  longDescription?: string;
  sections: LlmsTxtSection[];
}

export interface LlmsTxtValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const MAX_URL_LENGTH = 2048;
const MAX_SUMMARY_LENGTH = 280;

export function validateInput(input: LlmsTxtInput): LlmsTxtValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.projectName || input.projectName.trim().length === 0) {
    errors.push("projectName is required");
  }
  if (input.summary && input.summary.length > MAX_SUMMARY_LENGTH) {
    warnings.push(
      `summary is ${input.summary.length} chars; spec recommends ≤${MAX_SUMMARY_LENGTH}`,
    );
  }
  for (const s of input.sections) {
    if (!s.title || s.title.trim().length === 0) {
      errors.push("every section must have a title");
    }
    for (const l of s.links) {
      if (!l.title || l.title.trim().length === 0) {
        errors.push(`link in "${s.title}" missing title`);
      }
      if (!l.url || l.url.trim().length === 0) {
        errors.push(`link "${l.title}" in "${s.title}" missing url`);
        continue;
      }
      try {
        new URL(l.url);
      } catch {
        errors.push(
          `link "${l.title}" in "${s.title}" has invalid URL: ${l.url}`,
        );
      }
      if (l.url.length > MAX_URL_LENGTH) {
        warnings.push(`URL in "${s.title}" exceeds 2048 chars: ${l.url.slice(0, 50)}…`);
      }
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function generateLlmsTxt(input: LlmsTxtInput): string {
  const v = validateInput(input);
  if (!v.valid) {
    throw new Error(
      `Invalid llms.txt input: ${v.errors.join("; ")}`,
    );
  }

  const lines: string[] = [];

  lines.push(`# ${input.projectName.trim()}`);
  lines.push("");

  if (input.summary) {
    lines.push(`> ${input.summary.trim().replace(/\n+/g, " ")}`);
    lines.push("");
  }

  if (input.longDescription) {
    lines.push(input.longDescription.trim());
    lines.push("");
  }

  for (const section of input.sections) {
    if (section.links.length === 0) continue;
    lines.push(`## ${section.title.trim()}`);
    lines.push("");
    for (const link of section.links) {
      const desc = link.description
        ? `: ${link.description.trim().replace(/\n+/g, " ")}`
        : "";
      lines.push(
        `- [${link.title.trim()}](${link.url.trim()})${desc}`,
      );
    }
    lines.push("");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/**
 * Build a reasonable default llms.txt from just a brand's URL + basic
 * metadata. Users can then extend / edit before publishing.
 */
export function scaffoldFromBrand(brand: {
  name: string;
  description?: string | null;
  tagline?: string | null;
  domain?: string | null;
}): LlmsTxtInput {
  const site = brand.domain ? normalizeDomain(brand.domain) : null;
  const sections: LlmsTxtSection[] = [];

  if (site) {
    sections.push({
      title: "Core pages",
      links: [
        { title: "Home", url: site, description: "Main landing page" },
        { title: "About", url: `${site}/about`, description: "About us" },
        { title: "Pricing", url: `${site}/pricing`, description: "Pricing and plans" },
        { title: "Contact", url: `${site}/contact`, description: "Get in touch" },
      ],
    });
    sections.push({
      title: "Content",
      links: [
        { title: "Blog", url: `${site}/blog`, description: "Articles and updates" },
        { title: "Documentation", url: `${site}/docs`, description: "Docs and guides" },
      ],
    });
  }

  return {
    projectName: brand.name,
    summary: brand.tagline ?? undefined,
    longDescription: brand.description ?? undefined,
    sections,
  };
}

function normalizeDomain(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
