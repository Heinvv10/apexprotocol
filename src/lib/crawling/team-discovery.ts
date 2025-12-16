/**
 * Team/Leadership Discovery Patterns (Phase 7.0)
 *
 * Extracts team members, leadership, and key people from website HTML.
 * Used by the people discovery system in Phase 7.2.
 *
 * Patterns based on common team page structures across 100s of websites.
 */

import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";

// ============================================================================
// Types
// ============================================================================

export interface TeamMember {
  name: string;
  title?: string;
  role?: string;
  bio?: string;
  photo?: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  phone?: string;
  department?: string;
  confidence: number; // 0-1, how confident we are in this extraction
}

export interface TeamExtractionResult {
  members: TeamMember[];
  sectionFound: boolean;
  sectionType?: "team" | "leadership" | "about" | "board" | "management";
  confidence: number; // Overall confidence in the extraction
  rawSections: string[]; // CSS selectors where team content was found
}

// ============================================================================
// Selector Patterns
// ============================================================================

// Container selectors - where team sections are typically found
const TEAM_CONTAINER_SELECTORS = [
  // Explicit team sections
  ".team",
  ".our-team",
  ".the-team",
  ".team-section",
  ".team-members",
  ".team-grid",
  ".team-list",
  "#team",
  "#our-team",

  // Leadership sections
  ".leadership",
  ".leadership-team",
  ".leadership-section",
  ".executives",
  ".executive-team",
  ".management",
  ".management-team",
  "#leadership",

  // Board/advisors
  ".board",
  ".board-members",
  ".board-of-directors",
  ".advisors",
  ".advisory-board",

  // About sections often contain team
  ".about-team",
  ".about-us-team",
  ".meet-the-team",
  ".meet-our-team",

  // Generic patterns with wildcards
  '[class*="team-member"]',
  '[class*="team_member"]',
  '[class*="staff-member"]',
  '[class*="employee-card"]',
  '[class*="leadership-card"]',
  '[class*="executive-card"]',
  '[class*="person-card"]',
  '[class*="bio-card"]',

  // Data attributes
  '[data-section="team"]',
  '[data-component="team"]',
];

// Individual team member card selectors
const MEMBER_CARD_SELECTORS = [
  ".team-member",
  ".team-card",
  ".team-item",
  ".team-person",
  ".member",
  ".member-card",
  ".staff-member",
  ".staff-card",
  ".employee",
  ".employee-card",
  ".person",
  ".person-card",
  ".bio-card",
  ".profile-card",
  ".leader",
  ".leader-card",
  ".executive",
  ".executive-card",
  ".board-member",
  ".advisor",

  // Generic patterns
  '[class*="team-member"]',
  '[class*="team_member"]',
  '[class*="member-card"]',
  '[class*="person-card"]',
  '[class*="staff-card"]',
  '[class*="bio-card"]',
];

// Name selectors - where names are typically found within member cards
const NAME_SELECTORS = [
  "h2",
  "h3",
  "h4",
  "h5",
  ".name",
  ".member-name",
  ".person-name",
  ".team-member-name",
  ".title-name",
  ".full-name",
  '[class*="name"]',
  '[itemprop="name"]',
];

// Title/role selectors
const TITLE_SELECTORS = [
  ".title",
  ".role",
  ".position",
  ".job-title",
  ".member-title",
  ".member-role",
  ".person-title",
  ".person-role",
  ".designation",
  '[class*="title"]',
  '[class*="role"]',
  '[class*="position"]',
  '[itemprop="jobTitle"]',
];

// Bio/description selectors
const BIO_SELECTORS = [
  ".bio",
  ".description",
  ".member-bio",
  ".person-bio",
  ".about",
  ".summary",
  "p",
  '[class*="bio"]',
  '[class*="description"]',
  '[itemprop="description"]',
];

// Social link patterns
const LINKEDIN_PATTERNS = [
  'a[href*="linkedin.com/in/"]',
  'a[href*="linkedin.com/pub/"]',
  'a[href*="linkedin.com/profile/"]',
  ".linkedin",
  '[class*="linkedin"]',
  'a[aria-label*="LinkedIn"]',
  'a[title*="LinkedIn"]',
];

const TWITTER_PATTERNS = [
  'a[href*="twitter.com/"]',
  'a[href*="x.com/"]',
  ".twitter",
  '[class*="twitter"]',
  'a[aria-label*="Twitter"]',
  'a[aria-label*="X"]',
  'a[title*="Twitter"]',
];

// Email patterns
const EMAIL_PATTERNS = [
  'a[href^="mailto:"]',
  ".email",
  '[class*="email"]',
  '[itemprop="email"]',
];

// Photo patterns
const PHOTO_SELECTORS = [
  "img",
  ".photo",
  ".avatar",
  ".headshot",
  ".portrait",
  ".member-photo",
  ".person-photo",
  ".profile-image",
  '[class*="photo"]',
  '[class*="avatar"]',
  '[class*="headshot"]',
];

