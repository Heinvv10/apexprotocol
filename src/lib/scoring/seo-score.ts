/**
 * SEO Score Calculator
 * Calculates traditional SEO metrics for the unified score
 */

export interface SEOScoreInput {
  // Technical SEO
  hasSSL: boolean;
  mobileOptimized: boolean;
  pageSpeedScore: number; // 0-100
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  hasCanonicalTags: boolean;

  // On-Page SEO
  hasMetaDescription: boolean;
  hasTitleTag: boolean;
  hasH1Tag: boolean;
  hasStructuredData: boolean;
  imageAltCoverage: number; // 0-100 percentage

  // Content Quality
  averageContentLength: number; // words
  keywordDensity: number; // percentage
  internalLinks: number;
  externalLinks: number;

  // Authority
  domainAge: number; // months
  backlinks: number;
  referringDomains: number;

  // Core Web Vitals (optional)
  lcp?: number; // Largest Contentful Paint (ms)
  fid?: number; // First Input Delay (ms)
  cls?: number; // Cumulative Layout Shift
}

export interface SEOScoreResult {
  score: number;
  breakdown: {
    technical: number;
    onPage: number;
    content: number;
    authority: number;
  };
  recommendations: string[];
  issues: SEOIssue[];
}

export interface SEOIssue {
  type: "critical" | "warning" | "info";
  category: "technical" | "onPage" | "content" | "authority";
  message: string;
  impact: number; // 1-10
}

/**
 * Calculate Technical SEO Score
 */
function calculateTechnicalScore(input: SEOScoreInput): { score: number; issues: SEOIssue[] } {
  let score = 0;
  const issues: SEOIssue[] = [];

  // SSL (25 points)
  if (input.hasSSL) {
    score += 25;
  } else {
    issues.push({
      type: "critical",
      category: "technical",
      message: "Missing SSL certificate - site not secure",
      impact: 10,
    });
  }

  // Mobile Optimization (25 points)
  if (input.mobileOptimized) {
    score += 25;
  } else {
    issues.push({
      type: "critical",
      category: "technical",
      message: "Site not optimized for mobile devices",
      impact: 9,
    });
  }

  // Page Speed (20 points)
  const speedScore = Math.round((input.pageSpeedScore / 100) * 20);
  score += speedScore;
  if (input.pageSpeedScore < 50) {
    issues.push({
      type: "warning",
      category: "technical",
      message: `Page speed score is low (${input.pageSpeedScore}/100)`,
      impact: 7,
    });
  }

  // Robots.txt (10 points)
  if (input.hasRobotsTxt) {
    score += 10;
  } else {
    issues.push({
      type: "warning",
      category: "technical",
      message: "Missing robots.txt file",
      impact: 4,
    });
  }

  // Sitemap (10 points)
  if (input.hasSitemap) {
    score += 10;
  } else {
    issues.push({
      type: "warning",
      category: "technical",
      message: "Missing XML sitemap",
      impact: 5,
    });
  }

  // Canonical Tags (10 points)
  if (input.hasCanonicalTags) {
    score += 10;
  } else {
    issues.push({
      type: "info",
      category: "technical",
      message: "Missing canonical tags - may cause duplicate content issues",
      impact: 3,
    });
  }

  return { score: Math.min(100, score), issues };
}

/**
 * Calculate On-Page SEO Score
 */
function calculateOnPageScore(input: SEOScoreInput): { score: number; issues: SEOIssue[] } {
  let score = 0;
  const issues: SEOIssue[] = [];

  // Meta Description (20 points)
  if (input.hasMetaDescription) {
    score += 20;
  } else {
    issues.push({
      type: "critical",
      category: "onPage",
      message: "Missing meta description",
      impact: 8,
    });
  }

  // Title Tag (25 points)
  if (input.hasTitleTag) {
    score += 25;
  } else {
    issues.push({
      type: "critical",
      category: "onPage",
      message: "Missing title tag",
      impact: 9,
    });
  }

  // H1 Tag (20 points)
  if (input.hasH1Tag) {
    score += 20;
  } else {
    issues.push({
      type: "warning",
      category: "onPage",
      message: "Missing H1 heading tag",
      impact: 6,
    });
  }

  // Structured Data (20 points)
  if (input.hasStructuredData) {
    score += 20;
  } else {
    issues.push({
      type: "warning",
      category: "onPage",
      message: "No structured data (schema markup) found",
      impact: 7,
    });
  }

  // Image Alt Coverage (15 points)
  const altScore = Math.round((input.imageAltCoverage / 100) * 15);
  score += altScore;
  if (input.imageAltCoverage < 80) {
    issues.push({
      type: "info",
      category: "onPage",
      message: `Only ${input.imageAltCoverage}% of images have alt text`,
      impact: 4,
    });
  }

  return { score: Math.min(100, score), issues };
}

/**
 * Calculate Content Quality Score
 */
