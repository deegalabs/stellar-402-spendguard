/**
 * Admin Authentication Middleware
 *
 * Protects admin endpoints from unauthorized access.
 * The backend holds the owner's secret key and uses it to sign
 * Soroban transactions — without auth, anyone could trigger
 * owner-signed operations via the API.
 *
 * Authentication methods (checked in order):
 * 1. Bearer token: Authorization header matching ADMIN_API_KEY env var
 * 2. Stellar public key: X-Stellar-Address header matching OWNER_PUBLIC_KEY
 *
 * For production use, this should be replaced with Freighter wallet
 * signature verification (the frontend already uses Freighter for signing).
 */

import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  // Method 1: API key (for programmatic access / testing)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey && authHeader === `Bearer ${adminKey}`) {
      next();
      return;
    }
    res.status(401).json({ error: "Invalid API key", code: "UNAUTHORIZED" });
    return;
  }

  // Method 2: Stellar address verification (for dashboard)
  const stellarAddress = req.headers["x-stellar-address"] as string | undefined;
  if (stellarAddress) {
    if (
      config.ownerPublicKey &&
      stellarAddress === config.ownerPublicKey
    ) {
      next();
      return;
    }
    res.status(403).json({ error: "Not the contract owner", code: "FORBIDDEN" });
    return;
  }

  // No auth provided
  res.status(401).json({
    error: "Authentication required",
    code: "UNAUTHORIZED",
    hint: "Provide Authorization: Bearer <ADMIN_API_KEY> or X-Stellar-Address: <OWNER_PUBLIC_KEY>",
  });
}
