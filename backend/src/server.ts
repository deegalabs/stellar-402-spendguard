import express from "express";
import cors from "cors";
import { config } from "./config.js";
import dashboardRouter from "./api/dashboard.js";
import adminRouter from "./api/admin.js";
import demoRouter from "./api/demo.js";
import webhookRouter from "./stripe/webhook.js";
import checkoutRouter from "./stripe/checkout.js";
import { createEventStreamHandler } from "./stellar/event-stream.js";
import { setupSwagger } from "./swagger.js";
import { apiLimiter, demoLimiter } from "./middleware/rate-limit.js";

const app = express();

app.use(
  cors({
    origin: config.frontendUrl
      ? config.frontendUrl.split(",").map((u) => u.trim())
      : "*",
  })
);
app.use(express.json());

// Rate limiting — tiered buckets per route class.
// Dashboard reads are high-volume (polling widgets across many tabs), so
// they go through a permissive bucket. Admin / demo / general mutations
// share tighter buckets so abuse of those surfaces doesn't drain the
// read quota.

// Dashboard (read-only) — permissive bucket is applied inside the router
app.use("/api", dashboardRouter);

// Admin (owner operations) — limiter applied inside the router
app.use("/api/admin", adminRouter);

// Demo (x402 agent flow) — stricter rate limit
app.use("/api/demo", demoLimiter, demoRouter);

// Stripe checkout (test mode) — general API bucket
app.use("/api/stripe", apiLimiter, checkoutRouter);

// Stripe webhooks
app.use("/webhooks", webhookRouter);

// SSE event stream (real-time contract events)
app.get("/api/events", createEventStreamHandler() as express.RequestHandler);

// Swagger / OpenAPI docs
setupSwagger(app);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", network: config.stellarNetwork });
});

app.listen(config.port, "0.0.0.0", () => {
  console.log(`SpendGuard backend running on port ${config.port}`);
  console.log(`Network: ${config.stellarNetwork}`);
  console.log(`Contract: ${config.contractAddress || "not configured"}`);
  console.log(`API Docs: http://localhost:${config.port}/api/docs`);
});
