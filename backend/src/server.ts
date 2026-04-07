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

// Global rate limiting
app.use("/api", apiLimiter);

// Dashboard (read-only)
app.use("/api", dashboardRouter);

// Admin (owner operations)
app.use("/api/admin", adminRouter);

// Demo (x402 agent flow) — stricter rate limit
app.use("/api/demo", demoLimiter, demoRouter);

// Stripe checkout (test mode)
app.use("/api/stripe", checkoutRouter);

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
