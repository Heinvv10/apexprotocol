/**
 * Location Components (Phase 9.2)
 *
 * UI components for displaying brand locations and reviews
 * integrated with Google Places data.
 */

// Rating Badge
export { RatingBadge, RatingBadgeCompact } from "./rating-badge";

// Location Card
export {
  LocationCard,
  LocationCardSkeleton,
  LocationGrid,
  type LocationData,
} from "./location-card";

// Reviews Summary
export {
  ReviewsSummary,
  ReviewsSummarySkeleton,
  ReviewCard,
  SentimentBar,
  SentimentScore,
  CompactReviewsList,
  type ReviewData,
  type SentimentStats,
} from "./reviews-summary";

// Locations Section (for embedding in brand views)
export { LocationsSection, LocationsWidget } from "./locations-section";
