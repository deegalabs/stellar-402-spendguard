import { config } from "../config.js";
import type { TransactionEvent } from "../types.js";

const HORIZON_BASE = config.horizonUrl;

interface HorizonEffect {
  id: string;
  type: string;
  created_at: string;
  paging_token: string;
}

interface HorizonTransaction {
  id: string;
  hash: string;
  created_at: string;
  ledger_attr: number;
  source_account: string;
  successful: boolean;
}

export async function getContractTransactions(
  limit: number = 50,
  cursor?: string
): Promise<{ transactions: TransactionEvent[]; cursor: string }> {
  if (!config.contractAddress) {
    return { transactions: [], cursor: "" };
  }

  const params = new URLSearchParams({
    limit: String(limit),
    order: "desc",
  });
  if (cursor) {
    params.set("cursor", cursor);
  }

  const url = `${HORIZON_BASE}/accounts/${config.contractAddress}/transactions?${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { transactions: [], cursor: "" };
    }

    const data = await response.json();
    const records = data._embedded?.records ?? [];

    const transactions: TransactionEvent[] = records.map(
      (tx: HorizonTransaction) => ({
        id: tx.id,
        type: tx.successful ? "payment_authorized" : "payment_rejected",
        timestamp: tx.created_at,
        merchant: "",
        amount: "0",
        spent_today: "0",
        tx_hash: tx.hash,
        ledger: tx.ledger_attr,
        status: tx.successful ? ("settled" as const) : ("blocked" as const),
        stellar_expert_url: `https://stellar.expert/explorer/testnet/tx/${tx.hash}`,
      })
    );

    const lastToken =
      records.length > 0 ? records[records.length - 1].paging_token : "";

    return { transactions, cursor: lastToken };
  } catch {
    return { transactions: [], cursor: "" };
  }
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
