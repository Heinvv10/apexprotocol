/**
 * Google Places Service
 * Phase 9.2: Integration with Google Places API for location data
 *
 * Provides:
 * - Business search by name/domain
 * - Place details (rating, reviews, photos)
 * - Review sentiment analysis
 * - Location sync for brand profiles
 */

import { db } from "@/lib/db";
import {
  brandLocations,
  brandReviews,
  type NewBrandLocation,
  type NewBrandReview,
  type LocationPhoto,
  type OpeningHours,
  type LocationMetadata,
  type ReviewKeyword,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Types for Google Places API responses
export interface PlaceSearchResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  geometry: {
    lat: number;
    lng: number;
  };
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  businessStatus?: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  addressComponents?: {
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  geometry: {
    lat: number;
    lng: number;
  };
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  formattedPhoneNumber?: string;
  website?: string;
  openingHours?: OpeningHours;
  priceLevel?: number;
  photos?: LocationPhoto[];
  reviews?: PlaceReview[];
  url?: string; // Google Maps URL
}

export interface PlaceReview {
  authorName: string;
  authorPhotoUrl?: string;
  authorProfileUrl?: string;
  rating: number;
  text: string;
  time: number; // Unix timestamp
  language?: string;
}

export interface SentimentAnalysis {
  sentiment: "positive" | "neutral" | "negative" | "unrecognized";
  score: number; // -1 to 1
  keywords: ReviewKeyword[];
}

export interface PlaceSyncResult {
  locationId: string;
  reviewsAdded: number;
  updated: boolean;
  error?: string;
}

// Configuration
const GOOGLE_PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

/**
 * Get Google Places API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY environment variable is not set. " +
      "Please add it to your .env.local file."
    );
  }

  return apiKey;
}

/**
 * Check if Google Places API is configured
 */
export function isGooglePlacesConfigured(): boolean {
  return !!process.env.GOOGLE_PLACES_API_KEY;
}

/**
 * Search for a business by name and optional location
 */
export async function searchBusiness(
  businessName: string,
  options: {
    location?: { lat: number; lng: number };
    radius?: number; // meters, default 50000
  } = {}
): Promise<PlaceSearchResult[]> {
  const apiKey = getApiKey();
  const { location, radius = 50000 } = options;

  const params = new URLSearchParams({
    query: businessName,
    type: "establishment",
    key: apiKey,
  });

  if (location) {
    params.append("location", `${location.lat},${location.lng}`);
    params.append("radius", radius.toString());
  }

  const response = await fetch(
    `${GOOGLE_PLACES_API_BASE}/textsearch/json?${params}`
  );

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message || "Unknown error"}`);
  }

  return (data.results || []).map((result: Record<string, unknown>) => ({
    placeId: result.place_id as string,
    name: result.name as string,
    formattedAddress: result.formatted_address as string,
    geometry: {
      lat: (result.geometry as { location: { lat: number; lng: number } }).location.lat,
      lng: (result.geometry as { location: { lat: number; lng: number } }).location.lng,
    },
    rating: result.rating as number | undefined,
    userRatingsTotal: result.user_ratings_total as number | undefined,
    types: result.types as string[] | undefined,
    businessStatus: result.business_status as string | undefined,
  }));
}

/**
 * Find best matching business for a brand
 * Matches by name similarity and optionally verifies domain
 */
export async function findBusinessForBrand(
  brandName: string,
  brandDomain?: string
): Promise<PlaceSearchResult | null> {
  const results = await searchBusiness(brandName);

  if (results.length === 0) {
    return null;
  }

  // If no domain to verify, return first result
  if (!brandDomain) {
    return results[0];
  }

  // Try to match by getting details and checking website
  for (const result of results.slice(0, 5)) {
    const details = await getPlaceDetails(result.placeId);

    if (details.website) {
      const detailsDomain = extractDomain(details.website);
      const targetDomain = extractDomain(brandDomain);

      if (detailsDomain === targetDomain) {
        return result;
      }
    }
  }

  // Return first result if no domain match found
  return results[0];
}

/**
 * Get detailed information about a place
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const apiKey = getApiKey();

  const fields = [
    "place_id",
    "name",
    "formatted_address",
    "address_components",
    "geometry",
    "rating",
    "user_ratings_total",
    "types",
    "formatted_phone_number",
    "website",
    "opening_hours",
    "price_level",
    "photos",
    "reviews",
    "url",
  ].join(",");

  const params = new URLSearchParams({
    place_id: placeId,
    fields,
    key: apiKey,
  });

  const response = await fetch(
    `${GOOGLE_PLACES_API_BASE}/details/json?${params}`
  );

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message || "Unknown error"}`);
  }

  const result = data.result;

  // Parse address components
  const addressComponents = parseAddressComponents(result.address_components || []);

  // Parse opening hours
  const openingHours = parseOpeningHours(result.opening_hours?.weekday_text || []);

  // Parse photos
  const photos = (result.photos || []).slice(0, 10).map((photo: Record<string, unknown>) => ({
    url: getPhotoUrl(photo.photo_reference as string, apiKey),
    attribution: (photo.html_attributions as string[])?.[0] || "",
    width: photo.width as number,
    height: photo.height as number,
  }));

  // Parse reviews
  const reviews = (result.reviews || []).map((review: Record<string, unknown>) => ({
    authorName: review.author_name as string,
    authorPhotoUrl: review.profile_photo_url as string | undefined,
    authorProfileUrl: review.author_url as string | undefined,
    rating: review.rating as number,
    text: review.text as string,
    time: review.time as number,
    language: review.language as string | undefined,
  }));

  return {
    placeId: result.place_id,
    name: result.name,
    formattedAddress: result.formatted_address,
    addressComponents,
    geometry: {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
    },
    rating: result.rating,
    userRatingsTotal: result.user_ratings_total,
    types: result.types,
    formattedPhoneNumber: result.formatted_phone_number,
    website: result.website,
    openingHours,
    priceLevel: result.price_level,
    photos,
    reviews,
    url: result.url,
  };
}

