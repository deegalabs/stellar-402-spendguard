import { Router } from "express";
import { topUp } from "../stellar/contract.js";
import { config } from "../config.js";

const router = Router();

/**
 * Stripe webhook handler (simulated for hackathon).
 * In production this would verify the Stripe signature
 * and handle real payment intents.
 */
router.post("/stripe", async (req, res) => {
  try {
    const event = req.body;

    if (!event || !event.type) {
      res.status(400).json({ error: "Invalid event payload" });
      return;
    }

    if (event.type !== "payment_intent.succeeded") {
      res.json({ received: true, handled: false });
      return;
    }

    const paymentIntent = event.data?.object;
    if (!paymentIntent?.amount) {
      res.status(400).json({ error: "Missing payment amount" });
      return;
    }

    // Convert cents to USDC stroops: $1.00 = 100 cents = 10_000_000 stroops
    const amountCents = paymentIntent.amount as number;
    const stroops = BigInt(amountCents) * BigInt(100_000); // cents → stroops

    const result = await topUp(stroops);

    res.json({
      received: true,
      handled: true,
      tx_hash: result.hash,
      amount_stroops: stroops.toString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: "Failed to process webhook", code: "STRIPE_ERROR", details: message });
  }
});

export default router;
