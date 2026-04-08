/**
 * Rate Limiting Middleware
 *
 * Tiered buckets that match the traffic shape of the app:
 * - Reads (GET /api/status, /api/balance, /api/transactions): cheap,
 *   high volume because multiple UI widgets poll them. Permissive.
 * - General mutations (POST /api/stripe/*, etc.): moderate.
 * - Admin (POST /api/admin/*): owner-only, hand-triggered. Tight.
 * - Demo/agent (POST /api/demo/*): runs the full x402 round-trip, which
 *   is expensive. Tight.
 *
 * Limits can be overridden via env in case Railway needs different
 * thresholds per environment.
 */

import rateLimit from "express-rate-limit";

function envNum(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const WINDOW_MS = 15 * 60 * 1000;

/**
 * Read-only GETs — /api/status, /api/balance, /api/transactions.
 *
 * Every dashboard page has polling widgets, and a single browser tab
 * can legitimately issue ~60 reads/min even with the shared poller.
 * Budget for several tabs and a demo audience watching live.
 */
export const readLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: envNum("RATE_LIMIT_READS", 2000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests", code: "RATE_LIMITED" },
});

/** General API rate limit — non-read POSTs (Stripe simulate, etc.) */
export const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: envNum("RATE_LIMIT_GENERAL", 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests", code: "RATE_LIMITED" },
});

/** Admin endpoints — owner-triggered, low volume. */
export const adminLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: envNum("RATE_LIMIT_ADMIN", 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests", code: "RATE_LIMITED" },
});

/** Demo/agent endpoints — expensive, keep tight. */
export const demoLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: envNum("RATE_LIMIT_DEMO", 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many demo requests", code: "RATE_LIMITED" },
});
