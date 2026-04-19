/**
 * SemanticAnalysisService - Schema.org, semantic HTML, entity extraction, and accessibility analysis
 * Part of the Site Audit Sub-Agent
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Configuration schema
const SemanticConfigSchema = z.object({
  validateSchema: z.boolean().default(true),
  extractEntities: z.boolean().default(true),
  analyzeSemanticHTML: z.boolean().default(true),
  checkAccessibility: z.boolean().default(true),
  topicExtractionDepth: z.number().default(10),
  keywordDensityThreshold: z.number().default(3), // Percent
});

export type SemanticConfig = z.infer<typeof SemanticConfigSchema>;

// Schema.org types
export interface SchemaOrgSchema {
  type: string;
  format: 'json-ld' | 'microdata' | 'rdfa';
  properties: Record<string, unknown>;
  raw: unknown;
}

export interface SchemaOrgData {
  schemas: SchemaOrgSchema[];
  hasSchemaOrg: boolean;
  types: string[];
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Semantic HTML types
export interface SemanticMarkup {
  hasHeader: boolean;
  hasNav: boolean;
  hasMain: boolean;
  hasArticle: boolean;
  hasSection: boolean;
  hasAside: boolean;
  hasFooter: boolean;
  semanticScore: number;
  suggestions: string[];
  issues: string[];
}

export interface LandmarkRoles {
  hasBanner: boolean;
  hasNavigation: boolean;
  hasMain: boolean;
  hasComplementary: boolean;
  hasContentinfo: boolean;
  roles: string[];
}

// Entity types
export interface EntityAnalysis {
  organizations: string[];
  people: string[];
  locations: string[];
  products: string[];
  dates: string[];
  monetaryValues: string[];
  emails: string[];
  urls: string[];
}

export interface EntityDensity {
  density: number;
  entityCount: number;
  wordCount: number;
}

// Content structure types
export interface HeadingHierarchy {
  isValid: boolean;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h4Count: number;
  h5Count: number;
  h6Count: number;
  issues: string[];
}

export interface ParagraphAnalysis {
  count: number;
  averageLength: number;
  totalWords: number;
}

export interface ListAnalysis {
  unordered: number;
  ordered: number;
  totalItems: number;
}

export interface TableAnalysis {
  count: number;
  withHeaders: number;
  withCaptions: number;
  accessibilityScore: number;
  accessibilityIssues: string[];
}

export interface ContentStructure {
  headingHierarchy: HeadingHierarchy;
  paragraphs: ParagraphAnalysis;
  lists: ListAnalysis;
  tables: TableAnalysis;
}

// Accessibility types
export interface ARIAAnalysis {
  ariaLabels: number;
  ariaRoles: string[];
  hasAriaLabelledby: boolean;
  issues: string[];
}

export interface FormAccessibility {
  inputsWithLabels: number;
  inputsWithoutLabels: number;
  hasAriaDescribedby: boolean;
  accessibilityScore: number;
}

export interface ImageAccessibility {
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  decorativeImages: number;
}

// Topic/Keyword types
export interface TopicExtraction {
  mainTopics: string[];
  secondaryTopics: string[];
}

export interface KeywordDensityResult {
  count: number;
  density: number;
  totalWords: number;
}

export interface KeywordStuffingResult {
  isStuffed: boolean;
  stuffedKeywords: string[];
  densities: Record<string, number>;
}

export interface KeyPhrase {
  phrase: string;
  count: number;
}

// Issue types
export interface SemanticIssue {
  id: string;
  type: string;
  category?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation?: string;
}

// Page data for schema recommendations
export interface PageDataForSchema {
  url: string;
  title: string;
  type: string;
  hasAuthor?: boolean;
  hasPublishDate?: boolean;
  hasPrice?: boolean;
  hasReviews?: boolean;
}

// Known Schema.org types
const KNOWN_SCHEMA_TYPES = new Set([
  'Article', 'BlogPosting', 'NewsArticle', 'WebPage', 'WebSite',
  'Organization', 'Person', 'Product', 'LocalBusiness', 'Event',
  'Recipe', 'Review', 'FAQPage', 'HowTo', 'BreadcrumbList',
  'ItemList', 'VideoObject', 'ImageObject', 'CreativeWork',
  'Book', 'Movie', 'MusicRecording', 'SoftwareApplication',
  'Course', 'JobPosting', 'Offer', 'Service', 'Place'
]);

// Required properties for common schema types
const REQUIRED_PROPERTIES: Record<string, string[]> = {
  'Article': ['headline', 'author', 'datePublished'],
  'BlogPosting': ['headline', 'author', 'datePublished'],
  'Product': ['name', 'description'],
  'Organization': ['name'],
  'Person': ['name'],
  'Event': ['name', 'startDate', 'location'],
  'Recipe': ['name', 'recipeIngredient'],
  'Review': ['itemReviewed', 'reviewRating'],
  'FAQPage': ['mainEntity'],
  'HowTo': ['name', 'step'],
};

// Common named entities for extraction
const KNOWN_ORGANIZATIONS = [
  'Apple', 'Apple Inc.', 'Google', 'Microsoft', 'Amazon', 'Facebook', 'Meta',
  'Tesla', 'Netflix', 'Twitter', 'IBM', 'Intel', 'Samsung', 'Sony'
];

const KNOWN_PRODUCTS = [
  'iPhone', 'iPad', 'MacBook', 'Android', 'Windows', 'Chrome', 'Firefox',
  'Safari', 'Office', 'Photoshop', 'AWS', 'Azure', 'GCP'
];

export class SemanticAnalysisService extends EventEmitter {
  private config: SemanticConfig;
  private issues: SemanticIssue[] = [];
  private issueIdCounter = 0;

  constructor(config: Partial<SemanticConfig> = {}) {
    super();
    this.config = SemanticConfigSchema.parse(config);
  }

  getConfig(): SemanticConfig {
    return { ...this.config };
  }

  shutdown(): void {
    this.removeAllListeners();
    this.issues = [];
  }

  // Schema.org Analysis
  extractSchemaOrg(html: string): SchemaOrgData {
    const schemas: SchemaOrgSchema[] = [];

    // Extract JSON-LD
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match[1]);
        const schemaType = data['@type'] || 'Unknown';
        schemas.push({
          type: schemaType,
          format: 'json-ld',
          properties: this.extractSchemaProperties(data),
          raw: data
        });
      } catch {
        // Invalid JSON, skip
      }
    }

    // Extract Microdata
    const microdataMatches = html.matchAll(/<[^>]+itemscope[^>]*itemtype=["']([^"']+)["'][^>]*>([\s\S]*?)<\/\w+>/gi);
    for (const match of microdataMatches) {
      const typeUrl = match[1];
      const type = typeUrl.split('/').pop() || 'Unknown';
      const content = match[2];

      const properties: Record<string, unknown> = {};
      const propMatches = content.matchAll(/itemprop=["']([^"']+)["'][^>]*>([^<]*)/gi);
      for (const propMatch of propMatches) {
        properties[propMatch[1]] = propMatch[2].trim();
      }

      schemas.push({
        type,
        format: 'microdata',
        properties,
        raw: { type, content }
      });
    }

    // Extract RDFa
    const rdfaMatches = html.matchAll(/<[^>]+typeof=["']([^"']+)["'][^>]*>([\s\S]*?)<\/\w+>/gi);
    for (const match of rdfaMatches) {
      const type = match[1];
      const content = match[2];

      const properties: Record<string, unknown> = {};
      const propMatches = content.matchAll(/property=["']([^"']+)["'][^>]*>([^<]*)/gi);
      for (const propMatch of propMatches) {
        properties[propMatch[1]] = propMatch[2].trim();
      }

      schemas.push({
        type,
        format: 'rdfa',
        properties,
        raw: { type, content }
      });
    }

    return {
      schemas,
      hasSchemaOrg: schemas.length > 0,
      types: schemas.map(s => s.type)
    };
  }

  private extractSchemaProperties(data: Record<string, unknown>): Record<string, unknown> {
    const properties: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith('@')) {
        properties[key] = value;
      }
    }

    return properties;
  }

  validateSchema(schema: Record<string, unknown>): SchemaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const schemaType = schema['@type'] as string;

    // Check if type is valid
    if (!KNOWN_SCHEMA_TYPES.has(schemaType)) {
      errors.push(`Unknown schema type: ${schemaType}`);
    }

    // Check required properties
    const requiredProps = REQUIRED_PROPERTIES[schemaType] || [];
    for (const prop of requiredProps) {
      if (!(prop in schema)) {
        warnings.push(`Missing recommended property: ${prop} for ${schemaType}`);
      }
    }

    // If there are warnings about missing properties, the schema is not fully valid
    const isValid = errors.length === 0 && warnings.length === 0;

    return {
      isValid,
      errors,
      warnings
    };
  }

  recommendSchemaTypes(pageData: PageDataForSchema): string[] {
    const recommendations: string[] = [];

    if (pageData.type === 'blog-post' || pageData.url.includes('/blog/')) {
      recommendations.push('Article', 'BlogPosting');
    }

    if (pageData.type === 'product' || pageData.url.includes('/products/') || pageData.hasPrice) {
      recommendations.push('Product');
    }

    if (pageData.hasReviews) {
      recommendations.push('Review');
    }

    if (pageData.url.includes('/faq') || pageData.title.toLowerCase().includes('faq')) {
      recommendations.push('FAQPage');
    }

    if (pageData.url.includes('/how-to') || pageData.title.toLowerCase().includes('how to')) {
      recommendations.push('HowTo');
    }

    if (pageData.url.includes('/event') || pageData.title.toLowerCase().includes('event')) {
      recommendations.push('Event');
    }

    // Always recommend basic types
    if (recommendations.length === 0) {
      recommendations.push('WebPage');
    }

    return recommendations;
  }

  // Semantic HTML Analysis
  analyzeSemanticHTML(html: string): SemanticMarkup {
    const hasHeader = /<header[\s>]/i.test(html);
    const hasNav = /<nav[\s>]/i.test(html);
    const hasMain = /<main[\s>]/i.test(html);
    const hasArticle = /<article[\s>]/i.test(html);
    const hasSection = /<section[\s>]/i.test(html);
    const hasAside = /<aside[\s>]/i.test(html);
    const hasFooter = /<footer[\s>]/i.test(html);

    const suggestions: string[] = [];
    const issues: string[] = [];

    // Check for div-based patterns that should be semantic
    if (!hasHeader && /<div[^>]*id=["']header["']/i.test(html)) {
      suggestions.push('Use <header> instead of <div id="header">');
    }
    if (!hasNav && /<div[^>]*class=["'][^"']*nav[^"']*["']/i.test(html)) {
      suggestions.push('Use <nav> instead of <div class="nav">');
    }
    if (!hasMain && /<div[^>]*id=["']main["']/i.test(html)) {
      suggestions.push('Use <main> instead of <div id="main">');
    }
    if (!hasFooter && /<div[^>]*id=["']footer["']/i.test(html)) {
      suggestions.push('Use <footer> instead of <div id="footer">');
    }

    // Check for multiple main elements
    const mainCount = (html.match(/<main[\s>]/gi) || []).length;
    if (mainCount > 1) {
      issues.push('Multiple <main> elements found');
    }

    // Calculate semantic score
    const semanticElements = [hasHeader, hasNav, hasMain, hasArticle, hasSection, hasAside, hasFooter];
    const semanticCount = semanticElements.filter(Boolean).length;
    const semanticScore = Math.round((semanticCount / semanticElements.length) * 100);

    return {
      hasHeader,
      hasNav,
      hasMain,
      hasArticle,
      hasSection,
      hasAside,
      hasFooter,
      semanticScore,
      suggestions,
      issues
    };
  }

  analyzeLandmarkRoles(html: string): LandmarkRoles {
    const roles: string[] = [];

    const roleMatches = html.matchAll(/role=["']([^"']+)["']/gi);
    for (const match of roleMatches) {
      roles.push(match[1]);
    }

    return {
      hasBanner: roles.includes('banner'),
      hasNavigation: roles.includes('navigation'),
      hasMain: roles.includes('main'),
      hasComplementary: roles.includes('complementary'),
      hasContentinfo: roles.includes('contentinfo'),
      roles: [...new Set(roles)]
    };
  }

  // Entity Extraction
  extractEntities(content: string): EntityAnalysis {
    const organizations: string[] = [];
    const people: string[] = [];
    const locations: string[] = [];
    const products: string[] = [];
    const dates: string[] = [];
    const monetaryValues: string[] = [];
    const emails: string[] = [];
    const urls: string[] = [];

    // Extract known organizations
    for (const org of KNOWN_ORGANIZATIONS) {
      if (content.includes(org)) {
        organizations.push(org);
      }
    }

    // Extract known products
    for (const product of KNOWN_PRODUCTS) {
      if (content.includes(product)) {
        products.push(product);
      }
    }

    // Extract people (pattern: Title Case names, often with titles like CEO)
    const personMatches = content.matchAll(/\b(CEO|CFO|CTO|Dr\.|Mr\.|Mrs\.|Ms\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g);
    for (const match of personMatches) {
      people.push(match[2]);
    }

    // Also look for standalone names (simplified pattern)
    const nameMatches = content.matchAll(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g);
    for (const match of nameMatches) {
      const name = match[1];
      // Filter out common non-names
      if (!organizations.some(o => o.includes(name)) &&
          !products.some(p => p.includes(name)) &&
          !['The Product', 'The Device', 'The Event'].includes(name)) {
        people.push(name);
      }
    }

    // Extract locations (common patterns)
    const locationPatterns = [
      /\bin\s+([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?)\b/g,
      /\b([A-Z][a-z]+),\s+([A-Z]{2}|[A-Z][a-z]+)\b/g
    ];

    for (const pattern of locationPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const location = match[1];
        if (location !== 'Apple' && location !== 'The') {
          locations.push(location);
        }
        if (match[2]) {
          locations.push(match[2]);
        }
      }
    }

    // Extract dates
    const datePatterns = [
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g
    ];

    for (const pattern of datePatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        dates.push(match[0]);
      }
    }

    // Extract monetary values
    const moneyPatterns = [
      /\$[\d,]+(?:\.\d+)?(?:\s+(?:million|billion|trillion))?/gi,
      /€[\d,]+(?:\.\d{2})?/gi,
      /£[\d,]+(?:\.\d{2})?/gi
    ];

    for (const pattern of moneyPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        monetaryValues.push(match[0]);
      }
    }

    // Extract emails
    const emailMatches = content.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    for (const match of emailMatches) {
      emails.push(match[0]);
    }

    // Extract URLs (exclude trailing punctuation)
    const urlMatches = content.matchAll(/https?:\/\/[^\s<>"']+/g);
    for (const match of urlMatches) {
      // Remove trailing punctuation like periods and commas
      const url = match[0].replace(/[.,;:!?)\]]+$/, '');
      urls.push(url);
    }

    return {
      organizations: [...new Set(organizations)],
      people: [...new Set(people)],
      locations: [...new Set(locations)],
      products: [...new Set(products)],
      dates: [...new Set(dates)],
      monetaryValues: [...new Set(monetaryValues)],
      emails: [...new Set(emails)],
      urls: [...new Set(urls)]
    };
  }

  calculateEntityDensity(content: string): EntityDensity {
    const entities = this.extractEntities(content);
    const entityCount =
      entities.organizations.length +
      entities.people.length +
      entities.locations.length +
      entities.products.length;

    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    return {
      density: wordCount > 0 ? (entityCount / wordCount) * 100 : 0,
      entityCount,
      wordCount
    };
  }

  // Content Structure Analysis
  analyzeContentStructure(html: string): ContentStructure {
    return {
      headingHierarchy: this.analyzeHeadingHierarchy(html),
      paragraphs: this.analyzeParagraphs(html),
      lists: this.analyzeLists(html),
      tables: this.analyzeTables(html)
    };
  }

  private analyzeHeadingHierarchy(html: string): HeadingHierarchy {
    const issues: string[] = [];

    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
    const h3Count = (html.match(/<h3[\s>]/gi) || []).length;
    const h4Count = (html.match(/<h4[\s>]/gi) || []).length;
    const h5Count = (html.match(/<h5[\s>]/gi) || []).length;
    const h6Count = (html.match(/<h6[\s>]/gi) || []).length;

    let isValid = true;

    // Check for missing H1
    if (h1Count === 0) {
      issues.push('Missing H1');
      isValid = false;
    }

    // Check for multiple H1s
    if (h1Count > 1) {
      issues.push('Multiple H1 tags');
      isValid = false;
    }

    // Check for skipped heading levels
    const levels = [h1Count, h2Count, h3Count, h4Count, h5Count, h6Count];
    for (let i = 0; i < levels.length - 1; i++) {
      if (levels[i] === 0 && levels.slice(i + 1).some(c => c > 0)) {
        issues.push('Skipped heading level');
        isValid = false;
        break;
      }
    }

    return {
      isValid,
      h1Count,
      h2Count,
      h3Count,
      h4Count,
      h5Count,
      h6Count,
      issues
    };
  }

  private analyzeParagraphs(html: string): ParagraphAnalysis {
    const paragraphMatches = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    const paragraphs: string[] = [];

    for (const match of paragraphMatches) {
      const text = match[1].replace(/<[^>]+>/g, '').trim();
      if (text) {
        paragraphs.push(text);
      }
    }

    const totalWords = paragraphs.reduce((sum, p) => {
      return sum + p.split(/\s+/).filter(w => w.length > 0).length;
    }, 0);

    return {
      count: paragraphs.length,
      averageLength: paragraphs.length > 0 ? totalWords / paragraphs.length : 0,
      totalWords
    };
  }

  private analyzeLists(html: string): ListAnalysis {
    const unorderedLists = (html.match(/<ul[\s>]/gi) || []).length;
    const orderedLists = (html.match(/<ol[\s>]/gi) || []).length;
    const listItems = (html.match(/<li[\s>]/gi) || []).length;

    return {
      unordered: unorderedLists,
      ordered: orderedLists,
      totalItems: listItems
    };
  }

  private analyzeTables(html: string): TableAnalysis {
    const tableMatches = html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi);
    const tables: string[] = [];

    for (const match of tableMatches) {
      tables.push(match[1]);
    }

    let withHeaders = 0;
    let withCaptions = 0;
    const accessibilityIssues: string[] = [];

    for (const table of tables) {
      if (/<thead[\s>]/i.test(table) || /<th[\s>]/i.test(table)) {
        withHeaders++;
      } else {
        accessibilityIssues.push('Table missing header row');
      }

      if (/<caption[\s>]/i.test(table)) {
        withCaptions++;
      }
    }

    const accessibilityScore = tables.length > 0
      ? Math.round(((withHeaders + withCaptions) / (tables.length * 2)) * 100)
      : 100;

    return {
      count: tables.length,
      withHeaders,
      withCaptions,
      accessibilityScore,
      accessibilityIssues
    };
  }

  // ARIA and Accessibility Analysis
  analyzeARIA(html: string): ARIAAnalysis {
    const issues: string[] = [];
    const roles: string[] = [];

    // Count aria-labels
    const ariaLabels = (html.match(/aria-label=/gi) || []).length;

    // Extract roles
    const roleMatches = html.matchAll(/role=["']([^"']+)["']/gi);
    for (const match of roleMatches) {
      roles.push(match[1]);
    }

    // Check for aria-labelledby
    const hasAriaLabelledby = /aria-labelledby=/i.test(html);

    // Check for interactive elements without roles
    const divWithOnclick = /<div[^>]*onclick=/i.test(html);
    const spanWithButtonClass = /<span[^>]*class=["'][^"']*button[^"']*["']/i.test(html);

    if (divWithOnclick || spanWithButtonClass) {
      issues.push('Interactive element missing role attribute');
    }

    return {
      ariaLabels,
      ariaRoles: [...new Set(roles)],
      hasAriaLabelledby,
      issues
    };
  }

  analyzeFormAccessibility(html: string): FormAccessibility {
    // Find all inputs
    const inputMatches = html.matchAll(/<input[^>]*>/gi);
    let inputsWithLabels = 0;
    let inputsWithoutLabels = 0;
    let hasAriaDescribedby = false;

    // Extract input IDs
    const inputIds = new Set<string>();
    for (const match of inputMatches) {
      const idMatch = match[0].match(/id=["']([^"']+)["']/i);
      if (idMatch) {
        inputIds.add(idMatch[1]);
      }
    }

    // Extract label for attributes
    const labelForMatches = html.matchAll(/<label[^>]*for=["']([^"']+)["']/gi);
    const labelFors = new Set<string>();
    for (const match of labelForMatches) {
      labelFors.add(match[1]);
    }

    // Count inputs with/without labels
    const inputs = html.matchAll(/<input[^>]*>/gi);
    for (const inputMatch of inputs) {
      const input = inputMatch[0];
      const idMatch = input.match(/id=["']([^"']+)["']/i);

      if (idMatch && labelFors.has(idMatch[1])) {
        inputsWithLabels++;
      } else if (!/type=["']hidden["']/i.test(input) && !/type=["']submit["']/i.test(input)) {
        inputsWithoutLabels++;
      }

      if (/aria-describedby=/i.test(input)) {
        hasAriaDescribedby = true;
      }
    }

    const totalInputs = inputsWithLabels + inputsWithoutLabels;
    const accessibilityScore = totalInputs > 0
      ? Math.round((inputsWithLabels / totalInputs) * 100)
      : 100;

    return {
      inputsWithLabels,
      inputsWithoutLabels,
      hasAriaDescribedby,
      accessibilityScore
    };
  }

  analyzeImageAccessibility(html: string): ImageAccessibility {
    let imagesWithAlt = 0;
    let imagesWithoutAlt = 0;
    let decorativeImages = 0;

    const imageMatches = html.matchAll(/<img[^>]*>/gi);

    for (const match of imageMatches) {
      const img = match[0];

      if (/alt=["']["']/i.test(img) || /role=["']presentation["']/i.test(img)) {
        // Empty alt or presentation role = decorative
        decorativeImages++;
        imagesWithAlt++; // Technically has alt attribute
      } else if (/alt=/i.test(img)) {
        imagesWithAlt++;
      } else {
        imagesWithoutAlt++;
      }
    }

    return {
      imagesWithAlt,
      imagesWithoutAlt,
      decorativeImages
    };
  }

  // Topic and Keyword Analysis
  extractTopics(content: string): TopicExtraction {
    // Normalize content
    const normalized = content.toLowerCase();
    const words = normalized.split(/\s+/).filter(w => w.length > 2);

    // Count word frequencies
    const wordFreq: Record<string, number> = {};
    for (const word of words) {
      const cleaned = word.replace(/[^a-z]/g, '');
      if (cleaned.length > 2) {
        wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
      }
    }

    // Find common phrases (bigrams) - keep original cleaned words for proper phrase formation
    const cleanedWords = words.map(w => w.replace(/[^a-z]/g, ''));
    const bigrams: Record<string, number> = {};
    for (let i = 0; i < cleanedWords.length - 1; i++) {
      const w1 = cleanedWords[i];
      const w2 = cleanedWords[i + 1];
      if (w1.length > 2 && w2.length > 2) {
        const bigram = `${w1} ${w2}`;
        bigrams[bigram] = (bigrams[bigram] || 0) + 1;
      }
    }

    // Sort by frequency - include single occurrences if they're important topic indicators
    const sortedBigrams = Object.entries(bigrams)
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.config.topicExtractionDepth);

    // Include bigrams that appear at least once for key technical terms
    const mainTopics = sortedBigrams
      .filter(([phrase, count]) => {
        // Keep frequently occurring phrases, or important tech phrases
        const isImportantPhrase = phrase.includes('machine') || phrase.includes('learning') ||
          phrase.includes('artificial') || phrase.includes('intelligence') ||
          phrase.includes('deep') || phrase.includes('neural');
        return count >= 2 || (count >= 1 && isImportantPhrase);
      })
      .map(([phrase]) => phrase);

    const sortedWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.config.topicExtractionDepth);

    const secondaryTopics = sortedWords
      .filter(([word, count]) => count >= 2 && !mainTopics.some(t => t.includes(word)))
      .map(([word]) => word);

    return {
      mainTopics,
      secondaryTopics
    };
  }

  calculateKeywordDensity(content: string, keyword: string): KeywordDensityResult {
    const normalized = content.toLowerCase();
    const keywordLower = keyword.toLowerCase();

    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    const totalWords = words.length;

    // Count keyword occurrences
    let count = 0;
    let index = 0;
    while ((index = normalized.indexOf(keywordLower, index)) !== -1) {
      count++;
      index += keywordLower.length;
    }

    return {
      count,
      density: totalWords > 0 ? (count / totalWords) * 100 : 0,
      totalWords
    };
  }

  detectKeywordStuffing(content: string): KeywordStuffingResult {
    const normalized = content.toLowerCase();
    const words = normalized.split(/\s+/).filter(w => w.length > 2);

    // Count word frequencies
    const wordFreq: Record<string, number> = {};
    for (const word of words) {
      const cleaned = word.replace(/[^a-z]/g, '');
      if (cleaned.length > 2) {
        wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
      }
    }

    const totalWords = words.length;
    const stuffedKeywords: string[] = [];
    const densities: Record<string, number> = {};

    for (const [word, count] of Object.entries(wordFreq)) {
      const density = (count / totalWords) * 100;
      densities[word] = density;

      if (density > this.config.keywordDensityThreshold) {
        stuffedKeywords.push(word);
      }
    }

    return {
      isStuffed: stuffedKeywords.length > 0,
      stuffedKeywords,
      densities
    };
  }

  extractKeyPhrases(content: string): KeyPhrase[] {
    const normalized = content.toLowerCase();
    const words = normalized.split(/\s+/).filter(w => w.length > 2);

    // Extract bigrams
    const bigrams: Record<string, number> = {};
    for (let i = 0; i < words.length - 1; i++) {
      const w1 = words[i].replace(/[^a-z]/g, '');
      const w2 = words[i + 1].replace(/[^a-z]/g, '');
      if (w1.length > 2 && w2.length > 2) {
        const bigram = `${w1} ${w2}`;
        bigrams[bigram] = (bigrams[bigram] || 0) + 1;
      }
    }

    return Object.entries(bigrams)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([phrase, count]) => ({ phrase, count }));
  }

  // Semantic Scoring
  calculateSemanticScore(analysis: {
    schemaOrg?: { isValid: boolean; schemas: unknown[] };
    semanticHTML?: { score: number };
    accessibility?: { score: number };
    contentStructure?: { score: number };
  }): number {
    const weights = {
      schemaOrg: 0.3,
      semanticHTML: 0.25,
      accessibility: 0.25,
      contentStructure: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    if (analysis.schemaOrg) {
      const schemaScore = analysis.schemaOrg.isValid && analysis.schemaOrg.schemas.length > 0 ? 100 : 0;
      totalScore += schemaScore * weights.schemaOrg;
      totalWeight += weights.schemaOrg;
    }

    if (analysis.semanticHTML?.score !== undefined) {
      totalScore += analysis.semanticHTML.score * weights.semanticHTML;
      totalWeight += weights.semanticHTML;
    }

    if (analysis.accessibility?.score !== undefined) {
      totalScore += analysis.accessibility.score * weights.accessibility;
      totalWeight += weights.accessibility;
    }

    if (analysis.contentStructure?.score !== undefined) {
      totalScore += analysis.contentStructure.score * weights.contentStructure;
      totalWeight += weights.contentStructure;
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  generateRecommendations(analysis: {
    schemaOrg?: { isValid: boolean; schemas: unknown[] };
    semanticHTML?: { hasMain?: boolean; hasArticle?: boolean };
    accessibility?: { imagesWithoutAlt?: number };
  }): string[] {
    const recommendations: string[] = [];

    if (analysis.schemaOrg) {
      if (!analysis.schemaOrg.isValid || analysis.schemaOrg.schemas.length === 0) {
        recommendations.push('Add structured data schema markup to improve search visibility');
      }
    }

    if (analysis.semanticHTML) {
      if (!analysis.semanticHTML.hasMain || !analysis.semanticHTML.hasArticle) {
        recommendations.push('Use semantic HTML5 elements like <main> and <article>');
      }
    }

    if (analysis.accessibility) {
      if ((analysis.accessibility.imagesWithoutAlt || 0) > 0) {
        recommendations.push('Add alt text to all images for better accessibility');
      }
    }

    return recommendations;
  }

  // Issue Management
  createIssue(issueData: {
    type: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    recommendation?: string;
    category?: string;
  }): SemanticIssue {
    const issue: SemanticIssue = {
      id: `sem-${++this.issueIdCounter}`,
      ...issueData
    };
    return issue;
  }

  addIssue(issueData: {
    type: string;
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    recommendation?: string;
  }): void {
    const issue = this.createIssue(issueData);
    this.issues.push(issue);
  }

  getIssuesByCategory(): Record<string, SemanticIssue[]> {
    const grouped: Record<string, SemanticIssue[]> = {};

    for (const issue of this.issues) {
      const category = issue.category || 'uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(issue);
    }

    return grouped;
  }

  getAllIssues(): SemanticIssue[] {
    return [...this.issues];
  }

  clearIssues(): void {
    this.issues = [];
    this.issueIdCounter = 0;
  }
}

// Factory function
export function createSemanticAnalysisService(config?: Partial<SemanticConfig>): SemanticAnalysisService {
  return new SemanticAnalysisService(config);
}
