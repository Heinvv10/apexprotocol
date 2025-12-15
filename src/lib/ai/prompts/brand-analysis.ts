/**
 * Brand Analysis AI Prompt
 * Uses Claude to analyze website data and extract structured brand information
 */

import { sendMessage, CLAUDE_MODELS } from "@/lib/ai/claude";

// Industry options that match the brand form
export const INDUSTRY_OPTIONS = [
  "Technology",
  "E-commerce",
  "Finance",
  "Healthcare",
  "Education",
  "Real Estate",
  "Travel",
  "Food & Beverage",
  "Fashion",
  "Automotive",
  "Entertainment",
  "Sports",
  "News & Media",
  "Legal",
  "Marketing",
  "Consulting",
  "Manufacturing",
  "Energy",
  "Non-profit",
  "Government",
  "Other",
] as const;

export type Industry = (typeof INDUSTRY_OPTIONS)[number];

// Input data for brand analysis
export interface BrandAnalysisInput {
  url: string;
  title: string;
  metaDescription: string;
  ogData: {
    title: string;
    description: string;
    image: string;
    siteName: string;
  };
  h1Tags: string[];
  h2Tags: string[];
  bodyText: string;
  images: Array<{ src: string; alt: string }>;
  links: Array<{ href: string; text: string }>;
  schemaTypes: string[];
}

// Output from brand analysis
export interface BrandAnalysisResult {
  brandName: string;
  description: string;
  industry: Industry;
  primaryColor: string;
  logoUrl: string | null;
  keywords: string[];
  competitors: Array<{
    name: string;
    url: string;
    reason: string;
  }>;
  confidence: {
    overall: number;
    perField: Record<string, number>;
  };
}

// System prompt for brand analysis
const SYSTEM_PROMPT = `You are a brand analysis expert. Your task is to analyze website data and extract structured brand information.

You will receive data scraped from a company's website including:
- Page title and meta description
- OpenGraph data
- Headings (H1, H2)
- Body text content
- Image URLs and alt text
- External links

Based on this data, you must extract:
1. **Brand Name**: The company or brand name (not a tagline)
2. **Description**: A 1-2 sentence description of what the company does
3. **Industry**: One of these categories: ${INDUSTRY_OPTIONS.join(", ")}
4. **Primary Color**: The brand's main color as a hex code (e.g., #4926FA). Look for brand colors in CSS, logo references, or infer from industry standards.
5. **Logo URL**: If you can identify a likely logo image URL from the data, include it. Otherwise, null.
6. **Keywords**: 5-10 SEO/GEO relevant keywords that describe what this brand offers
7. **Competitors**: Up to 5 likely competitors based on the industry and business type. Include:
   - name: Company name
   - url: Their website URL (use well-known companies in the industry)
   - reason: Brief explanation of why they're a competitor

8. **Confidence**: Your confidence score for the overall analysis (0-100) and per-field scores

IMPORTANT RULES:
- Respond ONLY with valid JSON, no markdown formatting or backticks
- Brand name should be the official company name, not a tagline or slogan
- Description should be factual, not promotional
- Choose the single most appropriate industry from the provided list
- For primary color, provide a hex code that would work well as a brand accent color
- Keywords should be relevant for AI/search engine optimization
- Only include real, well-known competitors that users would recognize
- Be honest about confidence - if data is limited, reflect that in scores`;

// User prompt template
function buildUserPrompt(input: BrandAnalysisInput): string {
  return `Analyze this website data and extract brand information:

URL: ${input.url}

PAGE TITLE: ${input.title || "Not found"}

META DESCRIPTION: ${input.metaDescription || "Not found"}

OPENGRAPH DATA:
- OG Title: ${input.ogData.title || "Not found"}
- OG Description: ${input.ogData.description || "Not found"}
- OG Image: ${input.ogData.image || "Not found"}
- OG Site Name: ${input.ogData.siteName || "Not found"}

H1 HEADINGS:
${input.h1Tags.length > 0 ? input.h1Tags.map((h) => `- ${h}`).join("\n") : "None found"}

H2 HEADINGS (first 10):
${input.h2Tags.length > 0 ? input.h2Tags.slice(0, 10).map((h) => `- ${h}`).join("\n") : "None found"}

BODY TEXT (excerpt):
${input.bodyText.slice(0, 2000) || "Not available"}

IMAGES (with logo potential):
${input.images.filter((img) => {
  const src = img.src.toLowerCase();
  const alt = img.alt.toLowerCase();
  return src.includes("logo") || alt.includes("logo") || src.includes("brand");
}).slice(0, 5).map((img) => `- ${img.src} (alt: "${img.alt}")`).join("\n") || "No logo candidates found"}

EXTERNAL LINKS (potential competitors/partners):
${input.links.slice(0, 10).map((link) => `- ${link.text}: ${link.href}`).join("\n") || "None found"}

SCHEMA TYPES:
${input.schemaTypes.length > 0 ? input.schemaTypes.join(", ") : "None found"}

Respond with a JSON object matching this structure:
{
  "brandName": "string",
  "description": "string",
  "industry": "string (from allowed list)",
  "primaryColor": "#XXXXXX",
  "logoUrl": "string or null",
  "keywords": ["keyword1", "keyword2", ...],
  "competitors": [
    { "name": "string", "url": "string", "reason": "string" }
  ],
  "confidence": {
    "overall": number (0-100),
    "perField": {
      "brandName": number,
      "description": number,
      "industry": number,
      "primaryColor": number,
      "keywords": number,
      "competitors": number
    }
  }
}`;
}

