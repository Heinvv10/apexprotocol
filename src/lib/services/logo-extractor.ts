/**
 * Logo Extractor Service
 * Downloads and processes logo images from websites
 */

// Logo candidate with priority
export interface LogoCandidate {
  src: string;
  type: "favicon" | "apple-touch-icon" | "og-image" | "logo-named" | "ai-suggested";
  priority: number; // Lower is higher priority
}

// Logo extraction result
export interface ExtractedLogo {
  url: string;
  originalUrl: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Extract the best logo from a list of candidates
 * For now, we return the URL directly without uploading to storage
 * Storage upload can be added later when the storage infrastructure is in place
 */
export async function extractBestLogo(
  candidates: LogoCandidate[],
  baseUrl: string
): Promise<string | null> {
  if (candidates.length === 0) {
    return null;
  }

  // Sort by priority (lower is better)
  const sorted = [...candidates].sort((a, b) => a.priority - b.priority);

  // Try each candidate until we find a valid one
  for (const candidate of sorted) {
    try {
      const absoluteUrl = resolveUrl(candidate.src, baseUrl);

      // Validate the URL is accessible
      const isValid = await validateImageUrl(absoluteUrl);
      if (isValid) {
        return absoluteUrl;
      }
    } catch (error) {
      console.warn(`[LogoExtractor] Failed to validate ${candidate.src}:`, error);
      // Continue to next candidate
    }
  }

  return null;
}

/**
 * Resolve a potentially relative URL to an absolute URL
 */
function resolveUrl(src: string, baseUrl: string): string {
  // Already absolute
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  // Protocol-relative
  if (src.startsWith("//")) {
    return `https:${src}`;
  }

  // Relative URL
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return src;
  }
}

/**
 * Validate that an image URL is accessible and returns an image
 */
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "ApexBot/1.0 (Logo Extraction)",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return false;
    }

    // Check content type
    const contentType = response.headers.get("content-type") || "";
    return (
      contentType.startsWith("image/") ||
      contentType.includes("svg") ||
      contentType.includes("ico")
    );
  } catch {
    return false;
  }
}

/**
 * Extract favicon and apple-touch-icon URLs from HTML
 */
export function extractFavicons(html: string, baseUrl: string): LogoCandidate[] {
  const candidates: LogoCandidate[] = [];

  // Apple touch icon (highest quality)
  const appleTouchMatch = html.match(
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i
  ) || html.match(
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i
  );

  if (appleTouchMatch) {
    candidates.push({
      src: appleTouchMatch[1],
      type: "apple-touch-icon",
      priority: 1,
    });
  }

  // Large favicon
  const faviconMatches = html.matchAll(
    /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["'][^>]*>/gi
  );

  for (const match of faviconMatches) {
    // Check for size attribute
    const sizeMatch = match[0].match(/sizes=["'](\d+)x(\d+)["']/i);
    const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 16;

    // Prioritize larger favicons
    const priority = size >= 192 ? 2 : size >= 64 ? 3 : 4;

    candidates.push({
      src: match[1],
      type: "favicon",
      priority,
    });
  }

  // Default favicon.ico
  candidates.push({
    src: "/favicon.ico",
    type: "favicon",
    priority: 5,
  });

  return candidates;
}

/**
 * Score a logo candidate based on various factors
 */
export function scoreLogoCandidate(
  candidate: LogoCandidate,
  url: string
): number {
  let score = 100 - candidate.priority * 10;

  // Bonus for SVG (vector, scalable)
  if (url.endsWith(".svg")) {
    score += 20;
  }

  // Bonus for PNG (transparency support)
  if (url.endsWith(".png")) {
    score += 10;
  }

  // Bonus for "logo" in path
  if (url.toLowerCase().includes("logo")) {
    score += 15;
  }

  // Penalty for very small images (likely favicon)
  if (url.includes("16x16") || url.includes("32x32")) {
    score -= 20;
  }

  // Bonus for larger sizes
  if (url.includes("192x192") || url.includes("512x512")) {
    score += 15;
  }

  return score;
}

/**
 * Get the best logo from OG image, favicons, and named logo files
 * This is a convenience function that combines multiple extraction methods
 */
export async function getBestLogoFromPage(
  html: string,
  baseUrl: string,
  ogImage?: string
): Promise<string | null> {
  const candidates: LogoCandidate[] = [];

  // Add OG image
  if (ogImage) {
    candidates.push({
      src: ogImage,
      type: "og-image",
      priority: 3,
    });
  }

  // Extract favicons
  const favicons = extractFavicons(html, baseUrl);
  candidates.push(...favicons);

  // Find images with "logo" in the name
  const logoRegex = /<img[^>]*src=["']([^"']*logo[^"']*)["'][^>]*>/gi;
  let match;
  while ((match = logoRegex.exec(html)) !== null) {
    candidates.push({
      src: match[1],
      type: "logo-named",
      priority: 0, // Highest priority for explicitly named logos
    });
  }

  return extractBestLogo(candidates, baseUrl);
}
