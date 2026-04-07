# SpendGuard SDK Specification

## Overview
A lightweight TypeScript SDK that lets developers interact with the SpendGuard
contract and API from any Node.js or browser environment. Designed for AI agent
developers who want to integrate governed spending into their agents.

## Package
- Name: `@spendguard/sdk`
- Runtime: Node.js 18+ / Browser (ESM)
- Zero heavy dependencies (only `@stellar/stellar-sdk` as peer)

## Core Classes

### `SpendGuardClient`
Main entry point. Wraps the SpendGuard REST API.

```typescript
const client = new SpendGuardClient({
  apiUrl: "https://your-backend.railway.app",
  apiKey?: string,           // Optional: for admin endpoints
  stellarAddress?: string,   // Optional: for admin auth via X-Stellar-Address
});
```

#### Dashboard Methods (read-only, no auth)
- `getStatus(): Promise<ContractStatus>` — contract state
- `getBalance(): Promise<BalanceInfo>` — USDC balance
- `getTransactions(limit?, cursor?): Promise<TransactionResult>` — audit log

#### Admin Methods (require auth)
- `setDailyLimit(usdcAmount: number): Promise<TxResult>`
- `setMaxTx(usdcAmount: number): Promise<TxResult>`
- `whitelistMerchant(address: string): Promise<TxResult>`
- `removeMerchant(address: string): Promise<TxResult>`
- `pause(): Promise<TxResult>`
- `unpause(): Promise<TxResult>`
- `topUp(usdcAmount: number): Promise<TxResult>`

#### Agent Methods (no auth — agent signs via contract)
- `runAgent(targetUrl?: string): Promise<AgentResult>`

### `SpendGuardAgent`
High-level agent helper for x402 flows.

```typescript
const agent = new SpendGuardAgent({
  apiUrl: "https://your-backend.railway.app",
});

// Full x402 cycle: request → 402 → pay → retry
const result = await agent.payForResource("https://api.example.com/data");
```

#### Methods
- `payForResource(url: string): Promise<PaymentResult>` — full x402 cycle
- `checkBudget(amount: number, merchant: string): Promise<BudgetCheck>` — dry-run
- `getSpendingReport(): Promise<SpendingReport>` — daily summary

## Types
All types mirror the backend `types.ts` + API responses.

## Utilities
- `stroopsToUsdc(stroops: string | number): string`
- `usdcToStroops(usdc: number): number`
- `shortAddress(address: string): string`

## Usage Examples

### AI Agent Integration
```typescript
import { SpendGuardAgent } from "@spendguard/sdk";

const agent = new SpendGuardAgent({ apiUrl: process.env.SPENDGUARD_URL });

// Before making a paid API call
const budget = await agent.checkBudget(0.10, "GAUR...");
if (budget.allowed) {
  const result = await agent.payForResource("https://weather-api.com/forecast");
  console.log(result.data); // Weather data
}
```

### Dashboard Widget
```typescript
import { SpendGuardClient } from "@spendguard/sdk";

const client = new SpendGuardClient({ apiUrl: "/api" });
const status = await client.getStatus();
console.log(`Spent: $${status.spent_today_usdc} / $${status.daily_limit_usdc}`);
```

### Admin CLI Script
```typescript
import { SpendGuardClient } from "@spendguard/sdk";

const admin = new SpendGuardClient({
  apiUrl: "https://backend.railway.app",
  apiKey: process.env.ADMIN_API_KEY,
});

await admin.setDailyLimit(100);  // $100 USDC
await admin.whitelistMerchant("GAURBKKJ...");
```
