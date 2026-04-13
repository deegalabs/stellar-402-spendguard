import { config } from "../config.js";
import { scValToNative } from "@stellar/stellar-sdk";
import { getServer } from "./client.js";
import type { TransactionEvent } from "../types.js";

// Soroban contract events emit topics like ("SpendGuard", "<name>"). Map
// the second-topic symbol to the public TransactionEvent.type string the
// audit UI expects. Anything not listed here passes through under its
// raw name so unknown events still show up rather than vanishing.
const TOPIC_TO_TYPE: Record<string, string> = {
  payment: "payment_authorized",
  rejected: "payment_rejected",
  topup: "treasury_topup",
  pause: "emergency_pause",
  unpause: "emergency_unpause",
  limit: "limit_updated",
  max_tx: "max_tx_updated",
  whitelist: "merchant_whitelisted",
  remove: "merchant_removed",
  agent: "agent_updated",
  reset: "daily_reset",
};

// ~14h of testnet ledgers (5s block time). Sits inside the testnet
// event-retention window so a fresh `startLedger` query rarely trips
// the "before retention" RPC error.
const LOOKBACK_LEDGERS = 10000;

export async function getContractTransactions(
  limit: number = 50,
  cursor?: string
): Promise<{ transactions: TransactionEvent[]; cursor: string }> {
  if (!config.contractAddress) {
    return { transactions: [], cursor: "" };
  }

  const server = getServer();
  const filters = [
    { type: "contract" as const, contractIds: [config.contractAddress] },
  ];

  // Soroban RPC's getEvents takes EITHER startLedger OR cursor — never
  // both. Without a cursor we anchor to (latest - LOOKBACK_LEDGERS); the
  // SDK enforces this exclusivity at the type level.
  let request: Parameters<typeof server.getEvents>[0];
  if (cursor) {
    request = { filters, cursor, limit };
  } else {
    const latest = await server.getLatestLedger();
    const startLedger = Math.max(latest.sequence - LOOKBACK_LEDGERS, 2);
    request = { filters, startLedger, limit };
  }

  let response;
  try {
    response = await server.getEvents(request);
  } catch (err) {
    // Old code swallowed every error into an empty array, which is why
    // the production audit log silently showed "0 transactions" instead
    // of surfacing the underlying RPC failure. Log + rethrow so the
    // dashboard route can return a proper 502 and the UI shows an error.
    console.error("[horizon] getEvents failed:", err);
    throw err;
  }

  const events: TransactionEvent[] = response.events.map((ev) => {
    const topics = ev.topic.map((t) => {
      try {
        return scValToNative(t);
      } catch {
        return null;
      }
    });
    const eventName =
      typeof topics[1] === "string" ? (topics[1] as string) : "unknown";
    const type = TOPIC_TO_TYPE[eventName] ?? eventName;

    let merchant = "";
    let amount = "0";
    let spent_today = "0";
    let status: "settled" | "blocked" | "pending" = "settled";

    try {
      const value = scValToNative(ev.value);
      if (eventName === "payment" && Array.isArray(value)) {
        merchant = String(value[0] ?? "");
        amount = String(value[1] ?? "0");
        spent_today = String(value[2] ?? "0");
        status = "settled";
      } else if (eventName === "rejected" && Array.isArray(value)) {
        merchant = String(value[0] ?? "");
        amount = String(value[1] ?? "0");
        status = "blocked";
      } else if (eventName === "topup" && Array.isArray(value)) {
        amount = String(value[1] ?? "0");
      } else if (
        (eventName === "limit" || eventName === "max_tx") &&
        (typeof value === "bigint" || typeof value === "number")
      ) {
        amount = String(value);
      }
    } catch {
      /* leave defaults — unknown event shapes shouldn't drop the row */
    }

    return {
      id: ev.id,
      type,
      timestamp: ev.ledgerClosedAt,
      merchant,
      amount,
      spent_today,
      tx_hash: ev.txHash,
      ledger: ev.ledger,
      status,
      stellar_expert_url: `https://stellar.expert/explorer/testnet/tx/${ev.txHash}`,
    };
  });

  // RPC returns events oldest-first; the audit UI expects newest-first.
  events.reverse();

  return { transactions: events, cursor: response.cursor };
}

export async function getContractBalance(): Promise<{
  balance: string;
  balance_usdc: string;
}> {
  // Soroban contracts hold USDC in SAC contract storage, not in a classic
  // Horizon account. We read the balance from get_status() via RPC instead.
  try {
    const { getStatus } = await import("./contract.js");
    const status = await getStatus();
    const stroops = BigInt(status.balance);
    const usdc = Number(stroops) / 1e7;
    return {
      balance: status.balance,
      balance_usdc: usdc.toFixed(2),
    };
  } catch {
    return { balance: "0", balance_usdc: "0.00" };
  }
}
