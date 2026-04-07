# MCP Server Specification — SpendGuard

Model Context Protocol (MCP) server that exposes SpendGuard's governed payment
capabilities as tools for AI agents. Aligns with the SDF roadmap for "MCP
integration for agents to discover paid resources and authorize payments via
smart wallets with spending policies."

---

## Why MCP

The SDF blog post on x402's future describes:
> "MCP integration for agents to discover paid resources and authorize payments
> via smart wallets with spending policies defined by the user"

SpendGuard IS the smart wallet with spending policies. This MCP server makes
it discoverable by any MCP-compatible AI agent (Claude, GPT, custom agents).

---

## Transport

**Stdio** — the MCP server runs as a subprocess spawned by the AI agent's host
process. Communication via stdin/stdout using JSON-RPC 2.0 (MCP standard).

---

## Tools

### 1. `spendguard_get_status`

Read current contract state. No auth required.

**Parameters:** none

**Returns:**
```json
{
  "owner": "G...OWNER",
  "agent": "G...AGENT",
  "daily_limit": "100000000",
  "daily_limit_usdc": "10.00",
  "max_tx_value": "50000000",
  "max_tx_value_usdc": "5.00",
  "spent_today": "23000000",
  "spent_today_usdc": "2.30",
  "remaining_today_usdc": "7.70",
  "last_reset": 1744200000,
  "paused": false,
  "balance": "450000000",
  "balance_usdc": "45.00"
}
```

**Use case:** Agent checks remaining budget before deciding whether to make a
payment. Enables budget-aware decision making.

---

### 2. `spendguard_authorize_payment`

Execute a governed x402 payment through the BudgetGuard contract. The contract
enforces all spending policies (daily limit, max tx, merchant whitelist, pause
state) on-chain.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `amount` | string | yes | Amount in USDC (e.g. "1.50"), converted to stroops internally |
| `merchant` | string | yes | Merchant Stellar address (G...) |

**Returns (success):**
```json
{
  "success": true,
  "tx_hash": "abc123...",
  "amount_usdc": "1.50",
  "merchant": "G...MERCHANT",
  "spent_today_usdc": "3.80",
  "remaining_today_usdc": "6.20",
  "stellar_expert_url": "https://stellar.expert/explorer/testnet/tx/abc123..."
}
```

**Returns (blocked by policy):**
```json
{
  "success": false,
  "error": "ExceedsMaxTx",
  "message": "Payment of $1.50 exceeds max per-transaction limit of $1.00",
  "suggestion": "Request a smaller amount or ask the owner to increase max_tx_value"
}
```

**Use case:** Agent pays for an x402-protected API resource. The contract
validates all policies and executes the USDC transfer. The agent CANNOT bypass
limits even if compromised.

---

### 3. `spendguard_get_transactions`

Read recent transaction history from the contract's audit log.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `limit` | number | no | Number of transactions (default: 10, max: 50) |

**Returns:**
```json
{
  "transactions": [
    {
      "type": "payment_authorized",
      "timestamp": "2026-04-10T14:22:01Z",
      "amount_usdc": "0.10",
      "merchant": "G...MERCHANT",
      "tx_hash": "abc123...",
      "status": "settled",
      "stellar_expert_url": "https://stellar.expert/explorer/testnet/tx/abc123..."
    }
  ],
  "total": 17
}
```

**Use case:** Agent reviews its own spending history. Useful for agents that
need to track expenses or generate reports.

---

### 4. `spendguard_check_budget`

Quick check whether a specific payment amount would be allowed by current
policies. Does NOT execute a transaction.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `amount` | string | yes | Amount in USDC (e.g. "2.50") |
| `merchant` | string | yes | Merchant Stellar address (G...) |

**Returns:**
```json
{
  "allowed": true,
  "reason": "Payment of $2.50 to G...MERCHANT is within all policy limits",
  "checks": {
    "paused": false,
    "within_max_tx": true,
    "within_daily_limit": true,
    "sufficient_balance": true
  }
}
```

**Use case:** Agent performs a dry-run check before committing to a payment.
Avoids failed transactions and wasted fees.

---

## Tools NOT Exposed

Admin tools (set_daily_limit, whitelist_merchant, emergency_pause, etc.) are
intentionally NOT exposed via MCP. The agent should NEVER have access to admin
functions — this is a core security invariant of SpendGuard.

The owner manages policies via the frontend dashboard or direct contract calls.

---

## Error Handling

All tools return structured errors:

```json
{
  "success": false,
  "error": "ContractPaused",
  "message": "Human-readable explanation",
  "suggestion": "What the agent should do next"
}
```

| Error Code | Suggestion |
|-----------|-----------|
| `ContractPaused` | Wait for owner to unpause, or contact owner |
| `ExceedsDailyLimit` | Wait until daily reset, or request smaller amount |
| `ExceedsMaxTx` | Request smaller amount, or ask owner to increase limit |
| `MerchantNotWhitelisted` | Ask owner to whitelist this merchant |
| `InsufficientBalance` | Ask owner to top up the contract |

---

## File Structure

```
backend/src/mcp/
├── server.ts        # MCP server setup and tool registration
├── tools.ts         # Tool handler implementations
└── index.ts         # Entry point (stdio transport)
```

---

## Configuration

The MCP server reads the same `.env` as the backend:

```
CONTRACT_ADDRESS=CCABMNFY3VKK7BI3YBWXJEE2EXX2NW5S573NASTCFXA6KBXR5PDWFD6E
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
AGENT_SECRET_KEY=S...  # Required for authorize_payment
```

---

## Usage with Claude Code / AI Agents

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "spendguard": {
      "command": "node",
      "args": ["path/to/backend/dist/mcp/index.js"]
    }
  }
}
```

The agent can then call `spendguard_get_status` to check budget,
`spendguard_check_budget` for dry-run validation, and
`spendguard_authorize_payment` to execute governed payments.
