const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Auth address for admin endpoints (set by pages that need admin access)
let _authAddress: string | null = null;

export function setAuthAddress(address: string | null) {
  _authAddress = address;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  // Send Stellar address for admin auth when available
  if (_authAddress) {
    headers["X-Stellar-Address"] = _authAddress;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Dashboard
export const getStatus = () =>
  request<import("./types").ContractStatus>("/api/status");

export const getTransactions = (limit = 50, cursor?: string) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return request<{
    transactions: import("./types").TransactionEvent[];
    cursor: string;
    total_count: number;
  }>(`/api/transactions?${params}`);
};

export const getBalance = () =>
  request<import("./types").BalanceInfo>("/api/balance");

// Admin
export const setDailyLimit = (daily_limit: number) =>
  request("/api/admin/set-limit", {
    method: "POST",
    body: JSON.stringify({ daily_limit }),
  });

export const setMaxTx = (max_tx_value: number) =>
  request("/api/admin/set-max-tx", {
    method: "POST",
    body: JSON.stringify({ max_tx_value }),
  });

export const whitelistMerchant = (merchant: string) =>
  request("/api/admin/whitelist", {
    method: "POST",
    body: JSON.stringify({ merchant }),
  });

export const removeMerchant = (merchant: string) =>
  request("/api/admin/remove-merchant", {
    method: "POST",
    body: JSON.stringify({ merchant }),
  });

export const pauseContract = () =>
  request("/api/admin/pause", { method: "POST", body: "{}" });

export const unpauseContract = () =>
  request("/api/admin/unpause", { method: "POST", body: "{}" });

export const topUp = (amount: number) =>
  request("/api/admin/top-up", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });

// Stripe (test mode)
export const simulatePayment = (amount_usd: number) =>
  request("/api/stripe/simulate-payment", {
    method: "POST",
    body: JSON.stringify({ amount_usd }),
  });

// Demo
export const runAgent = () =>
  request<{
    success: boolean;
    steps: import("./types").DemoStepResult[];
    error?: string;
  }>("/api/demo/run-agent", { method: "POST", body: "{}" });
