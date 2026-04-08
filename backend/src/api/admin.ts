import { Router } from "express";
import {
  topUp,
  setDailyLimit,
  setMaxTx,
  whitelistMerchant,
  removeMerchant,
  emergencyPause,
  emergencyUnpause,
} from "../stellar/contract.js";
import { adminAuth } from "../middleware/admin-auth.js";
import { adminLimiter } from "../middleware/rate-limit.js";
import { ConfigError } from "../stellar/client.js";

const router = Router();

// All admin routes require authentication and rate limiting
router.use(adminLimiter);
router.use(adminAuth);

/**
 * Contract error code → (HTTP status, canonical name).
 *
 * The HTTP status is chosen to reflect *why* the call failed from the
 * caller's perspective, so clients (and Railway's 5xx alerting) don't
 * treat a legitimate policy denial as an upstream outage.
 *
 * - 403 Forbidden — authorization / policy denials
 * - 402 Payment Required — balance or limit issues
 * - 409 Conflict — current state blocks the action (already paused, etc.)
 * - 400 Bad Request — caller supplied invalid input
 */
const CONTRACT_ERRORS: Record<number, { name: string; status: number }> = {
  1: { name: "AlreadyInitialized", status: 409 },
  2: { name: "NotInitialized", status: 409 },
  3: { name: "Unauthorized", status: 403 },
  4: { name: "ContractPaused", status: 409 },
  5: { name: "ExceedsDailyLimit", status: 402 },
  6: { name: "ExceedsMaxTx", status: 402 },
  7: { name: "MerchantNotWhitelisted", status: 403 },
  8: { name: "InvalidAmount", status: 400 },
  9: { name: "InsufficientBalance", status: 402 },
  10: { name: "ArithmeticOverflow", status: 400 },
  11: { name: "AlreadyPaused", status: 409 },
  12: { name: "NotPaused", status: 409 },
  13: { name: "MerchantAlreadyWhitelisted", status: 409 },
};

interface StellarErrorInfo {
  status: number;
  code: string;
  message: string;
}

function stellarError(err: unknown): StellarErrorInfo {
  if (err instanceof ConfigError) {
    return { status: 503, code: err.code, message: err.message };
  }
  if (err instanceof Error) {
    // Extract clean message from Soroban HostError
    const msg = err.message;
    const match = msg.match(/Error\(Contract, #(\d+)\)/);
    if (match) {
      const num = Number(match[1]);
      const known = CONTRACT_ERRORS[num];
      if (known) {
        return { status: known.status, code: known.name, message: known.name };
      }
      return { status: 500, code: "CONTRACT_ERROR", message: `ContractError(${num})` };
    }
    // Not a contract error → genuine Stellar RPC / network failure.
    return { status: 502, code: "STELLAR_ERROR", message: msg.split("\n")[0] };
  }
  return { status: 500, code: "UNKNOWN_ERROR", message: "Unknown error" };
}

function sendError(res: import("express").Response, err: unknown) {
  const info = stellarError(err);
  res.status(info.status).json({ error: info.message, code: info.code });
}

router.post("/top-up", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ error: "Invalid amount", code: "INVALID_AMOUNT" });
      return;
    }

    const result = await topUp(BigInt(amount));
    res.json({
      tx_hash: result.hash,
      amount_deposited: String(amount),
    });
  } catch (err) {
    console.error("[admin/top-up]", err);
    sendError(res, err);
  }
});

router.post("/set-limit", async (req, res) => {
  try {
    const { daily_limit } = req.body;
    if (!daily_limit || daily_limit <= 0) {
      res.status(400).json({ error: "Invalid amount", code: "INVALID_AMOUNT" });
      return;
    }

    const result = await setDailyLimit(BigInt(daily_limit));
    res.json({
      tx_hash: result.hash,
      new_limit: String(daily_limit),
    });
  } catch (err) {
    console.error("[admin/set-limit]", err);
    sendError(res, err);
  }
});

router.post("/set-max-tx", async (req, res) => {
  try {
    const { max_tx_value } = req.body;
    if (!max_tx_value || max_tx_value <= 0) {
      res.status(400).json({ error: "Invalid amount", code: "INVALID_AMOUNT" });
      return;
    }

    const result = await setMaxTx(BigInt(max_tx_value));
    res.json({
      tx_hash: result.hash,
      new_max_tx: String(max_tx_value),
    });
  } catch (err) {
    console.error("[admin/set-max-tx]", err);
    sendError(res, err);
  }
});

router.post("/whitelist", async (req, res) => {
  try {
    const { merchant } = req.body;
    if (!merchant || !merchant.startsWith("G")) {
      res.status(400).json({ error: "Invalid address", code: "INVALID_ADDRESS" });
      return;
    }

    const result = await whitelistMerchant(merchant);
    res.json({
      tx_hash: result.hash,
      merchant,
    });
  } catch (err) {
    console.error("[admin/whitelist]", err);
    sendError(res, err);
  }
});

router.post("/remove-merchant", async (req, res) => {
  try {
    const { merchant } = req.body;
    if (!merchant || !merchant.startsWith("G")) {
      res.status(400).json({ error: "Invalid address", code: "INVALID_ADDRESS" });
      return;
    }

    const result = await removeMerchant(merchant);
    res.json({
      tx_hash: result.hash,
      merchant,
    });
  } catch (err) {
    console.error("[admin/remove-merchant]", err);
    sendError(res, err);
  }
});

router.post("/pause", async (_req, res) => {
  try {
    const result = await emergencyPause();
    res.json({
      tx_hash: result.hash,
      paused: true,
    });
  } catch (err) {
    console.error("[admin/pause]", err);
    sendError(res, err);
  }
});

router.post("/unpause", async (_req, res) => {
  try {
    const result = await emergencyUnpause();
    res.json({
      tx_hash: result.hash,
      paused: false,
    });
  } catch (err) {
    console.error("[admin/unpause]", err);
    sendError(res, err);
  }
});

export default router;
