import type {
  SpendGuardConfig,
  ContractStatus,
  BalanceInfo,
  TransactionResult,
  TxResult,
  AgentResult,
} from "./types.js";
import { usdcToStroops } from "./utils.js";

/**
 * SpendGuard API Client
 *
 * Wraps the SpendGuard REST API for dashboard reads, admin operations,
 * and agent payment cycles.
 *
 * @example
 * ```typescript
 * const client = new SpendGuardClient({
 *   apiUrl: "https://your-backend.railway.app",
 *   apiKey: "sk_...",
 * });
 *
 * const status = await client.getStatus();
 * console.log(`Balance: $${status.balance}`);
 * ```
 */
export class SpendGuardClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: SpendGuardConfig) {
    this.baseUrl = config.apiUrl.replace(/\/$/, "");
    this.headers = { "Content-Type": "application/json" };

    if (config.apiKey) {
      this.headers["Authorization"] = `Bearer ${config.apiKey}`;
    }
    if (config.stellarAddress) {
      this.headers["X-Stellar-Address"] = config.stellarAddress;
    }
  }

  // ── Internal ──────────────────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new SpendGuardError(
        (err as { error?: string }).error ?? `HTTP ${res.status}`,
        res.status,
        (err as { code?: string }).code
      );
    }

    return res.json() as Promise<T>;
  }

  // ── Dashboard (read-only, no auth) ────────────────────────

  /** Get current contract state */
  async getStatus(): Promise<ContractStatus> {
    return this.request("GET", "/api/status");
  }

  /** Get contract USDC balance */
  async getBalance(): Promise<BalanceInfo> {
    return this.request("GET", "/api/balance");
  }

  /** Get transaction history (paginated) */
  async getTransactions(
    limit: number = 50,
    cursor?: string
  ): Promise<TransactionResult> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    return this.request("GET", `/api/transactions?${params}`);
  }

  // ── Admin (require auth) ──────────────────────────────────

  /** Set daily spending limit (in USDC, e.g. 100 = $100.00) */
  async setDailyLimit(usdcAmount: number): Promise<TxResult> {
    return this.request("POST", "/api/admin/set-limit", {
      daily_limit: usdcToStroops(usdcAmount),
    });
  }

  /** Set max per-transaction value (in USDC) */
  async setMaxTx(usdcAmount: number): Promise<TxResult> {
    return this.request("POST", "/api/admin/set-max-tx", {
      max_tx_value: usdcToStroops(usdcAmount),
    });
  }

  /** Add a merchant to the whitelist */
  async whitelistMerchant(address: string): Promise<TxResult> {
    return this.request("POST", "/api/admin/whitelist", { merchant: address });
  }

  /** Remove a merchant from the whitelist */
  async removeMerchant(address: string): Promise<TxResult> {
    return this.request("POST", "/api/admin/remove-merchant", {
      merchant: address,
    });
  }

  /** Emergency pause — block all agent payments */
  async pause(): Promise<TxResult> {
    return this.request("POST", "/api/admin/pause");
  }

  /** Resume operations after a pause */
  async unpause(): Promise<TxResult> {
    return this.request("POST", "/api/admin/unpause");
  }

  /** Deposit USDC into the contract (in USDC) */
  async topUp(usdcAmount: number): Promise<TxResult> {
    return this.request("POST", "/api/admin/top-up", {
      amount: usdcToStroops(usdcAmount),
    });
  }

  // ── Agent ─────────────────────────────────────────────────

  /** Run a full x402 payment cycle (request → 402 → pay → 200) */
  async runAgent(targetUrl?: string): Promise<AgentResult> {
    return this.request("POST", "/api/demo/run-agent", {
      target_url: targetUrl,
    });
  }
}

/** Typed error from the SpendGuard API */
export class SpendGuardError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "SpendGuardError";
  }
}
