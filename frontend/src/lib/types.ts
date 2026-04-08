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
  contract_address?: string;
}

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

export interface BalanceInfo {
  balance: string;
  balance_usdc: string;
  last_updated: string;
}

export interface DemoStepResult {
  step: string;
  status: number | string;
  price?: string;
  tx_hash?: string;
  settlement_time_ms?: number;
  data?: string;
  error?: string;
}
