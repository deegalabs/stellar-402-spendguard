import { Router } from "express";
import { config } from "../config.js";

const router = Router();

/**
 * Stripe Checkout session creation (Test Mode).
 *
 * In production this would use the Stripe SDK to create a real
 * Checkout Session. For the hackathon demo we simulate the flow
 * and return a mock session that the frontend can redirect to.
 */
router.post("/create-session", async (req, res) => {
  try {
    const { amount_usd } = req.body;

    if (!amount_usd || amount_usd <= 0 || amount_usd > 10000) {
      res.status(400).json({ error: "Invalid amount (1-10000 USD)", code: "INVALID_AMOUNT" });
      return;
    }

    const amountCents = Math.round(amount_usd * 100);
    const stroops = BigInt(amountCents) * BigInt(100_000);

    // In test mode we generate a mock session ID
    // In production this would call stripe.checkout.sessions.create()
    const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    res.json({
      session_id: sessionId,
      url: `https://checkout.stripe.com/pay/${sessionId}`,
      amount_usd,
      amount_cents: amountCents,
      amount_stroops: stroops.toString(),
      mode: "test",
      note: "(Test Mode) — no real charge will occur",
    });
  } catch (err) {
    console.error("Checkout session error:", err);
    res.status(502).json({ error: "Failed to create checkout session", code: "STRIPE_ERROR" });
  }
});

/**
 * Simulates a successful Stripe payment for demo purposes.
 * In production the webhook would be triggered by Stripe.
 * This endpoint lets the frontend simulate the full flow.
 */
router.post("/simulate-payment", async (req, res) => {
  try {
    const { amount_usd } = req.body;

    if (!amount_usd || amount_usd <= 0) {
      res.status(400).json({ error: "Invalid amount", code: "INVALID_AMOUNT" });
      return;
    }

    const amountCents = Math.round(amount_usd * 100);

    // Simulate a Stripe webhook event locally
    const simulatedEvent = {
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: `pi_test_${Date.now()}`,
          amount: amountCents,
          currency: "usd",
          status: "succeeded",
        },
      },
    };

    // Forward to our own webhook handler
    const webhookUrl = `http://localhost:${config.port}/webhooks/stripe`;
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(simulatedEvent),
    });

    const webhookResult = await webhookResponse.json();

    res.json({
      success: webhookResponse.ok,
      mode: "test",
      note: "(Test Mode) — simulated payment, no real charge",
      amount_usd,
      ...webhookResult,
    });
  } catch (err) {
    console.error("Payment simulation error:", err);
    res.status(502).json({ error: "Payment simulation failed", code: "STRIPE_ERROR" });
  }
});

export default router;