/**
 * Analyze brand information from website data using Claude AI
 */
export async function analyzeBrandFromWebsite(
  input: BrandAnalysisInput
): Promise<BrandAnalysisResult> {
  const userPrompt = buildUserPrompt(input);

  try {
    const response = await sendMessage(userPrompt, {
      model: CLAUDE_MODELS.SONNET_3_5,
      maxTokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent output
      system: SYSTEM_PROMPT,
    });

    // Parse JSON response
    const parsed = parseAIResponse(response);

    // Validate and normalize the response
    return normalizeAnalysisResult(parsed);
  } catch (error) {
    console.error("[BrandAnalysis] AI analysis failed:", error);

    // Return a fallback result with low confidence
    return createFallbackResult(input);
  }
}

/**
 * Parse AI response, handling potential JSON formatting issues
 */
function parseAIResponse(response: string): Record<string, unknown> {
  // Try direct parse first
  try {
    return JSON.parse(response);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }

    // Try to find JSON object in response
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }

    throw new Error("Could not parse AI response as JSON");
  }
}

/**
 * Normalize and validate the analysis result
 */
function normalizeAnalysisResult(
  parsed: Record<string, unknown>
): BrandAnalysisResult {
  // Validate industry is from allowed list
  let industry = parsed.industry as string;
  if (!INDUSTRY_OPTIONS.includes(industry as Industry)) {
    // Find closest match or default to "Technology"
    const lowerIndustry = industry?.toLowerCase() || "";
    const match = INDUSTRY_OPTIONS.find(
      (opt) =>
        opt.toLowerCase().includes(lowerIndustry) ||
        lowerIndustry.includes(opt.toLowerCase())
    );
    industry = match || "Technology";
  }

  // Validate color is a hex code
  let primaryColor = parsed.primaryColor as string;
  if (!primaryColor || !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
    primaryColor = "#4926FA"; // Default to Apex purple
  }

  // Validate keywords is an array
  let keywords = parsed.keywords as string[];
  if (!Array.isArray(keywords)) {
    keywords = [];
  }
  keywords = keywords.filter(
    (k) => typeof k === "string" && k.length > 0
  ).slice(0, 10);

  // Validate competitors
  let competitors = parsed.competitors as Array<{
    name: string;
    url: string;
    reason: string;
  }>;
  if (!Array.isArray(competitors)) {
    competitors = [];
  }
  competitors = competitors
    .filter(
      (c) =>
        typeof c === "object" &&
        c !== null &&
        typeof c.name === "string" &&
        typeof c.url === "string"
    )
    .slice(0, 5)
    .map((c) => ({
      name: c.name,
      url: c.url.startsWith("http") ? c.url : `https://${c.url}`,
      reason: c.reason || "Industry competitor",
    }));

  // Validate confidence scores
  const confidence = parsed.confidence as {
    overall: number;
    perField: Record<string, number>;
  };
  const normalizedConfidence = {
    overall: Math.min(100, Math.max(0, confidence?.overall || 50)),
    perField: confidence?.perField || {},
  };

  return {
    brandName: (parsed.brandName as string) || "",
    description: (parsed.description as string) || "",
    industry: industry as Industry,
    primaryColor,
    logoUrl: (parsed.logoUrl as string) || null,
    keywords,
    competitors,
    confidence: normalizedConfidence,
  };
}

/**
 * Create a fallback result when AI analysis fails
 */
function createFallbackResult(input: BrandAnalysisInput): BrandAnalysisResult {
  // Extract brand name from OG site name, title, or URL
  let brandName = input.ogData.siteName || "";
  if (!brandName && input.title) {
    brandName = input.title.split(/\s*[-|•]\s*/)[0].trim();
  }
  if (!brandName) {
    try {
      const hostname = new URL(input.url).hostname;
      brandName = hostname.replace(/^www\./, "").split(".")[0];
      brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
    } catch {
      brandName = "Unknown Brand";
    }
  }

  return {
    brandName,
    description: input.metaDescription || input.ogData.description || "",
    industry: "Technology",
    primaryColor: "#4926FA",
    logoUrl: null,
    keywords: [],
    competitors: [],
    confidence: {
      overall: 20,
      perField: {
        brandName: 30,
        description: 40,
        industry: 10,
        primaryColor: 10,
        keywords: 0,
        competitors: 0,
      },
    },
  };
}
