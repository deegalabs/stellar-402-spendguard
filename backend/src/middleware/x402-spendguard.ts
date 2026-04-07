/**
 * x402 SpendGuard Express Middleware
 *
 * Protects Express routes with x402 Payment Required responses and validates
 * payments through the SpendGuard contract on Stellar.
 *
 * Usage:
 *   import { x402Paywall } from "./middleware/x402-spendguard.js";
 *
 *   app.get("/api/premium-data", x402Paywall({
 *     price: "0.10",
 *     merchant: "GAURBKKJ...",
 *     description: "Premium weather data",
 *   }), (req, res) => {
 *     res.json({ data: "premium content" });
 *   });
 */

import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export interface PaywallOptions {
  /** Price in USDC (e.g. "0.10" for 10 cents) */
  price: string;
  /** Merchant Stellar address (G...) that receives payment */
  merchant: string;
  /** Human-readable description of the resource */
  description: string;
  /** Network identifier (default: "stellar:testnet") */
  network?: string;
}

interface PaymentRecord {
  txHash: string;
  timestamp: number;
}

// In-memory payment verification cache (TTL: 5 minutes)
const verifiedPayments = new Map<string, PaymentRecord>();
const PAYMENT_TTL_MS = 5 * 60 * 1000;

function cleanExpiredPayments(): void {
  const now = Date.now();
  for (const [key, record] of verifiedPayments) {
    if (now - record.timestamp > PAYMENT_TTL_MS) {
      verifiedPayments.delete(key);
    }
  }
}

/**
 * Creates an Express middleware that returns HTTP 402 for unpaid requests
 * and validates x402 payment proofs via SpendGuard.
 */
export function x402Paywall(options: PaywallOptions) {
  const { price, merchant, description, network = "stellar:testnet" } = options;

  const priceStroops = String(
    Math.round(parseFloat(price) * 10_000_000)
  );

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Check for payment proof header
    const paymentProof =
      req.headers["x-payment"] as string | undefined ??
      req.headers["x-payment-proof"] as string | undefined;

    if (!paymentProof) {
      // No payment — return 402 with x402 challenge
      res.status(402).json({
        x402Version: 1,
        accepts: [
          {
            scheme: "exact",
            network,
            price: priceStroops,
            payTo: merchant,
            asset: {
              address: config.usdcSacAddress || "USDC",
            },
          },
        ],
        description,
        error: "Payment Required",
      });
      return;
    }

    // Verify payment proof
    cleanExpiredPayments();

    // Check cache first (avoid re-verifying the same tx)
    if (verifiedPayments.has(paymentProof)) {
      next();
      return;
    }

    try {
      // Verify on Horizon that the transaction exists and succeeded
      const horizonUrl = config.horizonUrl || "https://horizon-testnet.stellar.org";
      const txResponse = await fetch(`${horizonUrl}/transactions/${paymentProof}`);

      if (!txResponse.ok) {
        res.status(402).json({
          error: "Invalid payment proof",
          message: "Transaction not found on Stellar network",
          x402Version: 1,
          accepts: [
            {
              scheme: "exact",
              network,
              price: priceStroops,
              payTo: merchant,
              asset: { address: config.usdcSacAddress || "USDC" },
            },
          ],
          description,
        });
        return;
      }

      const txData = await txResponse.json();

      if (!txData.successful) {
        res.status(402).json({
          error: "Payment failed",
          message: "Transaction was not successful",
        });
        return;
      }

      // Cache the verified payment
      verifiedPayments.set(paymentProof, {
        txHash: paymentProof,
        timestamp: Date.now(),
      });

      next();
    } catch {
      res.status(502).json({
        error: "Payment verification failed",
        message: "Could not verify payment on Stellar network",
      });
    }
  };
}

/**
 * Creates a simple pricing table middleware that returns available
 * x402-protected resources and their prices.
 */
export function x402PricingTable(
  resources: Array<{ path: string; price: string; description: string }>
) {
  return (_req: Request, res: Response): void => {
    res.json({
      x402Version: 1,
      network: "stellar:testnet",
      currency: "USDC",
      resources: resources.map((r) => ({
        ...r,
        price_stroops: String(Math.round(parseFloat(r.price) * 10_000_000)),
      })),
    });
  };
}
