import { SpendGuardClient, SpendGuardError } from "./client.js";
import type {
  SpendGuardConfig,
  BudgetCheck,
  PaymentResult,
  SpendingReport,
} from "./types.js";
import { stroopsToUsdc } from "./utils.js";

/**
 * SpendGuard Agent — high-level helper for x402 payment flows
 *
 * Designed for AI agents that need to make governed payments.
 * Wraps the full x402 cycle: check budget → pay → get data.
 *
 * @example
 * ```typescript
 * const agent = new SpendGuardAgent({
 *   apiUrl: process.env.SPENDGUARD_URL!,
 * });
 *
 * // Check if we can afford it
 * const budget = await agent.checkBudget(0.10, "GAUR...");
 * if (budget.allowed) {
 *   const result = await agent.payForResource("https://api.example.com/data");
 *   console.log(result.data);
 * }
 * ```
 */
export class SpendGuardAgent {
  private readonly client: SpendGuardClient;

  constructor(config: SpendGuardConfig) {
    this.client = new SpendGuardClient(config);
  }

  /**
   * Execute a full x402 payment cycle.
   *
   * 1. Requests the target URL
   * 2. If HTTP 402, parses the x402 challenge
   * 3. Authorizes payment through the SpendGuard contract
   * 4. Retries the request with payment proof
   * 5. Returns the response data
   */
  async payForResource(url: string): Promise<PaymentResult> {
    const start = Date.now();

    try {
      const result = await this.client.runAgent(url);
      const settlement_time_ms = Date.now() - start;

      const txStep = result.steps.find((s) => s.tx_hash);
      const dataStep = result.steps.find((s) => s.data);

      return {
        success: result.success,
        data: dataStep?.data ?? null,
        tx_hash: txStep?.tx_hash ?? null,
        settlement_time_ms,
        steps: result.steps,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        tx_hash: null,
        settlement_time_ms: Date.now() - start,
        steps: [
          {
            step: "error",
            status: "failed",
            error: err instanceof Error ? err.message : "Unknown error",
          },
        ],
      };
    }
  }

  /**
   * Dry-run check: would this payment be allowed?
   *
   * Checks all policy constraints (daily limit, max tx, merchant
   * whitelist, balance, pause status) WITHOUT executing a transaction.
   */
  async checkBudget(
    usdcAmount: number,
    merchant: string
  ): Promise<BudgetCheck> {
    const status = await this.client.getStatus();

    const stroops = BigInt(Math.round(usdcAmount * 10_000_000));
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
      reason = `Payment of $${usdcAmount.toFixed(2)} to ${merchant} is within all policy limits`;
    } else if (checks.paused) {
      reason = "Contract is paused — all payments are blocked";
    } else if (!checks.within_max_tx) {
      reason = `$${usdcAmount.toFixed(2)} exceeds max per-transaction limit of $${stroopsToUsdc(status.max_tx_value)}`;
    } else if (!checks.within_daily_limit) {
      reason = `$${usdcAmount.toFixed(2)} would exceed daily limit ($${stroopsToUsdc(status.spent_today)} of $${stroopsToUsdc(status.daily_limit)} already spent)`;
    } else {
      reason = `Insufficient balance: $${stroopsToUsdc(status.balance)} available, $${usdcAmount.toFixed(2)} requested`;
    }

    return { allowed, reason, checks };
  }

  /** Get a spending summary for the current 24h window */
  async getSpendingReport(): Promise<SpendingReport> {
    const [status, balanceInfo] = await Promise.all([
      this.client.getStatus(),
      this.client.getBalance(),
    ]);

    const dailyLimitUsdc = stroopsToUsdc(status.daily_limit);
    const spentTodayUsdc = stroopsToUsdc(status.spent_today);
    const remaining = parseFloat(dailyLimitUsdc) - parseFloat(spentTodayUsdc);
    const utilization =
      parseFloat(dailyLimitUsdc) > 0
        ? (parseFloat(spentTodayUsdc) / parseFloat(dailyLimitUsdc)) * 100
        : 0;

    return {
      daily_limit_usdc: dailyLimitUsdc,
      spent_today_usdc: spentTodayUsdc,
      remaining_usdc: remaining.toFixed(2),
      utilization_pct: Math.round(utilization),
      paused: status.paused,
      balance_usdc: balanceInfo.balance_usdc,
    };
  }
}
