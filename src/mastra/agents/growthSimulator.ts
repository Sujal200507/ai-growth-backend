import { calculateScore } from "./scoringAgent.js";

/**
 * GrowthSimulator
 *
 * Simulates how the score would change if the business improved specific factors.
 */

export interface SimulationItem {
  action: string;
  currentValue: string;
  simulatedValue: string;
  scoreGain: number;
  newScore: number;
}

interface SimulationInput {
  presence: { website: boolean; instagram: boolean; booking: boolean; maps: boolean };
  rating: number | null;
  reviews: number | null;
  currentScore: number;
}

export function simulateImprovements(input: SimulationInput): SimulationItem[] {
  const results: SimulationItem[] = [];
  const { presence, rating, reviews, currentScore } = input;

  // Simulate adding website
  if (!presence.website) {
    const sim = calculateScore({ ...presence, website: true }, rating, reviews);
    results.push({
      action: "Create an official website",
      currentValue: "Missing",
      simulatedValue: "Active",
      scoreGain: sim.score - currentScore,
      newScore: sim.score,
    });
  }

  // Simulate adding Instagram
  if (!presence.instagram) {
    const sim = calculateScore({ ...presence, instagram: true }, rating, reviews);
    results.push({
      action: "Create Instagram profile",
      currentValue: "Missing",
      simulatedValue: "Active",
      scoreGain: sim.score - currentScore,
      newScore: sim.score,
    });
  }

  // Simulate adding Maps listing
  if (!presence.maps) {
    const sim = calculateScore({ ...presence, maps: true }, rating, reviews);
    results.push({
      action: "Add Google Maps listing",
      currentValue: "Missing",
      simulatedValue: "Listed",
      scoreGain: sim.score - currentScore,
      newScore: sim.score,
    });
  }

  // Simulate improving rating
  if (rating !== null && rating < 4.5) {
    const targetRating = Math.min(5, Math.ceil(rating * 2) / 2 + 0.5);
    const sim = calculateScore(presence, targetRating, reviews);
    if (sim.score > currentScore) {
      results.push({
        action: `Improve rating to ${targetRating.toFixed(1)}`,
        currentValue: `${rating.toFixed(1)}/5`,
        simulatedValue: `${targetRating.toFixed(1)}/5`,
        scoreGain: sim.score - currentScore,
        newScore: sim.score,
      });
    }
  }

  // Simulate getting more reviews
  if (reviews !== null) {
    const thresholds = [50, 100, 200, 500, 1000];
    const nextThreshold = thresholds.find((t) => t > reviews);
    if (nextThreshold) {
      const sim = calculateScore(presence, rating, nextThreshold);
      if (sim.score > currentScore) {
        results.push({
          action: `Reach ${nextThreshold} reviews`,
          currentValue: `${reviews} reviews`,
          simulatedValue: `${nextThreshold} reviews`,
          scoreGain: sim.score - currentScore,
          newScore: sim.score,
        });
      }
    }
  }

  // Sort by highest gain first
  results.sort((a, b) => b.scoreGain - a.scoreGain);

  return results;
}
