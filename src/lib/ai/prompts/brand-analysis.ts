/**
 * Brand Analysis AI Prompt
 * Uses OpenAI to analyze website data and extract structured brand information
 */

import { sendMessage, GPT_MODELS } from "@/lib/ai/openai";

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
  "Advertising",
  "Telecommunications",
  "Internet Service Provider",
  "Consulting",
  "Manufacturing",
  "Energy",
  "Construction",
  "Logistics",
  "Insurance",
  "Hospitality",
  "Retail",
  "Agriculture",
  "Aerospace",
  "Pharmaceuticals",
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

// Location info extracted from website
export interface BrandLocationInfo {
  type: "headquarters" | "office" | "regional";
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
}

// Personnel info extracted from website
export interface BrandPersonnelInfo {
  name: string;
  title: string;
  department?: string;
  bio?: string;
  email?: string;
  linkedinUrl?: string;
}

// Company history and business knowledge
export interface CompanyHistory {
  foundedYear?: number;
  founderNames?: string[];
  companySize?: string;
  revenue?: string;
  milestones?: Array<{
    year: number;
    event: string;
  }>;
  awards?: string[];
  partnerships?: string[];
}

// Output from brand analysis
export interface BrandAnalysisResult {
  brandName: string;
  description: string;
  tagline: string | null;
  industry: Industry;
  primaryColor: string;
  secondaryColor: string | null;
  accentColor: string | null;
  colorPalette: string[];
  logoUrl: string | null;
  keywords: string[];
  seoKeywords: string[];
  geoKeywords: string[];
  competitors: Array<{
    name: string;
    url: string;
    reason: string;
  }>;
  targetAudience: string;
  valuePropositions: string[];
  socialLinks: Record<string, string>;
  locations?: BrandLocationInfo[];
  personnel?: BrandPersonnelInfo[];
  history?: CompanyHistory;
  confidence: {
    overall: number;
    perField: Record<string, number>;
  };
}

// System prompt for brand analysis
const SYSTEM_PROMPT = `You are a brand analysis expert specializing in GEO (Generative Engine Optimization) and AEO (Answer Engine Optimization). Your task is to analyze website data and extract comprehensive brand information for AI visibility optimization.

You will receive data scraped from a company's website including:
- Page title and meta description
- OpenGraph data
- Headings (H1, H2)
- Body text content
- Image URLs and alt text
- External links
- Inline CSS styles and colors

Based on this data, you must extract COMPREHENSIVE brand information:

1. **Brand Name**: The official company or brand name (not a tagline)

2. **Description**: A 2-3 sentence description of what the company does, their main offerings, and unique value

3. **Tagline**: The brand's tagline or slogan if visible (e.g., "Just Do It", "Think Different")

4. **Industry**: One of these categories: ${INDUSTRY_OPTIONS.join(", ")}

5. **Color Palette** - Extract ALL colors you can identify:
   - **Primary Color**: Main brand color (hex code)
   - **Secondary Color**: Supporting brand color (hex code)
   - **Accent Color**: Highlight/CTA color (hex code)
   - **Color Palette**: Array of 3-6 brand colors found in the design

6. **Logo URL**: If you can identify a likely logo image URL, include it

7. **Keywords** - Extract 3 types:
   - **keywords**: 10-15 general keywords describing the brand and offerings
   - **seoKeywords**: 5-8 traditional SEO keywords (search-optimized terms)
   - **geoKeywords**: 5-8 GEO keywords (terms optimized for AI assistants like ChatGPT, Claude, Gemini)

8. **Competitors**: Up to 5 competitors based on industry and market position:
   - name: Company name
   - url: Their website URL (use real, well-known companies)
   - reason: Why they compete (market overlap, similar offerings, target audience)

9. **Target Audience**: A description of who this brand serves (demographics, psychographics, needs)

10. **Value Propositions**: 3-5 key value props or unique selling points

11. **Social Links**: Any social media URLs found (facebook, twitter, linkedin, instagram, youtube, etc.)

12. **Contact Information & Locations**: Extract ALL business locations found across all pages:
   - **type**: headquarters (main office), office (branch), or regional (regional center)
   - **address**: Full street address if available
   - **city**: City name
   - **state**: State/province (if applicable)
   - **country**: Country name
   - **postalCode**: Zip/postal code
   - **phone**: Contact phone number
   - **email**: Contact email address
   - Extract from: Contact page, footer, About page, "Visit Us" sections
   - Look for patterns like: "123 Main St", "Suite 100", postal codes, phone numbers

13. **Key Personnel**: Extract up to 10 key people from About/Team/Leadership pages:
   - **name**: Full name
   - **title**: Job title (CEO, CTO, VP Marketing, etc.)
   - **department**: Department/division if mentioned
   - **bio**: Brief biography or description (1-2 sentences)
   - **email**: Direct email if available
   - **linkedinUrl**: LinkedIn profile URL if visible
   - Look in: Team page, Leadership page, About Us page, founder stories
   - Prioritize C-suite, founders, executives, department heads

14. **Company History & Business Knowledge**: Extract if available from History/About pages:
   - **foundedYear**: Year the company was founded
   - **founderNames**: Names of founder(s) if mentioned
   - **companySize**: Number of employees if mentioned (e.g., "500+ employees")
   - **revenue**: Annual revenue if publicly stated
   - **milestones**: Key company milestones (2-4 major events with years)
   - **awards**: Notable awards or recognitions
   - **partnerships**: Key partnerships or technology partners mentioned

15. **Confidence**: Scores for overall analysis (0-100) and per-field

IMPORTANT RULES:
- Respond ONLY with valid JSON, no markdown formatting or backticks
- Be COMPREHENSIVE - extract as much relevant data as possible
- Brand name should be the official company name, not a tagline
- For colors, extract actual hex codes when visible, or infer from industry standards
- GEO keywords should be conversational queries users might ask AI assistants
- SEO keywords should be traditional search terms
- Competitors must be REAL companies that users would recognize
- Be honest about confidence - if data is limited, reflect that in scores
- For fiber/telecom companies, include competitors like other ISPs, fiber providers in the same region`;

