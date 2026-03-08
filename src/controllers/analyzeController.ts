import { Request, Response } from "express";
import { runAnalysisWorkflow } from "../mastra";

export async function analyzeController(req: Request, res: Response) {
  try {
    const { name, city } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Business name is required" });
    }
    if (!city || typeof city !== "string" || city.trim().length === 0) {
      return res.status(400).json({ error: "City is required" });
    }
    if (name.length > 200 || city.length > 100) {
      return res.status(400).json({ error: "Input too long" });
    }

    const sanitizedName = name.trim();
    const sanitizedCity = city.trim();

    console.log(`\n${"═".repeat(50)}`);
    console.log(`🚀 Starting analysis for: ${sanitizedName} in ${sanitizedCity}`);
    console.log(`${"═".repeat(50)}\n`);

    const result = await runAnalysisWorkflow(sanitizedName, sanitizedCity);

    const response = {
      business: { name: sanitizedName, city: sanitizedCity },
      presence: result.presence,
      confidence: result.confidence,
      rating: { value: result.rating, reviews: result.reviews },
      score: result.score,
      scoreStatus: result.status,
      dependencyLevel: result.dependencyLevel,
      issues: result.issues,
      suggestions: result.suggestions,
      benchmark: result.benchmark,
      growthSimulator: result.growthSimulator,
    };

    console.log(`\n${"═".repeat(50)}`);
    console.log(`✅ Analysis complete! Score: ${response.score}/100`);
    console.log(`${"═".repeat(50)}\n`);

    return res.json(response);
  } catch (error: any) {
    console.error("Analysis error:", error);
    return res.status(500).json({
      error: "Analysis failed",
      message: error.message || "Unknown error",
    });
  }
}