function calculateContentScore(input: SEOScoreInput): { score: number; issues: SEOIssue[] } {
  let score = 0;
  const issues: SEOIssue[] = [];

  // Content Length (40 points)
  // Ideal: 1500-2500 words
  if (input.averageContentLength >= 1500) {
    score += 40;
  } else if (input.averageContentLength >= 1000) {
    score += 30;
  } else if (input.averageContentLength >= 500) {
    score += 20;
    issues.push({
      type: "warning",
      category: "content",
      message: "Content length below optimal (aim for 1500+ words for pillar content)",
      impact: 5,
    });
  } else {
    score += 10;
    issues.push({
      type: "critical",
      category: "content",
      message: "Content is too thin - significantly below recommended length",
      impact: 8,
    });
  }

  // Keyword Density (20 points)
  // Ideal: 1-2%
  if (input.keywordDensity >= 1 && input.keywordDensity <= 2) {
    score += 20;
  } else if (input.keywordDensity > 0 && input.keywordDensity < 3) {
    score += 15;
  } else if (input.keywordDensity >= 3) {
    score += 5;
    issues.push({
      type: "warning",
      category: "content",
      message: "Keyword density may be too high - risk of keyword stuffing",
      impact: 6,
    });
  } else {
    score += 5;
    issues.push({
      type: "info",
      category: "content",
      message: "Low keyword density - consider optimizing for target keywords",
      impact: 4,
    });
  }

  // Internal Links (20 points)
  if (input.internalLinks >= 5) {
    score += 20;
  } else if (input.internalLinks >= 2) {
    score += 15;
    issues.push({
      type: "info",
      category: "content",
      message: "Add more internal links to improve site structure",
      impact: 3,
    });
  } else {
    score += 5;
    issues.push({
      type: "warning",
      category: "content",
      message: "Very few internal links - hurts site navigation and SEO",
      impact: 5,
    });
  }

  // External Links (20 points)
  if (input.externalLinks >= 2) {
    score += 20;
  } else if (input.externalLinks >= 1) {
    score += 15;
  } else {
    score += 10;
    issues.push({
      type: "info",
      category: "content",
      message: "Consider linking to authoritative external sources",
      impact: 2,
    });
  }

  return { score: Math.min(100, score), issues };
}

/**
 * Calculate Authority Score
 */
function calculateAuthorityScore(input: SEOScoreInput): { score: number; issues: SEOIssue[] } {
  let score = 0;
  const issues: SEOIssue[] = [];

  // Domain Age (25 points)
  // Logarithmic scale, max at 60 months (5 years)
  const ageScore = Math.min(25, Math.round(Math.log10(input.domainAge + 1) * 14));
  score += ageScore;
  if (input.domainAge < 6) {
    issues.push({
      type: "info",
      category: "authority",
      message: "New domain - authority will build over time",
      impact: 3,
    });
  }

  // Backlinks (40 points)
  // Logarithmic scale
  const backlinkScore = Math.min(40, Math.round(Math.log10(input.backlinks + 1) * 15));
  score += backlinkScore;
  if (input.backlinks < 50) {
    issues.push({
      type: "warning",
      category: "authority",
      message: "Low backlink count - focus on link building",
      impact: 7,
    });
  }

  // Referring Domains (35 points)
  // More important than raw backlink count
  const domainScore = Math.min(35, Math.round(Math.log10(input.referringDomains + 1) * 17));
  score += domainScore;
  if (input.referringDomains < 20) {
    issues.push({
      type: "warning",
      category: "authority",
      message: "Limited referring domains - diversify backlink sources",
      impact: 6,
    });
  }

  return { score: Math.min(100, score), issues };
}

/**
 * Calculate Complete SEO Score
 */
export function calculateSEOScore(input: SEOScoreInput): SEOScoreResult {
  const technical = calculateTechnicalScore(input);
  const onPage = calculateOnPageScore(input);
  const content = calculateContentScore(input);
  const authority = calculateAuthorityScore(input);

  // Weighted average
  const overallScore = Math.round(
    technical.score * 0.25 +
    onPage.score * 0.25 +
    content.score * 0.25 +
    authority.score * 0.25
  );

  // Combine all issues
  const allIssues = [
    ...technical.issues,
    ...onPage.issues,
    ...content.issues,
    ...authority.issues,
  ].sort((a, b) => b.impact - a.impact);

  // Generate recommendations from top issues
  const recommendations = allIssues
    .slice(0, 5)
    .map((issue) => issue.message);

  return {
    score: overallScore,
    breakdown: {
      technical: technical.score,
      onPage: onPage.score,
      content: content.score,
      authority: authority.score,
    },
    recommendations,
    issues: allIssues,
  };
}

/**
 * Create default SEO input for a new/unknown site
 */
export function createDefaultSEOInput(): SEOScoreInput {
  return {
    hasSSL: true,
    mobileOptimized: true,
    pageSpeedScore: 70,
    hasRobotsTxt: true,
    hasSitemap: true,
    hasCanonicalTags: false,
    hasMetaDescription: true,
    hasTitleTag: true,
    hasH1Tag: true,
    hasStructuredData: false,
    imageAltCoverage: 60,
    averageContentLength: 800,
    keywordDensity: 1.5,
    internalLinks: 3,
    externalLinks: 1,
    domainAge: 12,
    backlinks: 50,
    referringDomains: 15,
  };
}
