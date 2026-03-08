/**
 * ScoringAgent
 *
 * Calculates growth score (0-100) based on weighted business metrics.
 *
 * Scoring Breakdown (max 100):
 *   Website    → +25
 *   Instagram  → +15
 *   Maps       → +10
 *   Rating     → up to +30
 *   Reviews    → up to +20
 *   OTA Penalty → -10 (booking without website)
 *
 * Dependency Logic:
 *   HIGH   → Booking present AND Website missing
 *   MEDIUM → Both Booking and Website exist
 *   LOW    → Website exists AND Booking missing
 */

interface PresenceData {
  website: boolean;
  instagram: boolean;
  booking: boolean;
  maps: boolean;
}

interface ScoringResult {
  score: number;
  status: string;
  dependencyLevel: "HIGH" | "MEDIUM" | "LOW";
}

export function calculateScore(
  presence: PresenceData,
  rating: number | null,
  reviews: number | null
): ScoringResult {
  let score = 0;

  // Website presence (max 25)
  if (presence.website) score += 25;

  // Social media presence (max 15)
  if (presence.instagram) score += 15;

  // Google Maps presence (max 10)
  if (presence.maps) score += 10;

  // Google Rating score (max 30)
  if (rating !== null) {
    if (rating >= 4.5) score += 30;
    else if (rating >= 4.0) score += 25;
    else if (rating >= 3.5) score += 18;
    else if (rating >= 3.0) score += 10;
    else score += 5;
  }

  // Review count score (max 20)
  if (reviews !== null && reviews > 0) {
    if (reviews >= 1000) score += 20;
    else if (reviews >= 500) score += 18;
    else if (reviews >= 200) score += 15;
    else if (reviews >= 100) score += 10;
    else if (reviews >= 50) score += 6;
    else score += 3;
  }

  // OTA dependency penalty
  if (presence.booking && !presence.website) {
    score -= 10;
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  // Dependency level
  let dependencyLevel: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (presence.booking && !presence.website) {
    dependencyLevel = "HIGH";
  } else if (presence.booking && presence.website) {
    dependencyLevel = "MEDIUM";
  }

  // Status label
  let status: string;
  if (score >= 80) status = "Excellent";
  else if (score >= 60) status = "Good";
  else if (score >= 40) status = "Average";
  else if (score >= 20) status = "Weak";
  else status = "Critical";

  return { score, status, dependencyLevel };
}
