/**
 * People/Leadership Module (Phase 7.2)
 *
 * Provides functionality for:
 * - Discovering team members from brand websites
 * - Tracking social profiles for key people
 * - Calculating thought leadership scores
 * - People Presence Optimization (PPO) scoring
 */

// Discovery - Extract people from websites
export {
  discoverPeopleFromWebsite,
  extractPeopleFromHtml,
  convertToDbPeople,
  isLikelyTeamUrl,
  type DiscoveryOptions,
  type DiscoveredPerson,
  type DiscoveryResult,
} from "./discovery";

// Social Tracking - Track and enrich social profiles
export {
  extractHandleFromUrl,
  detectPlatformFromUrl,
  normalizeSocialUrl,
  enrichPersonSocialProfiles,
  batchEnrichSocialProfiles,
  calculateSocialReachScore,
  calculatePlatformDiversityScore,
  profilesNeedRefresh,
  type SocialProfileUpdate,
  type EnrichmentResult,
  type ProfileMetrics,
} from "./social-tracker";

// Thought Leadership - Score and analyze thought leadership
export {
  calculateActivityPoints,
  calculateThoughtLeadershipScore,
  analyzeThoughtLeadershipTrends,
  generateThoughtLeadershipRecommendations,
  createActivity,
  sortActivitiesByDate,
  filterActivitiesByType,
  type ThoughtLeadershipScore,
  type ActivityScoreWeights,
} from "./thought-leadership";
