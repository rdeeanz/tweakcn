/**
 * Entry point Cloudflare Workers — SIMFAS API (Hono).
 * Layer: api → application → domain ← infrastructure
 */

import { Hono } from "hono";
import type { Env } from "./domain/env";
import type { AppVariables } from "./api/middleware";
import { corsMiddleware } from "./api/middleware";
import auth from "./api/routes/auth";
import master from "./api/routes/master";
import records from "./api/routes/records";
import reports from "./api/routes/reports";
import inspections from "./api/routes/inspections";
import users from "./api/routes/users";

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// CORS global
app.use("*", corsMiddleware);

// Health check (monitoring Free Tier)
app.get("/api/health", (c) =>
  c.json({
    success: true,
    data: { service: "SIMFAS API", version: "1.0.0", ts: new Date().toISOString() },
  })
);

// Mount routes
app.route("/api/auth", auth);
app.route("/api/master", master);
app.route("/api/records", records);
app.route("/api/reports", reports);
app.route("/api/inspections", inspections);
app.route("/api/users", users);

// 404
app.notFound((c) => c.json({ success: false, error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error("SIMFAS API error:", err);
  return c.json(
    { success: false, error: err.message || "Internal server error" },
    500
  );
});

export default app;