/**
 * Analyze sentiment of reviews using simple keyword analysis
 * (For more accurate analysis, use Claude API)
 */
export function analyzeReviewSentiment(text: string): SentimentAnalysis {
  const positiveKeywords = [
    "excellent", "amazing", "great", "wonderful", "fantastic",
    "outstanding", "love", "best", "perfect", "awesome",
    "friendly", "helpful", "professional", "recommend", "quality",
  ];

  const negativeKeywords = [
    "terrible", "awful", "horrible", "worst", "bad",
    "poor", "disappointing", "rude", "slow", "expensive",
    "dirty", "unprofessional", "avoid", "waste", "never",
  ];

  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/);

  let positiveCount = 0;
  let negativeCount = 0;
  const foundKeywords: ReviewKeyword[] = [];

  for (const keyword of positiveKeywords) {
    const count = (textLower.match(new RegExp(keyword, "gi")) || []).length;
    if (count > 0) {
      positiveCount += count;
      foundKeywords.push({ word: keyword, count, sentiment: "positive" });
    }
  }

  for (const keyword of negativeKeywords) {
    const count = (textLower.match(new RegExp(keyword, "gi")) || []).length;
    if (count > 0) {
      negativeCount += count;
      foundKeywords.push({ word: keyword, count, sentiment: "negative" });
    }
  }

  // Calculate sentiment score (-1 to 1)
  const total = positiveCount + negativeCount;
  let score = 0;

  if (total > 0) {
    score = (positiveCount - negativeCount) / total;
  }

  // Determine sentiment category
  let sentiment: "positive" | "neutral" | "negative" | "unrecognized";
  if (score > 0.2) {
    sentiment = "positive";
  } else if (score < -0.2) {
    sentiment = "negative";
  } else {
    sentiment = "neutral";
  }

  return {
    sentiment,
    score: Math.round(score * 100) / 100,
    keywords: foundKeywords.sort((a, b) => b.count - a.count).slice(0, 10),
  };
}

/**
 * Sync a location from Google Places to the database
 */
