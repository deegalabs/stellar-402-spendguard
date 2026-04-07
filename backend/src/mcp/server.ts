import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  handleGetStatus,
  handleAuthorizePayment,
  handleGetTransactions,
  handleCheckBudget,
} from "./tools.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "spendguard",
    version: "0.1.0",
  });

  server.tool(
    "spendguard_get_status",
    "Read current SpendGuard contract state: balance, daily limit, spent today, pause status. Use this to check available budget before making payments.",
    {},
    async () => {
      const result = await handleGetStatus();
      return { content: [{ type: "text", text: result }] };
    }
  );

  server.tool(
    "spendguard_authorize_payment",
    "Execute a governed USDC payment through the SpendGuard contract on Stellar. The contract enforces spending policies (daily limit, max tx, merchant whitelist) on-chain. The agent CANNOT bypass limits.",
    {
      amount: z
        .string()
        .describe('Amount in USDC (e.g. "1.50"). Converted to stroops internally.'),
      merchant: z
        .string()
        .describe("Merchant Stellar address (G...). Must be whitelisted in the contract."),
    },
    async ({ amount, merchant }) => {
      const result = await handleAuthorizePayment(amount, merchant);
      return { content: [{ type: "text", text: result }] };
    }
  );

  server.tool(
    "spendguard_get_transactions",
    "Read recent transaction history from the SpendGuard audit log. Shows payments, amounts, merchants, and Stellar Expert links.",
    {
      limit: z
        .number()
        .min(1)
        .max(50)
        .default(10)
        .describe("Number of transactions to return (default: 10, max: 50)"),
    },
    async ({ limit }) => {
      const result = await handleGetTransactions(limit);
      return { content: [{ type: "text", text: result }] };
    }
  );

  server.tool(
    "spendguard_check_budget",
    "Dry-run check whether a payment would be allowed by current spending policies. Does NOT execute a transaction — use this before authorize_payment to avoid failed transactions.",
    {
      amount: z
        .string()
        .describe('Amount in USDC (e.g. "2.50")'),
      merchant: z
        .string()
        .describe("Merchant Stellar address (G...)"),
    },
    async ({ amount, merchant }) => {
      const result = await handleCheckBudget(amount, merchant);
      return { content: [{ type: "text", text: result }] };
    }
  );

  return server;
}
