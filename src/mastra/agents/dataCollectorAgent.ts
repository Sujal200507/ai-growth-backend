import { searchApiTool } from "../tools/searchApiTool";
import {
  businessNameMatches,
  normalizeText,
  calculateConfidence,
  CONFIDENCE_THRESHOLD,
  type MatchSignals,
} from "../utils/textUtils";

/**
 * DataCollectorAgent — Production-Level Architecture
 *
 * Pipeline:
 *   Input → Query Builder → SearchAPI (parallel) → Entity Verification
 *   → Platform Detection (confidence-scored) → Structured Business Data
 *
 * Key features:
 *   1. Maps-first website detection (uses Google Maps website field as primary source)
 *   2. Confidence scoring per platform (threshold ≥ 60 to count as FOUND)
 *   3. Expanded excluded-domain list to prevent false positives
 *   4. Token-subset entity verification
 */

// ── Excluded domains for website detection ──────────────────────────────
const EXCLUDED_DOMAINS = [
  // OTA platforms
  "booking.com", "tripadvisor", "expedia", "agoda",
  "hotels.com", "makemytrip", "goibibo", "yatra.com",
  "trivago", "oyorooms", "oyo.com", "hostelworld",
  "airbnb", "vrbo", "kayak", "priceline",
  "cleartrip", "ixigo", "happyeasygo", "easemytrip",
  // Directories & listing sites
  "justdial", "sulekha", "indiamart", "yellowpages",
  "yelp", "foursquare", "hotfrog", "brownbook",
  "mouthshut", "glassdoor", "ambitionbox",
  // Aggregator / meta-search hotel sites
  "hotelsurabhi", "treebo", "fabhotels", "zostel",
  "gostays", "holidayiq", "travelguru",
  // Social media
  "instagram.com", "facebook.com", "twitter.com",
  "linkedin.com", "youtube.com", "pinterest.com",
  "x.com", "threads.net",
  // Maps & reviews
  "google.com/maps", "maps.google", "google.co.in/maps",
  // Wikipedia & info
  "wikipedia.org", "wikidata.org",
  // Others
  "quora.com", "reddit.com", "medium.com",
];

const isExcludedDomain = (link: string): boolean =>
  EXCLUDED_DOMAINS.some((d) => link.includes(d.toLowerCase()));

// Check if business name tokens appear in a URL slug
function linkContainsName(name: string, link: string): boolean {
  const tokens = normalizeText(name).split(" ");
  const slug = link.toLowerCase().replace(/[^\w]/g, " ");
  return tokens.length > 0 && tokens.every((t) => slug.includes(t));
}

// ── Main collector function ─────────────────────────────────────────────
export interface CollectorResult {
  presence: { website: boolean; instagram: boolean; booking: boolean; maps: boolean };
  confidence: { website: number; instagram: number; booking: number; maps: number };
  rating: number | null;
  reviews: number | null;
  address: string | null;
  mapsWebsite: string | null;
}

