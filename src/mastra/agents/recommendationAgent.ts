import { geminiTool } from "../tools/geminiTool";

/**
 * RecommendationAgent
 *
 * Uses geminiTool to generate AI-powered business growth recommendations.
 * Takes presence data, score, and issues as input.
 */

interface RecommendationInput {
  name: string;
  city: string;
  presence: {
    website: boolean;
    instagram: boolean;
    booking: boolean;
    maps: boolean;
  };
  rating: number | null;
  reviews: number | null;
  score: number;
  dependencyLevel: string;
  issues: string[];
}

export async function generateRecommendations(
  input: RecommendationInput
): Promise<string[]> {
  const prompt = `You are a local business growth consultant. Analyze this business and provide 4-6 actionable recommendations.

Business: ${input.name} in ${input.city}
Platform Presence:
- Website: ${input.presence.website ? "✅ Found" : "❌ Missing"}
- Instagram: ${input.presence.instagram ? "✅ Found" : "❌ Missing"}
- Booking.com: ${input.presence.booking ? "✅ Found" : "❌ Missing"}
- Google Maps: ${input.presence.maps ? "✅ Found" : "❌ Missing"}

Google Rating: ${input.rating ?? "N/A"}/5 (${input.reviews ?? 0} reviews)
Growth Score: ${input.score}/100
OTA Dependency Level: ${input.dependencyLevel}

Detected Issues:
${input.issues.map((i) => `- ${i}`).join("\n")}

Generate actionable business growth suggestions based on the missing platforms, low score, and detected issues.
Return ONLY a JSON array of strings, each being one specific recommendation. No markdown, no explanation.`;

  try {
    const result = await geminiTool.execute({
      context: { prompt },
      mapiTraceId: undefined,
      runId: undefined,
    } as any);

    const text = result.text;

    try {
      const parsed = JSON.parse(
        text.replace(/```json\n?/g, "").replace(/```/g, "").trim()
      );
      return Array.isArray(parsed) ? parsed : [text];
    } catch {
      // Fallback: split by newlines and clean up
      return text
        .split("\n")
        .map((line: string) => line.replace(/^[-•*]\s*/, "").trim())
        .filter((line: string) => line.length > 0);
    }
  } catch (error) {
    console.error("Recommendation generation failed:", error);
    return [
      "Create an official website to establish direct online presence.",
      "Build Instagram presence to attract younger demographics.",
      "Encourage satisfied customers to leave Google reviews.",
      "Reduce OTA dependency by enabling direct bookings.",
    ];
  }
}
