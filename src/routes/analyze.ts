import { Router } from "express";
import { analyzeController } from "../controllers/analyzeController.js";

const router = Router();

/**
 * POST /api/analyze
 *
 * Analyze a local business's digital presence.
 *
 * Request body:
 *   { name: string, city: string }
 *
 * Response:
 *   { business, presence, rating, score, dependencyLevel, issues, suggestions }
 */
router.post("/analyze", analyzeController);

export default router;
