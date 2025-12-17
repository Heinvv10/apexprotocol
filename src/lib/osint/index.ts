/**
 * OSINT (Open Source Intelligence) Module
 * Phase 9: External data integrations for brand intelligence
 */

// Google Places Integration (Phase 9.2)
export {
  // Types
  type PlaceSearchResult,
  type PlaceDetails,
  type PlaceReview,
  type SentimentAnalysis,
  type PlaceSyncResult,
  // Functions
  isGooglePlacesConfigured,
  searchBusiness,
  findBusinessForBrand,
  getPlaceDetails,
  analyzeReviewSentiment,
  syncLocationFromPlaces,
  getBrandLocations,
  getLocationReviews,
} from "./google-places";
