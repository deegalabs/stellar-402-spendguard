import { getStatus } from "../stellar/contract.js";
import { authorizePayment } from "../stellar/contract.js";
import { getContractTransactions } from "../stellar/horizon.js";

const STROOPS_PER_USDC = 10_000_000;

function stroopsToUsdc(stroops: string): string {
  return (Number(stroops) / STROOPS_PER_USDC).toFixed(2);
}

function usdcToStroops(usdc: string): bigint {
  return BigInt(Math.round(parseFloat(usdc) * STROOPS_PER_USDC));
}

export async function handleGetStatus(): Promise<string> {
  const status = await getStatus();
  const dailyLimitUsdc = stroopsToUsdc(status.daily_limit);
  const maxTxUsdc = stroopsToUsdc(status.max_tx_value);
  const spentTodayUsdc = stroopsToUsdc(status.spent_today);
  const balanceUsdc = stroopsToUsdc(status.balance);
  const remainingUsdc = (
    parseFloat(dailyLimitUsdc) - parseFloat(spentTodayUsdc)
  ).toFixed(2);

  return JSON.stringify({
    owner: status.owner,
    agent: status.agent,
    daily_limit: status.daily_limit,
    daily_limit_usdc: dailyLimitUsdc,
    max_tx_value: status.max_tx_value,
    max_tx_value_usdc: maxTxUsdc,
    spent_today: status.spent_today,
    spent_today_usdc: spentTodayUsdc,
    remaining_today_usdc: remainingUsdc,
    last_reset: status.last_reset,
    paused: status.paused,
    balance: status.balance,
    balance_usdc: balanceUsdc,
  });
}

const ERROR_SUGGESTIONS: Record<string, string> = {
  ContractPaused: "Wait for owner to unpause, or contact the contract owner",
  ExceedsDailyLimit:
    "Wait until daily reset (24h), or request a smaller amount",
  ExceedsMaxTx:
    "Request a smaller amount, or ask the owner to increase max_tx_value",
  MerchantNotWhitelisted: "Ask the contract owner to whitelist this merchant",
  InsufficientBalance: "Ask the contract owner to top up the contract",
};

function parseContractError(err: unknown): {
  error: string;
  message: string;
  suggestion: string;
} {
  const msg = err instanceof Error ? err.message : String(err);

  for (const [code, suggestion] of Object.entries(ERROR_SUGGESTIONS)) {
    if (msg.includes(code)) {
      return { error: code, message: msg, suggestion };
    }
  }

  return {
    error: "UnknownError",
    message: msg,
    suggestion: "Check the contract status and try again",
  };
}

export async function handleAuthorizePayment(
  amount: string,
  merchant: string
): Promise<string> {
  const stroops = usdcToStroops(amount);

  try {
    const result = await authorizePayment(stroops, merchant);
    const txHash =
      typeof result === "object" && result !== null && "hash" in result
        ? (result as { hash: string }).hash
        : String(result);

    const status = await getStatus();

    return JSON.stringify({
      success: true,
      tx_hash: txHash,
      amount_usdc: amount,
      merchant,
      spent_today_usdc: stroopsToUsdc(status.spent_today),
      remaining_today_usdc: (
        parseFloat(stroopsToUsdc(status.daily_limit)) -
        parseFloat(stroopsToUsdc(status.spent_today))
      ).toFixed(2),
      stellar_expert_url: `https://stellar.expert/explorer/testnet/tx/${txHash}`,
    });
  } catch (err) {
    const parsed = parseContractError(err);
    return JSON.stringify({
      success: false,
      ...parsed,
    });
  }
}

export async function handleGetTransactions(limit: number): Promise<string> {
  const clamped = Math.min(Math.max(limit, 1), 50);
  const { transactions } = await getContractTransactions(clamped);

  return JSON.stringify({
    transactions: transactions.map((tx) => ({
      type: tx.type,
      timestamp: tx.timestamp,
      amount_usdc: stroopsToUsdc(tx.amount),
      merchant: tx.merchant,
      tx_hash: tx.tx_hash,
      status: tx.status,
      stellar_expert_url: tx.stellar_expert_url,
    })),
    total: transactions.length,
  });
}

export async function handleCheckBudget(
  amount: string,
  merchant: string
): Promise<string> {
  const status = await getStatus();
  const stroops = usdcToStroops(amount);
  const dailyLimit = BigInt(status.daily_limit);
  const maxTx = BigInt(status.max_tx_value);
  const spentToday = BigInt(status.spent_today);
  const balance = BigInt(status.balance);

  const checks = {
    paused: status.paused,
    within_max_tx: stroops <= maxTx,
    within_daily_limit: spentToday + stroops <= dailyLimit,
    sufficient_balance: stroops <= balance,
  };

  const allowed =
    !checks.paused &&
    checks.within_max_tx &&
    checks.within_daily_limit &&
    checks.sufficient_balance;

  let reason: string;
  if (allowed) {
    reason = `Payment of $${amount} to ${merchant} is within all policy limits`;
  } else if (checks.paused) {
    reason = "Contract is paused — all payments are blocked";
  } else if (!checks.within_max_tx) {
    reason = `$${amount} exceeds max per-transaction limit of $${stroopsToUsdc(status.max_tx_value)}`;
  } else if (!checks.within_daily_limit) {
    reason = `$${amount} would exceed daily limit ($${stroopsToUsdc(status.spent_today)} of $${stroopsToUsdc(status.daily_limit)} already spent)`;
  } else {
    reason = `Insufficient balance: $${stroopsToUsdc(status.balance)} available, $${amount} requested`;
  }

  return JSON.stringify({ allowed, reason, checks });
}
