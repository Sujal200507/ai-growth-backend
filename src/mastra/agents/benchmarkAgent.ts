import { searchApiTool } from "../tools/searchApiTool.js";
import { normalizeText } from "../utils/textUtils.js";

/**
 * BenchmarkAgent
 *
 * Compares a business against competitors in the same city using Google Maps data.
 */

export interface BenchmarkResult {
  avgRating: number | null;
  avgReviews: number | null;
  competitorsWithWebsite: number;
  totalCompetitors: number;
  benchmarkScore: number;
  performance: "Above Average" | "Average" | "Below Average";
}

export async function generateBenchmark(
  businessName: string,
  city: string,
  businessScore: number,
  businessRating: number | null,
  businessReviews: number | null
): Promise<BenchmarkResult> {
  // Detect business type for search query
  const lower = businessName.toLowerCase();
  let category = "businesses";
  if (/hotel|hostel|lodge|pg|inn|resort|motel|guest\s?house|homestay|villa/.test(lower)) {
    category = "hotels and hostels";
  } else if (/restaurant|cafe|bistro|diner|eatery|dhaba/.test(lower)) {
    category = "restaurants";
  } else if (/salon|spa|parlour|parlor/.test(lower)) {
    category = "salons and spas";
  } else if (/gym|fitness|yoga/.test(lower)) {
    category = "gyms and fitness centers";
  }

  try {
    const data = await searchApiTool.execute({
      context: { engine: "google_maps" as const, q: `${category} in ${city}` },
      mapiTraceId: undefined,
      runId: undefined,
    } as any);

    const localResults = data?.local_results || [];
    const normalizedBiz = normalizeText(businessName);

    // Filter out the business itself
    const competitors = localResults
      .filter((r: any) => {
        const title = normalizeText(r.title || "");
        return title !== normalizedBiz;
      })
      .slice(0, 10);

    if (competitors.length === 0) {
      return {
        avgRating: null,
        avgReviews: null,
        competitorsWithWebsite: 0,
        totalCompetitors: 0,
        benchmarkScore: businessScore,
        performance: "Average",
      };
    }

    const ratings = competitors
      .map((c: any) => c.rating)
      .filter((r: any) => typeof r === "number") as number[];
    const reviewCounts = competitors
      .map((c: any) => c.reviews)
      .filter((r: any) => typeof r === "number") as number[];
    const withWebsite = competitors.filter((c: any) => c.website).length;

    const avgRating = ratings.length > 0
      ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
      : null;
    const avgReviews = reviewCounts.length > 0
      ? Math.round(reviewCounts.reduce((a: number, b: number) => a + b, 0) / reviewCounts.length)
      : null;

    // Simple benchmark score: average competitor equivalent score
    let benchmarkScore = 50; // default
    if (avgRating !== null) {
      let rs = 0;
      if (avgRating >= 4.5) rs = 30;
      else if (avgRating >= 4.0) rs = 25;
      else if (avgRating >= 3.5) rs = 18;
      else if (avgRating >= 3.0) rs = 10;
      else rs = 5;

      let revs = 0;
      if (avgReviews !== null) {
        if (avgReviews >= 1000) revs = 20;
        else if (avgReviews >= 500) revs = 18;
        else if (avgReviews >= 200) revs = 15;
        else if (avgReviews >= 100) revs = 10;
        else if (avgReviews >= 50) revs = 6;
        else revs = 3;
      }

      const websiteRate = withWebsite / competitors.length;
      const websiteScore = Math.round(websiteRate * 25);

      benchmarkScore = Math.min(100, websiteScore + 10 + rs + revs + 8); // +10 maps, +8 avg social
    }

    let performance: "Above Average" | "Average" | "Below Average";
    if (businessScore >= benchmarkScore + 5) performance = "Above Average";
    else if (businessScore <= benchmarkScore - 5) performance = "Below Average";
    else performance = "Average";

    return {
      avgRating,
      avgReviews,
      competitorsWithWebsite: withWebsite,
      totalCompetitors: competitors.length,
      benchmarkScore,
      performance,
    };
  } catch (error) {
    console.error("Benchmark generation failed:", error);
    return {
      avgRating: null,
      avgReviews: null,
      competitorsWithWebsite: 0,
      totalCompetitors: 0,
      benchmarkScore: businessScore,
      performance: "Average",
    };
  }
}
