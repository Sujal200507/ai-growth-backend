import "dotenv/config";
import express from "express";
import cors from "cors";
import analyzeRoutes from "./routes/analyze.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", analyzeRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   AI Local Business Growth Analyzer Backend       ║
║   Running on http://localhost:${PORT}               ║
║   Mastra AI Framework Active                      ║
╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
