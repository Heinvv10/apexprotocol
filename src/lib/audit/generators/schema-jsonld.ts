/**
 * JSON-LD snippet generators.
 *
 * The audit flags schema-shaped gaps (`Missing Schema.org Markup`,
 * `No FAQ Schema Found`). Historically the recommendation told the user
 * *what* to add but not *how* — they had to hand-author the JSON-LD.
 * These pure functions emit ready-to-paste `<script
 * type="application/ld+json">…</script>` blocks derived from the brand
 * data onboarding already captures (name, description, domain, logo,
 * social links, GEO Q&As). Functions return null when the prerequisite
 * brand fields are missing so callers can skip surfacing a snippet
 * rather than render a broken stub.
 */

import type { Brand } from "@/lib/db/schema";

interface BrandSubset {
  name: string;
  domain: string | null;
  description: string | null;
  logoUrl: string | null;
  socialLinks: unknown;
  geoKeywords: unknown;
  industry: string | null;
}

function coerceBrand(brand: Brand): BrandSubset {
  return {
    name: brand.name,
    domain: brand.domain,
    description: brand.description,
    logoUrl: brand.logoUrl,
    socialLinks: brand.socialLinks,
    geoKeywords: brand.geoKeywords,
    industry: brand.industry,
  };
}

function collectSameAs(socialLinks: unknown): string[] {
  if (!socialLinks || typeof socialLinks !== "object") return [];
  const urls: string[] = [];
  for (const value of Object.values(socialLinks as Record<string, unknown>)) {
    if (typeof value === "string" && /^https?:\/\//i.test(value)) {
      urls.push(value);
    }
  }
  return urls;
}

function wrapScript(jsonLd: object): string {
  const body = JSON.stringify(jsonLd, null, 2);
  return `<script type="application/ld+json">\n${body}\n</script>`;
}

export function generateOrganizationSchema(brand: Brand): string | null {
  const b = coerceBrand(brand);
  if (!b.domain) return null;

  const url = b.domain.startsWith("http") ? b.domain : `https://${b.domain}`;
  const sameAs = collectSameAs(b.socialLinks);

  const organization: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: b.name,
    url,
  };
  if (b.description) organization.description = b.description;
  if (b.logoUrl) organization.logo = b.logoUrl;
  if (sameAs.length > 0) organization.sameAs = sameAs;

  const graph: Record<string, unknown>[] = [organization];

  // If the industry suggests software, also emit a SoftwareApplication
  // node in the same @graph so AI engines can bind the brand to its
  // product category. Cheap to include — the `@id` anchor wires it back
  // to the Organization node.
  if (
    b.industry &&
    /software|saas|fintech|platform|tech/i.test(b.industry)
  ) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: b.name,
      url,
      applicationCategory: b.industry,
      ...(b.description ? { description: b.description } : {}),
      publisher: { "@id": `${url}#org` },
    });
    organization["@id"] = `${url}#org`;
  }

  const envelope =
    graph.length === 1 ? graph[0] : { "@context": "https://schema.org", "@graph": graph };
  return wrapScript(envelope);
}

export function generateFAQSchema(brand: Brand): string | null {
  const b = coerceBrand(brand);
  const questions = Array.isArray(b.geoKeywords)
    ? (b.geoKeywords as unknown[]).filter(
        (q): q is string => typeof q === "string" && q.trim().length > 0,
      )
    : [];

  if (questions.length === 0) return null;

  // The user hasn't written real answers yet — emit a template they can
  // fill in. The placeholder `{{ANSWER}}` makes it obvious this isn't
  // production-ready and forces the operator to author content rather
  // than ship vacuous schema. Better than fabricating an answer that
  // would later be wrong.
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: `{{ANSWER: fill in an accurate answer for "${q}"}}`,
      },
    })),
  };

  return wrapScript(faqPage);
}

/**
 * Route an audit-rule issue title to the right generator. Returns null
 * when the issue isn't schema-shaped or when generation isn't possible
 * from the current brand data.
 */
export function generateSchemaCodeForIssue(
  issueTitle: string,
  brand: Brand,
): string | null {
  const title = issueTitle.toLowerCase();
  if (title.includes("faq")) return generateFAQSchema(brand);
  if (title.includes("schema.org") || title.includes("structured data")) {
    return generateOrganizationSchema(brand);
  }
  return null;
}
