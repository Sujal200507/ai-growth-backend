/**
 * InsightsAgent
 *
 * Generates detected issues based on presence data, rating, and dependency level.
 */

interface PresenceData {
  website: boolean;
  instagram: boolean;
  booking: boolean;
  maps: boolean;
}

export function generateInsights(
  presence: PresenceData,
  rating: number | null,
  dependencyLevel: string
): { issues: string[] } {
  const issues: string[] = [];

  if (!presence.website) {
    issues.push("❌ No official website detected");
  }

  if (!presence.instagram) {
    issues.push("❌ No Instagram presence found");
  }

  if (!presence.maps) {
    issues.push("❌ Not found on Google Maps");
  }

  if (!presence.booking) {
    issues.push("⚠ Not listed on Booking.com");
  }

  if (rating !== null && rating < 4.0) {
    issues.push(`⚠ Low Google rating (${rating}/5)`);
  }

  if (rating === null) {
    issues.push("⚠ No Google rating data available");
  }

  if (dependencyLevel === "HIGH") {
    issues.push("⚠ Heavy dependency on OTA platforms");
  }

  return { issues };
}