// User prompt template
function buildUserPrompt(input: BrandAnalysisInput): string {
  // Extract social media links
  const socialLinks = input.links.filter((link) => {
    const href = link.href.toLowerCase();
    return href.includes("facebook.com") || href.includes("twitter.com") || href.includes("x.com") ||
           href.includes("linkedin.com") || href.includes("instagram.com") || href.includes("youtube.com") ||
           href.includes("tiktok.com") || href.includes("pinterest.com");
  });

  return `Analyze this website data and extract COMPREHENSIVE brand information:

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

H2 HEADINGS (first 15):
${input.h2Tags.length > 0 ? input.h2Tags.slice(0, 15).map((h) => `- ${h}`).join("\n") : "None found"}

BODY TEXT (comprehensive excerpt):
${input.bodyText.slice(0, 4000) || "Not available"}

IMAGES (with logo potential):
${input.images.filter((img) => {
  const src = img.src.toLowerCase();
  const alt = img.alt.toLowerCase();
  return src.includes("logo") || alt.includes("logo") || src.includes("brand") || src.includes("icon");
}).slice(0, 8).map((img) => `- ${img.src} (alt: "${img.alt}")`).join("\n") || "No logo candidates found"}

ALL IMAGES (for color analysis):
${input.images.slice(0, 15).map((img) => `- ${img.alt || img.src.split("/").pop()}`).join("\n") || "None found"}

SOCIAL MEDIA LINKS:
${socialLinks.length > 0 ? socialLinks.map((link) => `- ${link.href}`).join("\n") : "None found"}

EXTERNAL LINKS (potential competitors/partners):
${input.links.filter(l => !socialLinks.includes(l)).slice(0, 15).map((link) => `- ${link.text}: ${link.href}`).join("\n") || "None found"}

SCHEMA TYPES:
${input.schemaTypes.length > 0 ? input.schemaTypes.join(", ") : "None found"}

Respond with a JSON object matching this EXACT structure:
{
  "brandName": "string",
  "description": "string (2-3 sentences)",
  "tagline": "string or null",
  "industry": "string (from: ${INDUSTRY_OPTIONS.join(", ")})",
  "primaryColor": "#XXXXXX",
  "secondaryColor": "#XXXXXX or null",
  "accentColor": "#XXXXXX or null",
  "colorPalette": ["#hex1", "#hex2", ...],
  "logoUrl": "string or null",
  "keywords": ["10-15 general keywords"],
  "seoKeywords": ["5-8 SEO keywords"],
  "geoKeywords": ["5-8 GEO/AI keywords"],
  "competitors": [
    { "name": "string", "url": "https://...", "reason": "string" }
  ],
  "targetAudience": "string describing who this brand serves",
  "valuePropositions": ["value prop 1", "value prop 2", ...],
  "socialLinks": {
    "facebook": "url or null",
    "twitter": "url or null",
    "linkedin": "url or null",
    "instagram": "url or null",
    "youtube": "url or null"
  },
  "locations": [
    {
      "type": "headquarters | office | regional",
      "address": "string or null",
      "city": "string or null",
      "state": "string or null",
      "country": "string or null",
      "postalCode": "string or null",
      "phone": "string or null",
      "email": "string or null"
    }
  ],
  "personnel": [
    {
      "name": "string",
      "title": "string",
      "department": "string or null",
      "bio": "string or null",
      "email": "string or null",
      "linkedinUrl": "string or null"
    }
  ],
  "history": {
    "foundedYear": number or null,
    "founderNames": ["string"] or null,
    "companySize": "string or null",
    "revenue": "string or null",
    "milestones": [
      { "year": number, "event": "string" }
    ] or null,
    "awards": ["string"] or null,
    "partnerships": ["string"] or null
  },
  "confidence": {
    "overall": number (0-100),
    "perField": {
      "brandName": number,
      "description": number,
      "tagline": number,
      "industry": number,
      "colors": number,
      "keywords": number,
      "competitors": number,
      "targetAudience": number,
      "locations": number,
      "personnel": number
    }
  }
}`;
}