// ============================================================================
// Main Extraction Function
// ============================================================================

/**
 * Extract team members from HTML using Cheerio
 */
export function extractTeamPatterns($: CheerioAPI): TeamExtractionResult {
  const result: TeamExtractionResult = {
    members: [],
    sectionFound: false,
    confidence: 0,
    rawSections: [],
  };

  // Step 1: Find team container sections
  const containers = findTeamContainers($);
  if (containers.length === 0) {
    // Try to find individual member cards without a container
    const standaloneMembers = extractStandaloneMembers($);
    if (standaloneMembers.length > 0) {
      result.members = standaloneMembers;
      result.sectionFound = true;
      result.sectionType = "team";
      result.confidence = 0.5; // Lower confidence without explicit container
    }
    return result;
  }

  result.sectionFound = true;
  result.sectionType = detectSectionType($, containers[0].selector);
  result.rawSections = containers.map((c) => c.selector);

  // Step 2: Extract members from each container
  const allMembers: TeamMember[] = [];
  for (const container of containers) {
    const members = extractMembersFromContainer($, container.element);
    allMembers.push(...members);
  }

  // Step 3: Deduplicate and validate
  result.members = deduplicateMembers(allMembers);

  // Step 4: Calculate overall confidence
  result.confidence = calculateOverallConfidence(result.members);

  return result;
}

// ============================================================================
// Helper Functions
// ============================================================================

interface ContainerMatch {
  element: Cheerio<AnyNode>;
  selector: string;
  score: number;
}

/**
 * Find team container sections in the page
 */
function findTeamContainers($: CheerioAPI): ContainerMatch[] {
  const containers: ContainerMatch[] = [];
  const seen = new Set<string>();

  for (const selector of TEAM_CONTAINER_SELECTORS) {
    $(selector).each((_, el) => {
      const $el = $(el);
      // Create a unique identifier for this element
      const html = $el.html()?.substring(0, 100) || "";
      const id = `${selector}-${html}`;

      if (!seen.has(id)) {
        seen.add(id);
        containers.push({
          element: $el,
          selector,
          score: calculateContainerScore($el, selector),
        });
      }
    });
  }

  // Sort by score descending
  return containers.sort((a, b) => b.score - a.score);
}

/**
 * Calculate how likely this container has team members
 */
function calculateContainerScore(
  $el: Cheerio<AnyNode>,
  selector: string
): number {
  let score = 0;

  // Explicit team/leadership selector: +10
  if (
    selector.includes("team") ||
    selector.includes("leadership") ||
    selector.includes("management")
  ) {
    score += 10;
  }

  // Contains images: +5
  if ($el.find("img").length > 0) {
    score += 5;
  }

  // Contains multiple h3/h4 (names): +5
  const headings = $el.find("h3, h4, h5").length;
  if (headings >= 2) {
    score += 5;
  }

  // Contains LinkedIn links: +5
  if ($el.find('a[href*="linkedin"]').length > 0) {
    score += 5;
  }

  // Has repeating structure (grid/list): +5
  const children = $el.children();
  if (children.length >= 3) {
    // Check if children have similar structure
    const firstChildClasses = children.first().attr("class") || "";
    let sameClass = 0;
    for (let i = 0; i < children.length; i++) {
      const childClass = children.eq(i).attr("class") || "";
      if (childClass === firstChildClasses) {
        sameClass++;
      }
    }
    if (sameClass >= 3) {
      score += 5;
    }
  }

  return score;
}

/**
 * Extract members from a container element
 */
function extractMembersFromContainer(
  $: CheerioAPI,
  $container: Cheerio<AnyNode>
): TeamMember[] {
  const members: TeamMember[] = [];

  // Try to find member cards
  let $cards = $container.find(MEMBER_CARD_SELECTORS.join(", ")).first();

  // If no cards found, try direct children
  if ($cards.length === 0) {
    $cards = $container.children();
  }

  // If still too few, use the container's repeating elements
  if ($cards.length < 2) {
    $cards = $container.find("> div, > article, > li");
  }

  // Extract from each card
  const cardSelector = MEMBER_CARD_SELECTORS.join(", ");
  $container.find(cardSelector).each((_, card) => {
    const $card = $(card);
    const member = extractMemberFromCard($, $card);
    if (member && member.name) {
      members.push(member);
    }
  });

  // If no members found via card selectors, try direct children
  if (members.length === 0) {
    $container.children().each((_, child) => {
      const $child = $(child);
      const member = extractMemberFromCard($, $child);
      if (member && member.name) {
        members.push(member);
      }
    });
  }

  return members;
}

/**
 * Extract member data from a card element
 */
