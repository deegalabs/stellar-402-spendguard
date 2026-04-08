import { Router } from "express";
import { getStatus } from "../stellar/contract.js";
import { getContractTransactions, getContractBalance } from "../stellar/horizon.js";
import { config } from "../config.js";

const router = Router();

router.get("/status", async (_req, res) => {
  try {
    const status = await getStatus();
    res.json({
      ...status,
      contract_address: config.contractAddress,
    });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch contract status", code: "STELLAR_ERROR" });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const cursor = req.query.cursor as string | undefined;

    const result = await getContractTransactions(limit, cursor);
    res.json({
      transactions: result.transactions,
      cursor: result.cursor,
      total_count: result.transactions.length,
    });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch transactions", code: "STELLAR_ERROR" });
  }
});

router.get("/balance", async (_req, res) => {
  try {
    const result = await getContractBalance();
    res.json({
      balance: result.balance,
      balance_usdc: result.balance_usdc,
      last_updated: new Date().toISOString(),
    });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch balance", code: "STELLAR_ERROR" });
  }
});

export default router;