export async function collectBusinessData(
  name: string,
  city: string
): Promise<CollectorResult> {
  // ── 1. Query Builder ──────────────────────────────────────────────────
  const queries = [
    { key: "maps",      engine: "google_maps" as const, q: `${name} ${city}` },
    { key: "website",   engine: "google" as const,      q: `${name} ${city} official website` },
    { key: "instagram", engine: "google" as const,      q: `${name} ${city} instagram` },
    { key: "booking",   engine: "google" as const,      q: `${name} ${city} booking.com` },
  ];

  // ── 2. Parallel SearchAPI calls ───────────────────────────────────────
  const results = await Promise.all(
    queries.map(async (query) => {
      try {
        const data = await searchApiTool.execute({
          context: { engine: query.engine, q: query.q },
          mapiTraceId: undefined,
          runId: undefined,
        } as any);
        return { key: query.key, data };
      } catch (error) {
        console.error(`Search failed for ${query.key}:`, error);
        return { key: query.key, data: null };
      }
    })
  );

  // ── 3. Initialize output ──────────────────────────────────────────────
  const presence = { website: false, instagram: false, booking: false, maps: false };
  const confidence = { website: 0, instagram: 0, booking: 0, maps: 0 };
  let rating: number | null = null;
  let reviews: number | null = null;
  let address: string | null = null;
  let mapsWebsite: string | null = null;

  // ── 4. Process results per platform ───────────────────────────────────
  for (const result of results) {
    if (!result.data) continue;

    switch (result.key) {
      // ── Google Maps (primary data source) ─────────────────────────────
      case "maps": {
        const localResults = result.data.local_results || [];
        for (const local of localResults) {
          const title = local.title || "";
          if (businessNameMatches(name, title)) {
            const signals: MatchSignals = {
              domainMatch: true,    // it's a Maps result
              titleMatch: true,     // we just matched
              snippetMatch: !!(local.description && businessNameMatches(name, local.description)),
              linkMatch: false,
            };
            const score = calculateConfidence(signals);
            confidence.maps = score;
            if (score >= CONFIDENCE_THRESHOLD) {
              presence.maps = true;
              rating = local.rating ?? null;
              reviews = local.reviews ?? null;
              address = local.address ?? null;
              // PRIMARY website detection: Maps website field
              if (local.website) {
                mapsWebsite = local.website;
              }
            }
            break;
          }
        }
        break;
      }

      // ── Website detection ─────────────────────────────────────────────
      case "website": {
        // If Maps already gave us a verified website, use it directly
        if (mapsWebsite) {
          presence.website = true;
          confidence.website = 90; // Maps-sourced = high confidence
          break;
        }

        // Fallback: scan Google organic results
        const organicResults = result.data.organic_results || [];
        for (const res of organicResults.slice(0, 5)) {
          const link = (res.link || "").toLowerCase();

          // Skip excluded domains
          if (isExcludedDomain(link)) continue;

          const titleText = res.title || "";
          const snippetText = res.snippet || "";
          const combinedText = `${titleText} ${snippetText}`;

          const titleMatch = businessNameMatches(name, combinedText);
          const urlMatch = linkContainsName(name, link);

          const signals: MatchSignals = {
            domainMatch: !isExcludedDomain(link),
            titleMatch,
            snippetMatch: businessNameMatches(name, snippetText),
            linkMatch: urlMatch,
          };
          const score = calculateConfidence(signals);

          if (score > confidence.website) {
            confidence.website = score;
          }

          if (score >= CONFIDENCE_THRESHOLD && titleMatch) {
            presence.website = true;
            break;
          }
        }
        break;
      }

      // ── Instagram detection ───────────────────────────────────────────
      case "instagram": {
        const organicResults = result.data.organic_results || [];
        for (const res of organicResults) {
          const link = (res.link || "").toLowerCase();
          if (!link.includes("instagram.com")) continue;

          const titleText = res.title || "";
          const snippetText = res.snippet || "";
          const combinedText = `${titleText} ${snippetText}`;

          const signals: MatchSignals = {
            domainMatch: true,
            titleMatch: businessNameMatches(name, combinedText),
            snippetMatch: businessNameMatches(name, snippetText),
            linkMatch: linkContainsName(name, link),
          };
          const score = calculateConfidence(signals);

          if (score > confidence.instagram) {
            confidence.instagram = score;
          }

          if (score >= CONFIDENCE_THRESHOLD) {
            presence.instagram = true;
            break;
          }
        }
        break;
      }

      // ── Booking.com detection ─────────────────────────────────────────
      case "booking": {
        const organicResults = result.data.organic_results || [];
        for (const res of organicResults) {
          const link = (res.link || "").toLowerCase();
          if (!link.includes("booking.com")) continue;

          const titleText = res.title || "";
          const snippetText = res.snippet || "";
          const combinedText = `${titleText} ${snippetText}`;

          const signals: MatchSignals = {
            domainMatch: true,
            titleMatch: businessNameMatches(name, combinedText),
            snippetMatch: businessNameMatches(name, snippetText),
            linkMatch: linkContainsName(name, link),
          };
          const score = calculateConfidence(signals);

          if (score > confidence.booking) {
            confidence.booking = score;
          }

          if (score >= CONFIDENCE_THRESHOLD) {
            presence.booking = true;
            break;
          }
        }
        break;
      }
    }
  }

  console.log("🔍 Confidence scores:", confidence);

  return { presence, confidence, rating, reviews, address, mapsWebsite };
}
