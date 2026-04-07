# @spendguard/sdk

TypeScript SDK for **SpendGuard** — governed AI agent spending on Stellar.

## Install

```bash
npm install @spendguard/sdk
```

## Quick Start

### Read contract status (no auth)

```typescript
import { SpendGuardClient } from "@spendguard/sdk";

const client = new SpendGuardClient({
  apiUrl: "https://your-backend.railway.app",
});

const status = await client.getStatus();
console.log(`Balance: $${status.balance}`);
console.log(`Spent today: ${status.spent_today}`);
console.log(`Paused: ${status.paused}`);
```

### AI Agent — pay for a resource via x402

```typescript
import { SpendGuardAgent } from "@spendguard/sdk";

const agent = new SpendGuardAgent({
  apiUrl: process.env.SPENDGUARD_URL!,
});

// Check budget before paying
const budget = await agent.checkBudget(0.10, "GAUR...");
if (!budget.allowed) {
  console.log(`Blocked: ${budget.reason}`);
  process.exit(1);
}

// Full x402 cycle: request → 402 → pay → get data
const result = await agent.payForResource("https://api.example.com/weather");
console.log(result.data);         // "Sunny, 25°C"
console.log(result.tx_hash);      // "abc123..."
console.log(result.settlement_time_ms); // 4200
```

### Admin — manage spending policies

```typescript
import { SpendGuardClient } from "@spendguard/sdk";

const admin = new SpendGuardClient({
  apiUrl: "https://your-backend.railway.app",
  apiKey: process.env.ADMIN_API_KEY,
});

await admin.setDailyLimit(100);              // $100 USDC per day
await admin.setMaxTx(25);                    // $25 max per transaction
await admin.whitelistMerchant("GAURBKKJ..."); // Allow this merchant
await admin.pause();                          // Emergency stop
```

### Spending report

```typescript
const report = await agent.getSpendingReport();
// {
//   daily_limit_usdc: "100.00",
//   spent_today_usdc: "23.50",
//   remaining_usdc: "76.50",
//   utilization_pct: 24,
//   paused: false,
//   balance_usdc: "450.00"
// }
```

## API Reference

### `SpendGuardClient`

| Method | Auth | Description |
|--------|------|-------------|
| `getStatus()` | No | Contract state (owner, agent, limits, balance) |
| `getBalance()` | No | USDC balance via Soroban RPC |
| `getTransactions(limit?, cursor?)` | No | Paginated audit log |
| `setDailyLimit(usdc)` | Yes | Set daily spending cap |
| `setMaxTx(usdc)` | Yes | Set per-transaction cap |
| `whitelistMerchant(address)` | Yes | Add merchant to whitelist |
| `removeMerchant(address)` | Yes | Remove from whitelist |
| `pause()` | Yes | Emergency pause |
| `unpause()` | Yes | Resume operations |
| `topUp(usdc)` | Yes | Deposit USDC |
| `runAgent(url?)` | No | Run x402 payment cycle |

### `SpendGuardAgent`

| Method | Description |
|--------|-------------|
| `payForResource(url)` | Full x402 cycle with payment |
| `checkBudget(amount, merchant)` | Dry-run policy check |
| `getSpendingReport()` | Daily spending summary |

### Utilities

| Function | Description |
|----------|-------------|
| `stroopsToUsdc(stroops)` | Convert stroops to USDC string |
| `usdcToStroops(usdc)` | Convert USDC to stroops integer |
| `shortAddress(address)` | Truncate Stellar address |

## License

Apache 2.0 — DeegaLabs
