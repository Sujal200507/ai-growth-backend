import { createTool } from "@mastra/core";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

/**
 * Gemini Tool
 * Purpose: Generate AI insights and recommendations using Google Gemini
 */
export const geminiTool = createTool({
  id: "gemini_tool",
  description: "Generate AI-powered insights and recommendations using Google Gemini",
  inputSchema: z.object({
    prompt: z.string().describe("The prompt to send to Gemini"),
  }),
  outputSchema: z.object({
    text: z.string(),
  }),
  execute: async ({ context }) => {
    const { prompt } = context;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables");
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return { text };
    } catch (error: any) {
      console.error("Gemini API error:", error.message);
      return {
        text: JSON.stringify([
          "Improve your online presence by creating a professional website.",
          "Build social media presence on Instagram and Facebook.",
          "Encourage customers to leave Google reviews.",
          "Reduce dependency on OTA platforms by enabling direct bookings.",
        ]),
      };
    }
  },
});
