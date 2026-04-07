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

const router = Router();

// All admin routes require authentication and rate limiting
router.use(adminLimiter);
router.use(adminAuth);

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
    res.status(502).json({ error: "Stellar transaction failed", code: "STELLAR_ERROR" });
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
    res.status(502).json({ error: "Stellar transaction failed", code: "STELLAR_ERROR" });
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
    res.status(502).json({ error: "Stellar transaction failed", code: "STELLAR_ERROR" });
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
    res.status(502).json({ error: "Stellar transaction failed", code: "STELLAR_ERROR" });
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
    res.status(502).json({ error: "Stellar transaction failed", code: "STELLAR_ERROR" });
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
    res.status(409).json({ error: "Already paused", code: "ALREADY_PAUSED" });
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
    res.status(409).json({ error: "Not paused", code: "NOT_PAUSED" });
  }
});

export default router;
