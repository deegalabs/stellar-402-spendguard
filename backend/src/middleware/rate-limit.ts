/**
 * Rate Limiting Middleware
 *
 * Protects API endpoints from abuse with tiered limits:
 * - General API: 100 requests per 15 minutes
 * - Admin endpoints: 20 requests per 15 minutes
 * - Demo/agent endpoints: 30 requests per 15 minutes
 */

import rateLimit from "express-rate-limit";

/** General API rate limit — 100 req / 15 min */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests", code: "RATE_LIMITED" },
});

/** Admin endpoints — 20 req / 15 min */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests", code: "RATE_LIMITED" },
});

/** Demo/agent endpoints — 30 req / 15 min */
export const demoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many demo requests", code: "RATE_LIMITED" },
});