/**
 * Analyze brand information from website data using OpenAI
 */
export async function analyzeBrandFromWebsite(
  input: BrandAnalysisInput
): Promise<BrandAnalysisResult> {
  const userPrompt = buildUserPrompt(input);

  try {
    // Use OpenAI's sendMessage with system prompt and user message
    const response = await sendMessage(
      SYSTEM_PROMPT,
      userPrompt,
      GPT_MODELS.GPT4O,
      3000 // max tokens
    );

    // Parse JSON response
    const parsed = parseAIResponse(response.content);

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
  const validateColor = (color: unknown): string | null => {
    if (typeof color !== "string") return null;
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
    if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
      // Expand 3-digit hex to 6-digit
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    return null;
  };

  const primaryColor = validateColor(parsed.primaryColor) || "#4926FA";
  const secondaryColor = validateColor(parsed.secondaryColor);
  const accentColor = validateColor(parsed.accentColor);

  // Validate color palette
  let colorPalette = parsed.colorPalette as string[];
  if (!Array.isArray(colorPalette)) {
    colorPalette = [];
  }
  colorPalette = colorPalette
    .map(c => validateColor(c))
    .filter((c): c is string => c !== null)
    .slice(0, 6);

  // Validate keywords arrays
  const validateKeywords = (kw: unknown, max: number): string[] => {
    if (!Array.isArray(kw)) return [];
    return kw
      .filter((k) => typeof k === "string" && k.length > 0)
      .slice(0, max);
  };

  const keywords = validateKeywords(parsed.keywords, 15);
  const seoKeywords = validateKeywords(parsed.seoKeywords, 8);
  const geoKeywords = validateKeywords(parsed.geoKeywords, 8);

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

  // Validate value propositions
  let valuePropositions = parsed.valuePropositions as string[];
  if (!Array.isArray(valuePropositions)) {
    valuePropositions = [];
  }
  valuePropositions = valuePropositions
    .filter((v) => typeof v === "string" && v.length > 0)
    .slice(0, 5);

  // Validate social links
  const socialLinks = parsed.socialLinks as Record<string, string> || {};
  const normalizedSocialLinks: Record<string, string> = {};
  for (const [platform, url] of Object.entries(socialLinks)) {
    if (typeof url === "string" && url.startsWith("http")) {
      normalizedSocialLinks[platform] = url;
    }
  }

  // Validate locations
  let locations = parsed.locations as BrandLocationInfo[];
  if (!Array.isArray(locations)) {
    locations = [];
  }
  locations = locations
    .filter(
      (loc) =>
        typeof loc === "object" &&
        loc !== null &&
        (loc.address || loc.city || loc.country)
    )
    .slice(0, 10) // Max 10 locations
    .map((loc) => ({
      type: (loc.type as "headquarters" | "office" | "regional") || "office",
      address: loc.address || undefined,
      city: loc.city || undefined,
      state: loc.state || undefined,
      country: loc.country || undefined,
      postalCode: loc.postalCode || undefined,
      phone: loc.phone || undefined,
      email: loc.email || undefined,
    }));

  // Validate personnel
  let personnel = parsed.personnel as BrandPersonnelInfo[];
  if (!Array.isArray(personnel)) {
    personnel = [];
  }
  personnel = personnel
    .filter(
      (person) =>
        typeof person === "object" &&
        person !== null &&
        typeof person.name === "string" &&
        typeof person.title === "string"
    )
    .slice(0, 10) // Max 10 people
    .map((person) => ({
      name: person.name,
      title: person.title,
      department: person.department || undefined,
      bio: person.bio || undefined,
      email: person.email || undefined,
      linkedinUrl: person.linkedinUrl || undefined,
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
    tagline: (parsed.tagline as string) || null,
    industry: industry as Industry,
    primaryColor,
    secondaryColor,
    accentColor,
    colorPalette,
    logoUrl: (parsed.logoUrl as string) || null,
    keywords,
    seoKeywords,
    geoKeywords,
    competitors,
    targetAudience: (parsed.targetAudience as string) || "",
    valuePropositions,
    socialLinks: normalizedSocialLinks,
    locations,
    personnel,
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
    tagline: null,
    industry: "Technology",
    primaryColor: "#4926FA",
    secondaryColor: null,
    accentColor: null,
    colorPalette: [],
    logoUrl: null,
    keywords: [],
    seoKeywords: [],
    geoKeywords: [],
    competitors: [],
    targetAudience: "",
    valuePropositions: [],
    socialLinks: {},
    locations: [],
    personnel: [],
    confidence: {
      overall: 20,
      perField: {
        brandName: 30,
        description: 40,
        tagline: 0,
        industry: 10,
        colors: 10,
        keywords: 0,
        competitors: 0,
        targetAudience: 0,
        locations: 0,
        personnel: 0,
      },
    },
  };
}
