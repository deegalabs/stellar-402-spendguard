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

export interface X402Challenge {
  x402Version: number;
  accepts: X402Accept[];
  description: string;
}

export interface X402Accept {
  scheme: string;
  network: string;
  price: string;
  payTo: string;
  facilitator: string;
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

export interface ApiError {
  error: string;
  code: string;
}
