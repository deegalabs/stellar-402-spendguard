/** Contract state returned by GET /api/status */
export interface ContractStatus {
  owner: string;
  agent: string;
  daily_limit: string;
  max_tx_value: string;
  spent_today: string;
  last_reset: number;
  paused: boolean;
  balance: string;
  network: string;
}

/** Balance info returned by GET /api/balance */
export interface BalanceInfo {
  balance: string;
  balance_usdc: string;
  last_updated: string;
}

/** Single transaction event */
export interface TransactionEvent {
  id: string;
  type: string;
  timestamp: string;
  merchant: string;
  amount: string;
  spent_today: string;
  tx_hash: string;
  ledger: number;
  status: "settled" | "blocked" | "pending";
  stellar_expert_url: string;
}

/** Paginated transaction result */
export interface TransactionResult {
  transactions: TransactionEvent[];
  cursor: string;
  total_count: number;
}

/** Result from a contract mutation */
export interface TxResult {
  tx_hash: string;
  [key: string]: unknown;
}

/** Single step in the x402 agent flow */
export interface DemoStepResult {
  step: string;
  status: number | string;
  price?: string;
  tx_hash?: string;
  settlement_time_ms?: number;
  data?: string;
  error?: string;
}

/** Result from running the full agent cycle */
export interface AgentResult {
  success: boolean;
  steps: DemoStepResult[];
  error?: string;
}

/** Budget check result (dry-run) */
export interface BudgetCheck {
  allowed: boolean;
  reason: string;
  checks: {
    paused: boolean;
    within_max_tx: boolean;
    within_daily_limit: boolean;
    sufficient_balance: boolean;
  };
}

/** Result from a paid resource request */
export interface PaymentResult {
  success: boolean;
  data: string | null;
  tx_hash: string | null;
  settlement_time_ms: number;
  steps: DemoStepResult[];
}

/** Daily spending summary */
export interface SpendingReport {
  daily_limit_usdc: string;
  spent_today_usdc: string;
  remaining_usdc: string;
  utilization_pct: number;
  paused: boolean;
  balance_usdc: string;
}

/** SDK client configuration */
export interface SpendGuardConfig {
  /** Base URL of the SpendGuard API (e.g. "https://your-app.railway.app") */
  apiUrl: string;
  /** Admin API key for protected endpoints (Bearer token) */
  apiKey?: string;
  /** Owner Stellar address for admin auth via X-Stellar-Address header */
  stellarAddress?: string;
}

/** API error response */
export interface ApiError {
  error: string;
  code: string;
}
