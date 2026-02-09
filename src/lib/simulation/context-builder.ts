const MAX_CONTEXT_LENGTH = 3000;

/**
 * Build base brand context from brand data
 */
export function buildBrandContext(brand: {
  name: string;
  domain?: string | null;
  description?: string | null;
  keywords?: string[];
  industry?: string | null;
}): string {
  const parts: string[] = [];

  parts.push(`Brand: ${brand.name}`);
  if (brand.domain) parts.push(`Website: ${brand.domain}`);
  if (brand.industry) parts.push(`Industry: ${brand.industry}`);
  if (brand.description) parts.push(`Description: ${brand.description}`);
  if (brand.keywords && brand.keywords.length > 0) {
    parts.push(`Keywords: ${brand.keywords.join(", ")}`);
  }

  return parts.join("\n");
}

/**
 * Build enriched context by appending draft content to the base brand context.
 * Truncates the combined result to MAX_CONTEXT_LENGTH to ensure consistent
 * behavior across platforms with varying context windows.
 */
export function buildEnrichedContext(
  baseContext: string,
  title: string | undefined | null,
  body: string,
  contentType?: string | null
): string {
  const contentLabel = contentType
    ? `Draft ${contentType} content`
    : "Draft content";

  const enrichment = [
    "",
    `--- ${contentLabel} (unpublished) ---`,
    title ? `Title: ${title}` : null,
    body,
    "--- End draft content ---",
  ]
    .filter(Boolean)
    .join("\n");

  const combined = baseContext + "\n" + enrichment;

  if (combined.length > MAX_CONTEXT_LENGTH) {
    return combined.slice(0, MAX_CONTEXT_LENGTH);
  }

  return combined;
}
