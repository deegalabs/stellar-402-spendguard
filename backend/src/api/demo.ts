import { Router } from "express";
import { requestResource, findStellarAccept } from "../agent/x402-client.js";
import { executePayment } from "../agent/payment-handler.js";
import { config } from "../config.js";
import type { DemoStepResult, X402Challenge } from "../types.js";
import {
  x402Paywall,
  x402PricingTable,
} from "../middleware/x402-spendguard.js";

const router = Router();

const DEMO_PRICE = "1000000"; // 0.10 USDC in stroops
const DEMO_MERCHANT = config.agentPublicKey; // for demo, agent pays to a known address

router.get("/protected-resource", (req, res) => {
  const proof = req.headers["x-payment-proof"] as string | undefined;

  if (proof) {
    res.json({
      data: "Weather forecast: sunny, 25C, humidity 42%",
      paid: true,
      tx_hash: proof,
    });
    return;
  }

  const challenge: X402Challenge = {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: "stellar:testnet",
        price: DEMO_PRICE,
        payTo: DEMO_MERCHANT,
        facilitator: "https://facilitator.stellar.org",
      },
    ],
    description: "Weather data for demonstration",
  };

  res.status(402).json(challenge);
});

router.post("/run-agent", async (req, res) => {
  const targetUrl =
    (req.body.target_url as string) ||
    `http://localhost:${config.port}/api/demo/protected-resource`;

  const steps: DemoStepResult[] = [];

  try {
    // Step 1: initial request — expect 402
    const initial = await requestResource(targetUrl);
    steps.push({
      step: "request",
      status: initial.status,
      price: initial.challenge
        ? findStellarAccept(initial.challenge)?.price
        : undefined,
    });

    if (initial.status !== 402 || !initial.challenge) {
      res.json({ success: false, steps, error: "Expected 402 response" });
      return;
    }

    const accept = findStellarAccept(initial.challenge);
    if (!accept) {
      res.json({ success: false, steps, error: "No Stellar payment option found" });
      return;
    }

    // Step 2: authorize payment via contract
    const payment = await executePayment(accept);
    steps.push({
      step: "authorize",
      status: "approved",
      tx_hash: payment.tx_hash,
      settlement_time_ms: payment.settlement_time_ms,
    });

    // Step 3: retry with payment proof
    const retry = await requestResource(targetUrl, payment.tx_hash);
    steps.push({
      step: "receive",
      status: retry.status,
      data: retry.data ?? undefined,
    });

    res.json({ success: retry.status === 200, steps });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    steps.push({ step: "error", status: "failed", error: message });
    res.status(502).json({ success: false, steps, error: message });
  }
});

// --- x402 Middleware examples (demonstrates reusable middleware) ---

const demoMerchant =
  config.agentPublicKey || "GAURBKKJ56HQSPEB54ON32EWK2K7OHCG65ULNJ6CKIOXAETCQSRCUOY2";

// Example: protect an endpoint with the x402 middleware
router.get(
  "/premium-weather",
  x402Paywall({
    price: "0.10",
    merchant: demoMerchant,
    description: "Premium weather forecast with 7-day outlook",
  }),
  (_req, res) => {
    res.json({
      data: "7-day forecast: Mon 25C, Tue 23C, Wed 27C, Thu 22C, Fri 28C, Sat 24C, Sun 26C",
      source: "SpendGuard x402 Middleware",
    });
  }
);

// Pricing table: list all x402-protected resources and their prices
router.get(
  "/pricing",
  x402PricingTable([
    { path: "/api/demo/protected-resource", price: "0.10", description: "Current weather data" },
    { path: "/api/demo/premium-weather", price: "0.10", description: "7-day premium forecast" },
  ])
);

export default router;
