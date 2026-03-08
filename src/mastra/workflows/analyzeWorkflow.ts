import { collectBusinessData } from "../agents/dataCollectorAgent";
import { calculateScore } from "../agents/scoringAgent";
import { generateInsights } from "../agents/insightsAgent";
import { generateRecommendations } from "../agents/recommendationAgent";
import { generateBenchmark } from "../agents/benchmarkAgent";
import { simulateImprovements } from "../agents/growthSimulator";

/**
 * Analyze Workflow
 *
 * 1. DataCollector → 2. Scoring → 3. Insights → 4. Benchmark + Recommendations (parallel) → 5. Growth Simulator
 */
export async function runAnalysisWorkflow(name: string, city: string) {
  // Step 1: Collect business data (with confidence scoring)
  console.log(`📡 DataCollectorAgent: Searching for "${name}" in "${city}"...`);
  const { presence, confidence, rating, reviews, address, mapsWebsite } =
    await collectBusinessData(name, city);
  console.log("📡 DataCollectorAgent: Collection complete", { presence, confidence });

  // Step 2: Calculate score
  console.log("📊 ScoringAgent: Calculating growth score...");
  const { score, status, dependencyLevel } = calculateScore(presence, rating, reviews);
  console.log(`📊 ScoringAgent: Score = ${score} (${status}), Dependency = ${dependencyLevel}`);

  // Step 3: Generate insights
  console.log("🔍 InsightsAgent: Analyzing issues...");
  const { issues } = generateInsights(presence, rating, dependencyLevel);
  console.log(`🔍 InsightsAgent: Found ${issues.length} issues`);

  // Step 4: Recommendations + Benchmark in parallel
  console.log("🤖 Running RecommendationAgent + BenchmarkAgent in parallel...");
  const [suggestions, benchmark] = await Promise.all([
    generateRecommendations({
      name, city, presence, rating, reviews, score, dependencyLevel, issues,
    }),
    generateBenchmark(name, city, score, rating, reviews),
  ]);
  console.log(`🤖 RecommendationAgent: ${suggestions.length} recommendations`);
  console.log(`📈 BenchmarkAgent: Benchmark score = ${benchmark.benchmarkScore}, Performance = ${benchmark.performance}`);

  // Step 5: Growth Simulator
  console.log("🚀 GrowthSimulator: Simulating improvements...");
  const growthSimulator = simulateImprovements({ presence, rating, reviews, currentScore: score });
  console.log(`🚀 GrowthSimulator: ${growthSimulator.length} improvement scenarios`);

  return {
    presence, confidence, rating, reviews, address, mapsWebsite,
    score, status, dependencyLevel,
    issues, suggestions, benchmark, growthSimulator,
  };
}
