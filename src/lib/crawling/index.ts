/**
 * Crawling Enhancement Module (Phase 7.0)
 *
 * Cheerio-based DOM extraction utilities that ENHANCE (not replace) existing crawlers.
 * Primary use case: Phase 7.2 people/team discovery and social link extraction.
 *
 * @example
 * import { createExtractor, extractTeamFromHtml, extractSocialsFromHtml } from "@/lib/crawling";
 *
 * // Full extractor API
 * const extractor = createExtractor(html);
 * const team = extractor.extractTeamMembers();
 * const social = extractor.extractSocialLinks();
 * const schemas = extractor.extractJsonLd();
 *
 * // Quick one-liner extraction
 * const teamMembers = extractTeamFromHtml(html);
 * const socialLinks = extractSocialsFromHtml(html);
 */

// Core extractor
export {
  createExtractor,
  extractTeamFromHtml,
  extractSocialsFromHtml,
  extractSchemasFromHtml,
} from "./extractor";

// Extractor types
export type {
  ExtractorResult,
  HeadingStructure,
  MetaData,
  OpenGraphData,
  TwitterCardData,
  ImageData,
  LinkData,
  JsonLdSchema,
} from "./extractor";

// Team discovery
export { extractTeamPatterns } from "./team-discovery";
export type {
  TeamMember,
  TeamExtractionResult,
} from "./team-discovery";

// Social discovery
export {
  extractSocialPatterns,
  getSocialByPlatform,
  getLinkedInLinks,
  hasSocialLinks,
  getSocialHandles,
} from "./social-discovery";
export type {
  SocialPlatform,
  SocialLink,
  SocialExtractionResult,
} from "./social-discovery";
