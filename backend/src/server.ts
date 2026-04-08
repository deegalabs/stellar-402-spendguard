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
import { Keypair } from "@stellar/stellar-sdk";

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

/**
 * Check which capabilities the server is actually wired up to do. This
 * is what makes a misconfigured Railway deploy obvious from the outside
 * instead of silently turning into "invalid encoded string" on every
 * admin call.
 */
function capabilitiesSnapshot() {
  const canSignAsOwner = isValidSecret(config.ownerSecretKey);
  const canSignAsAgent = isValidSecret(config.agentSecretKey);
  const hasContract = Boolean(config.contractAddress);
  const mode = canSignAsOwner && canSignAsAgent && hasContract
    ? "full"
    : hasContract
    ? "read-only"
    : "unconfigured";
  return {
    mode,
    contract: hasContract,
    canSignAsOwner,
    canSignAsAgent,
  };
}

function isValidSecret(secret: string): boolean {
  if (!secret) return false;
  try {
    Keypair.fromSecret(secret);
    return true;
  } catch {
    return false;
  }
}

// Health check — reports readiness so a broken deploy is obvious.
// Also exposes the public keys the backend will sign with, so you can
// detect Railway-replica env drift (same code, different env) without
// having to inspect failed txs on-chain.
app.get("/health", (_req, res) => {
  const caps = capabilitiesSnapshot();
  let ownerPubkey: string | null = null;
  let agentPubkey: string | null = null;
  try {
    if (config.ownerSecretKey) {
      ownerPubkey = Keypair.fromSecret(config.ownerSecretKey).publicKey();
    }
  } catch { /* invalid secret */ }
  try {
    if (config.agentSecretKey) {
      agentPubkey = Keypair.fromSecret(config.agentSecretKey).publicKey();
    }
  } catch { /* invalid secret */ }
  res.json({
    status: caps.mode === "unconfigured" ? "degraded" : "ok",
    network: config.stellarNetwork,
    ...caps,
    signer: {
      owner: ownerPubkey,
      agent: agentPubkey,
    },
  });
});

app.listen(config.port, "0.0.0.0", () => {
  const caps = capabilitiesSnapshot();
  console.log(`SpendGuard backend running on port ${config.port}`);
  console.log(`Network: ${config.stellarNetwork}`);
  console.log(`Contract: ${config.contractAddress || "not configured"}`);
  console.log(`Mode: ${caps.mode}`);
  if (!caps.canSignAsOwner) {
    console.warn(
      "⚠  OWNER_SECRET_KEY is missing or invalid — admin endpoints will return 503"
    );
  }
  if (!caps.canSignAsAgent) {
    console.warn(
      "⚠  AGENT_SECRET_KEY is missing or invalid — /api/demo/run-agent will return 503"
    );
  }
  console.log(`API Docs: http://localhost:${config.port}/api/docs`);
});