export async function syncLocationFromPlaces(
  brandId: string,
  placeId: string,
  options: {
    locationType?: "headquarters" | "branch" | "store" | "office" | "warehouse";
    isPrimary?: boolean;
  } = {}
): Promise<PlaceSyncResult> {
  const { locationType = "headquarters", isPrimary = false } = options;

  // Get place details
  const details = await getPlaceDetails(placeId);

  // Check if location already exists
  const existingLocation = await db.query.brandLocations.findFirst({
    where: and(
      eq(brandLocations.brandId, brandId),
      eq(brandLocations.placeId, placeId)
    ),
  });

  const locationData: NewBrandLocation = {
    id: existingLocation?.id || createId(),
    brandId,
    placeId: details.placeId,
    name: details.name,
    address: details.formattedAddress,
    city: details.addressComponents?.city,
    state: details.addressComponents?.state,
    country: details.addressComponents?.country,
    postalCode: details.addressComponents?.postalCode,
    latitude: details.geometry.lat,
    longitude: details.geometry.lng,
    locationType,
    isPrimary,
    phone: details.formattedPhoneNumber,
    website: details.website,
    rating: details.rating,
    reviewCount: details.userRatingsTotal || 0,
    categories: details.types || [],
    openingHours: details.openingHours,
    photos: details.photos || [],
    priceLevel: details.priceLevel,
    isVerified: true,
    isActive: true,
    metadata: {
      googlePlaceId: details.placeId,
      googleMapsUrl: details.url,
      lastGoogleSync: new Date().toISOString(),
      verificationStatus: "verified",
    } as LocationMetadata,
    lastSyncedAt: new Date(),
  };

  // Upsert location
  if (existingLocation) {
    await db
      .update(brandLocations)
      .set({
        ...locationData,
        updatedAt: new Date(),
      })
      .where(eq(brandLocations.id, existingLocation.id));
  } else {
    await db.insert(brandLocations).values(locationData);
  }

  const locationId = locationData.id!;

  // Sync reviews
  let reviewsAdded = 0;
  if (details.reviews && details.reviews.length > 0) {
    for (const review of details.reviews) {
      // Check if review already exists (by author + time)
      const existingReview = await db.query.brandReviews.findFirst({
        where: and(
          eq(brandReviews.locationId, locationId),
          eq(brandReviews.authorName, review.authorName)
        ),
      });

      if (!existingReview) {
        const sentiment = analyzeReviewSentiment(review.text);

        const reviewData: NewBrandReview = {
          id: createId(),
          locationId,
          brandId,
          source: "google",
          externalId: `${placeId}_${review.time}`,
          authorName: review.authorName,
          authorPhotoUrl: review.authorPhotoUrl,
          authorProfileUrl: review.authorProfileUrl,
          rating: review.rating,
          text: review.text,
          language: review.language || "en",
          sentiment: sentiment.sentiment,
          sentimentScore: sentiment.score,
          keywords: sentiment.keywords,
          publishedAt: new Date(review.time * 1000),
        };

        await db.insert(brandReviews).values(reviewData);
        reviewsAdded++;
      }
    }
  }

  return {
    locationId,
    reviewsAdded,
    updated: !!existingLocation,
  };
}

/**
 * Get all locations for a brand
 */
export async function getBrandLocations(brandId: string) {
  return db.query.brandLocations.findMany({
    where: eq(brandLocations.brandId, brandId),
    with: {
      reviews: {
        orderBy: (reviews, { desc }) => [desc(reviews.publishedAt)],
        limit: 10,
      },
    },
  });
}

/**
 * Get reviews for a location
 */
export async function getLocationReviews(locationId: string) {
  return db.query.brandReviews.findMany({
    where: eq(brandReviews.locationId, locationId),
    orderBy: (reviews, { desc }) => [desc(reviews.publishedAt)],
  });
}

// Helper functions

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function parseAddressComponents(components: Array<{ long_name: string; types: string[] }>) {
  const result: {
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  } = {};

  for (const component of components) {
    if (component.types.includes("locality")) {
      result.city = component.long_name;
    } else if (component.types.includes("administrative_area_level_1")) {
      result.state = component.long_name;
    } else if (component.types.includes("country")) {
      result.country = component.long_name;
    } else if (component.types.includes("postal_code")) {
      result.postalCode = component.long_name;
    }
  }

  return result;
}

function parseOpeningHours(weekdayText: string[]): OpeningHours {
  const hours: OpeningHours = {};
  const dayMap: Record<string, keyof OpeningHours> = {
    "Monday": "monday",
    "Tuesday": "tuesday",
    "Wednesday": "wednesday",
    "Thursday": "thursday",
    "Friday": "friday",
    "Saturday": "saturday",
    "Sunday": "sunday",
  };

  for (const text of weekdayText) {
    const [day, ...timeParts] = text.split(": ");
    const dayKey = dayMap[day];
    if (dayKey) {
      hours[dayKey] = timeParts.join(": ");
    }
  }

  return hours;
}

function getPhotoUrl(photoReference: string, apiKey: string): string {
  return `${GOOGLE_PLACES_API_BASE}/photo?maxwidth=800&photo_reference=${photoReference}&key=${apiKey}`;
}
