/**
 * Text normalization utilities for business name matching.
 * Production-level entity verification layer.
 */

const STOP_WORDS = new Set([
  // Business type words
  "hotel", "hostel", "lodge", "pg", "inn", "resort", "motel",
  "guest", "house", "guesthouse", "villa", "apartment", "apartments",
  "suite", "suites", "residency", "stay", "homestay", "boutique",
  "restaurant", "cafe", "gym", "salon", "clinic", "spa", "bar",
  "dhaba", "bhawan", "niwas", "palace", "haveli", "mahal",
  // Common English stop words
  "the", "a", "an", "and", "&", "of", "in", "at", "by", "for", "to",
  "is", "on", "with", "from", "or", "as", "it", "its",
  // Location qualifiers
  "best", "top", "near", "new", "old", "city", "town",
]);

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")       // remove punctuation
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    .join(" ")
    .trim();
}

/**
 * Check if the normalized business name appears within the given text.
 * Uses token-subset matching: all tokens of the business name must appear in the text.
 */
export function businessNameMatches(businessName: string, text: string): boolean {
  const normalizedBiz = normalizeText(businessName);
  const normalizedText = normalizeText(text);

  if (!normalizedBiz || !normalizedText) return false;

  const bizTokens = normalizedBiz.split(" ");
  
  // All business name tokens must appear in the text
  return bizTokens.every((token) => normalizedText.includes(token));
}

/**
 * Confidence-based matching scoring.
 * Returns a score 0-100 based on multiple match signals.
 */
export interface MatchSignals {
  domainMatch: boolean;      // URL contains expected domain
  titleMatch: boolean;       // Title contains business name
  snippetMatch: boolean;     // Snippet contains business name
  linkMatch: boolean;        // Link/URL contains business name tokens
}

export function calculateConfidence(signals: MatchSignals): number {
  let score = 0;
  if (signals.domainMatch) score += 40;
  if (signals.titleMatch) score += 30;
  if (signals.snippetMatch) score += 20;
  if (signals.linkMatch) score += 10;
  return score;
}

export const CONFIDENCE_THRESHOLD = 60;