function extractMemberFromCard(
  $: CheerioAPI,
  $card: Cheerio<AnyNode>
): TeamMember | null {
  let confidence = 0;

  // Extract name
  let name = "";
  for (const selector of NAME_SELECTORS) {
    const found = $card.find(selector).first().text().trim();
    if (found && found.length > 1 && found.length < 100 && isLikelyName(found)) {
      name = found;
      confidence += 0.3;
      break;
    }
  }

  if (!name) return null;

  // Extract title/role
  let title = "";
  for (const selector of TITLE_SELECTORS) {
    const found = $card.find(selector).first().text().trim();
    if (found && found !== name && found.length < 200) {
      title = found;
      confidence += 0.2;
      break;
    }
  }

  // Extract bio
  let bio = "";
  for (const selector of BIO_SELECTORS) {
    const found = $card.find(selector).first().text().trim();
    if (found && found !== name && found !== title && found.length > 20) {
      bio = found.substring(0, 500); // Limit length
      confidence += 0.1;
      break;
    }
  }

  // Extract photo
  let photo = "";
  for (const selector of PHOTO_SELECTORS) {
    const $img = $card.find(selector).first();
    const src = $img.attr("src") || $img.attr("data-src");
    if (src && !src.includes("placeholder") && !src.includes("default")) {
      photo = src;
      confidence += 0.15;
      break;
    }
  }

  // Extract LinkedIn
  let linkedin = "";
  for (const selector of LINKEDIN_PATTERNS) {
    const href = $card.find(selector).first().attr("href");
    if (href && href.includes("linkedin.com")) {
      linkedin = href;
      confidence += 0.15;
      break;
    }
  }

  // Extract Twitter
  let twitter = "";
  for (const selector of TWITTER_PATTERNS) {
    const href = $card.find(selector).first().attr("href");
    if (href && (href.includes("twitter.com") || href.includes("x.com"))) {
      twitter = href;
      confidence += 0.1;
      break;
    }
  }

  // Extract email
  let email = "";
  for (const selector of EMAIL_PATTERNS) {
    const href = $card.find(selector).first().attr("href") || "";
    if (href.startsWith("mailto:")) {
      email = href.replace("mailto:", "").split("?")[0];
      confidence += 0.1;
      break;
    }
  }

  return {
    name,
    title: title || undefined,
    bio: bio || undefined,
    photo: photo || undefined,
    email: email || undefined,
    linkedin: linkedin || undefined,
    twitter: twitter || undefined,
    confidence: Math.min(confidence, 1),
  };
}

/**
 * Try to find team members without explicit container
 */
function extractStandaloneMembers($: CheerioAPI): TeamMember[] {
  const members: TeamMember[] = [];

  // Look for individual member cards anywhere in the page
  $(MEMBER_CARD_SELECTORS.join(", ")).each((_, el) => {
    const member = extractMemberFromCard($, $(el));
    if (member && member.name) {
      members.push(member);
    }
  });

  return deduplicateMembers(members);
}

/**
 * Check if a string looks like a person's name
 */
function isLikelyName(text: string): boolean {
  // Skip common non-name patterns
  const skipPatterns = [
    /^read more/i,
    /^learn more/i,
    /^view profile/i,
    /^contact us/i,
    /^email/i,
    /^phone/i,
    /^\d+$/,
    /^[A-Z]{2,5}$/, // Abbreviations
    /^(mr|mrs|ms|dr|prof)\.?$/i,
    /@/,
    /^(the|our|meet|about)/i,
  ];

  if (skipPatterns.some((pattern) => pattern.test(text))) {
    return false;
  }

  // Names typically have 2-5 words
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 6) {
    return false;
  }

  // Each word should start with capital (for Western names)
  // or be all lowercase (for some Asian names)
  const hasCapitalizedWords = words.some((word) => /^[A-Z]/.test(word));

  return hasCapitalizedWords;
}

/**
 * Remove duplicate team members
 */
function deduplicateMembers(members: TeamMember[]): TeamMember[] {
  const seen = new Map<string, TeamMember>();

  for (const member of members) {
    const key = member.name.toLowerCase().replace(/\s+/g, " ");
    const existing = seen.get(key);

    if (!existing || member.confidence > existing.confidence) {
      seen.set(key, member);
    }
  }

  return Array.from(seen.values());
}

/**
 * Calculate overall extraction confidence
 */
function calculateOverallConfidence(members: TeamMember[]): number {
  if (members.length === 0) return 0;

  const avgMemberConfidence =
    members.reduce((sum, m) => sum + m.confidence, 0) / members.length;

  // Bonus for having multiple members
  const countBonus = Math.min(members.length / 10, 0.2);

  return Math.min(avgMemberConfidence + countBonus, 1);
}

/**
 * Detect what type of team section this is
 */
function detectSectionType(
  $: CheerioAPI,
  selector: string
): TeamExtractionResult["sectionType"] {
  const selectorLower = selector.toLowerCase();

  if (selectorLower.includes("leadership") || selectorLower.includes("executive")) {
    return "leadership";
  }
  if (selectorLower.includes("board") || selectorLower.includes("advisor")) {
    return "board";
  }
  if (selectorLower.includes("management")) {
    return "management";
  }
  if (selectorLower.includes("about")) {
    return "about";
  }
  return "team";
}
