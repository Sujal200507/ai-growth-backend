import { createTool } from "@mastra/core";
import axios from "axios";
import { z } from "zod";

/**
 * SearchAPI Tool
 * Purpose: Fetch business data using SearchAPI.io
 * Supports Google Search and Google Maps engines
 */
export const searchApiTool = createTool({
  id: "search_api_tool",
  description: "Search for business information using SearchAPI.io (Google Search & Google Maps)",
  inputSchema: z.object({
    engine: z.enum(["google", "google_maps"]).describe("Search engine to use"),
    q: z.string().describe("Search query"),
    type: z.string().optional().describe("Optional search type filter"),
  }),
  outputSchema: z.any(),
  execute: async ({ context }) => {
    const { engine, q, type } = context;
    const apiKey = process.env.SEARCHAPI_KEY;

    if (!apiKey) {
      throw new Error("SEARCHAPI_KEY is not configured in environment variables");
    }

    try {
      const params: Record<string, string> = {
        api_key: apiKey,
        engine,
        q,
      };
      if (type) params.type = type;

      const response = await axios.get("https://www.searchapi.io/api/v1/search", { params });
      return response.data;
    } catch (error: any) {
      console.error(`SearchAPI error for query "${q}":`, error.message);
      return null;
    }
  },
});
