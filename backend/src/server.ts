import express from "express";
import cors from "cors";
import { config } from "./config.js";
import dashboardRouter from "./api/dashboard.js";
import adminRouter from "./api/admin.js";
import demoRouter from "./api/demo.js";
import webhookRouter from "./stripe/webhook.js";
import checkoutRouter from "./stripe/checkout.js";
import { createEventStreamHandler } from "./stellar/event-stream.js";

const app = express();

app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());

// Dashboard (read-only)
app.use("/api", dashboardRouter);

// Admin (owner operations)
app.use("/api/admin", adminRouter);

// Demo (x402 agent flow)
app.use("/api/demo", demoRouter);

// Stripe checkout (test mode)
app.use("/api/stripe", checkoutRouter);

// Stripe webhooks
app.use("/webhooks", webhookRouter);

// SSE event stream (real-time contract events)
app.get("/api/events", createEventStreamHandler() as express.RequestHandler);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", network: config.stellarNetwork });
});

app.listen(config.port, () => {
  console.log(`SpendGuard backend running on port ${config.port}`);
  console.log(`Network: ${config.stellarNetwork}`);
  console.log(`Contract: ${config.contractAddress || "not configured"}`);
});
