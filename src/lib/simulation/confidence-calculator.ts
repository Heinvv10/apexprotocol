/**
 * Calculate confidence score (0-1) for a simulation result based on:
 * - Response quality: did we get a meaningful response?
 * - Citation presence: more citations = more reliable delta
 * - Score delta magnitude: very large deltas are less reliable
 */
export function calculateConfidence(params: {
  baselineScore: number;
  enrichedScore: number;
  baselineCitations: number;
  enrichedCitations: number;
  baselineResponse: string;
  enrichedResponse: string;
  status: "success" | "failed";
}): number {
  if (params.status === "failed") return 0;

  let confidence = 0;

  // Response quality (0-0.4): both responses should be substantial
  const baselineLength = params.baselineResponse.length;
  const enrichedLength = params.enrichedResponse.length;
  const minLength = Math.min(baselineLength, enrichedLength);

  if (minLength > 500) {
    confidence += 0.4;
  } else if (minLength > 200) {
    confidence += 0.3;
  } else if (minLength > 50) {
    confidence += 0.15;
  }

  // Citation presence (0-0.3): having citations in both runs means AI engaged with content
  const totalCitations = params.baselineCitations + params.enrichedCitations;
  if (totalCitations >= 4) {
    confidence += 0.3;
  } else if (totalCitations >= 2) {
    confidence += 0.2;
  } else if (totalCitations >= 1) {
    confidence += 0.1;
  }

  // Score delta plausibility (0-0.3): moderate deltas are more believable
  const delta = Math.abs(params.enrichedScore - params.baselineScore);
  if (delta <= 30) {
    confidence += 0.3; // Moderate delta - very plausible
  } else if (delta <= 50) {
    confidence += 0.2; // Large delta - somewhat plausible
  } else {
    confidence += 0.1; // Extreme delta - less reliable
  }

  return Math.min(confidence, 1);
}
