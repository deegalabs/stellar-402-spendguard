# SpendGuard — Stellar x402 Spending Policy Engine

> The spending-policy contract that was missing for x402 agents on Stellar.

SpendGuard is a Soroban smart contract that governs how AI agents spend USDC via the x402 protocol on Stellar. The owner sets spending rules (daily limits, per-transaction caps, merchant whitelists) and retains an emergency kill switch — the agent can only spend within those boundaries, enforced entirely on-chain.

**Built for [Stellar Hacks: Agents](https://dorahacks.io/) — April 2026**

---

## The Problem

AI agents that make autonomous HTTP payments (x402) need guardrails. Without on-chain spending policies, an agent with access to funds can:

- Overspend in a single day
- Pay unauthorized merchants
- Drain the entire balance on a single expensive call

Current solutions rely on off-chain rate limiting, which can be bypassed if the agent process is compromised.

## Why Stellar

| Feature | How SpendGuard Uses It |
|---------|----------------------|
| **Soroban Custom Account** | Contract holds USDC and authorizes transfers internally — agent never touches fund keys |
| **USDC SAC (native)** | Circle-issued USDC on Stellar, not bridged — `token::Client` for direct transfers |
| **< 5s finality** | Real-time payment settlement for x402 request-response flow |
| **$0.0001 fees** | Micro-payments viable — $0.10 API calls are economically rational |
| **Auth Entry signing** | Agent signs contract invocations, not raw token transfers |

## Architecture

```
Agent (Node.js) ──► Merchant API ──► HTTP 402
       │                                │
       │ authorize_payment(price, merchant)
       ▼                                │
BudgetGuard Contract ◄─────────────────┘
       │
       │ validates: paused? whitelist? limits? balance?
       │ executes: USDC_SAC.transfer(contract → merchant)
       ▼
Stellar Ledger (< 5s finality)
```

## Contract: BudgetGuard

Deployed on **Stellar Testnet**: [`CCABMNFY3VKK7BI3YBWXJEE2EXX2NW5S573NASTCFXA6KBXR5PDWFD6E`](https://stellar.expert/explorer/testnet/contract/CCABMNFY3VKK7BI3YBWXJEE2EXX2NW5S573NASTCFXA6KBXR5PDWFD6E)

### Functions

| Function | Caller | Description |
|----------|--------|-------------|
| `initialize` | Owner | Set owner, agent, USDC token, limits |
| `authorize_payment` | Agent | Validate and execute a USDC payment |
| `set_daily_limit` | Owner | Update daily spending cap |
| `set_max_tx` | Owner | Update per-transaction cap |
| `whitelist_merchant` | Owner | Add merchant to allowed list |
| `remove_merchant` | Owner | Remove merchant from allowed list |
| `emergency_pause` | Owner | Halt all new payments immediately |
| `emergency_unpause` | Owner | Resume payment processing |
| `top_up` | Owner | Deposit USDC into the contract |
| `set_agent` | Owner | Change the authorized agent address |
| `get_status` | Any | Read current contract state |

### Invariants (12)

All enforced on-chain — see [INVARIANTS.md](contracts/budget-guard/INVARIANTS.md):

- `spent_today` never exceeds `daily_limit`
- No transfers when paused
- Daily reset only after > 86400 seconds (lazy, no cron)
- Only whitelisted merchants receive payments
- Only owner can call admin functions
- Only agent can call `authorize_payment`
- Zero-amount payments rejected
- Balance never goes negative
- Contract initializes exactly once
- `max_tx_value` <= `daily_limit`

### Tests

37 destructive TDD tests across 3 categories:

- **13 boundary tests** — exact limits, off-by-one, edge values
- **12 invariant violation tests** — one per invariant
- **12 attack simulation tests** — replay, overflow, unauthorized caller, timestamp manipulation

```bash
cd contracts/budget-guard
cargo test
# 37 passed, 0 failed
```

## Target Users

- **Stellar dApp developers** deploying x402 agents that need governed payment flows
- **Enterprises** using Stellar for agent-based commerce who require spending controls and audit trails
- **OpenClaw skill developers** building MCP tools that need on-chain payment authorization
- **Any team** building autonomous agents on Stellar that must comply with internal spending policies

SpendGuard is infrastructure — a public good primitive that other projects can fork, deploy, and extend. The SDF's own blog describes "smart wallets with spending policies" as [the next step for x402 on Stellar](https://stellar.org/blog/developers/x402-payment-protocol-meets-stellar).

## Frontend (6 screens + docs site)

| Screen | Purpose |
|--------|---------|
| **Dashboard** | Balance, spend velocity bar, x402 agent demo terminal |
| **Agent Vault** | Daily limit, max tx, merchant whitelist, kill switch |
| **Liquidity** | USDC deposit via Stripe (Test Mode) |
| **Audit Log** | Transaction table with Stellar Expert links, system metadata stream |
| **Live Demo** | 11-step interactive flow executing real testnet transactions |
| **Docs** | 9-page documentation site with sidebar (Getting Started, Guides, Reference) |

## Stack

| Layer | Technology |
|-------|-----------|
| Contract | Rust + Soroban SDK v22 |
| Backend | Node.js + TypeScript + Express + @stellar/stellar-sdk v15 |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Network | Stellar Testnet |
| Wallet | Freighter (auth-entry signing) |
| USDC | Stellar Asset Contract (SAC) — native Circle-issued |
| MCP Server | Model Context Protocol — AI agent tool integration |
| API Docs | Swagger/OpenAPI 3.0 at `/api/docs` |
| x402 Middleware | Reusable Express middleware for x402 paywalls |

## API Documentation

Interactive Swagger UI available at `http://localhost:3001/api/docs` when the backend is running. OpenAPI 3.0 spec at `/api/openapi.json`.

All endpoints are documented with request/response schemas, example values, and error codes. Judges and developers can test endpoints directly from the browser.

## x402 Express Middleware

Reusable middleware for any Express app to add SpendGuard-governed x402 paywalls:

```typescript
import { x402Paywall } from "./middleware/x402-spendguard.js";

app.get("/api/premium-data", x402Paywall({
  price: "0.10",          // USDC
  merchant: "GAURB...",   // Stellar address
  description: "Premium weather data",
}), (req, res) => {
  res.json({ data: "premium content" });
});
```

Returns HTTP 402 with x402 challenge to unpaid requests. Validates payment proofs against the Stellar network. See [middleware source](backend/src/middleware/x402-spendguard.ts).

## MCP Integration

SpendGuard exposes 4 tools via the [Model Context Protocol](https://modelcontextprotocol.io), allowing any MCP-compatible AI agent (Claude, GPT, custom agents) to make governed payments on Stellar.

| Tool | Description |
|------|-------------|
| `spendguard_get_status` | Read contract state: balance, limits, pause status |
| `spendguard_authorize_payment` | Execute a governed USDC payment (policies enforced on-chain) |
| `spendguard_check_budget` | Dry-run check if a payment would be allowed |
| `spendguard_get_transactions` | Read audit log with Stellar Expert links |

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

See [MCP_SPEC.md](backend/MCP_SPEC.md) for full specification.

## Quick Start

### Prerequisites

- Rust + `wasm32-unknown-unknown` target
- Node.js 20+
- Freighter browser extension (set to Testnet)

### Contract

```bash
cd contracts/budget-guard
cargo build --target wasm32-unknown-unknown --release
cargo test
```

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your keys (see docs/ENVIRONMENT.md)
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### Seed Demo Data

```bash
cd backend
npm run seed
# Creates 17 transactions on testnet
```

## Limitations (Honest)

- **Stripe is simulated** — Test Mode only, no real fiat on-ramp. Clearly labeled throughout the UI.
- **Single agent** — One authorized agent address per contract instance. Multi-agent support is out of scope.
- **No multi-sig** — Owner is a single Stellar keypair. Production would need multi-sig or MPC.
- **Kill switch scope** — `emergency_pause` blocks new authorizations only. In-flight transactions on the ledger are final (blockchain finality).
- **No off-chain fallback** — If Stellar is down, payments halt. No retry queue.
- **Testnet only** — Not audited for mainnet deployment.

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System overview, component boundaries |
| [DECISIONS.md](docs/DECISIONS.md) | 7 ADRs with trade-offs |
| [SPEC.md](contracts/budget-guard/SPEC.md) | Formal contract specification |
| [INVARIANTS.md](contracts/budget-guard/INVARIANTS.md) | 12 inviolable properties |
| [ATTACK_VECTORS.md](contracts/budget-guard/ATTACK_VECTORS.md) | 10 attack vectors tested |
| [TEST_STRATEGY.md](docs/TEST_STRATEGY.md) | TDD philosophy and test categories |
| [API_SPEC.md](backend/API_SPEC.md) | All HTTP endpoints |
| [AGENT_SPEC.md](backend/AGENT_SPEC.md) | x402 agent specification |
| [MCP_SPEC.md](backend/MCP_SPEC.md) | MCP server tools for AI agents |
| [ENVIRONMENT.md](docs/ENVIRONMENT.md) | All environment variables |
| [TRADE_OFFS.md](TRADE_OFFS.md) | In-scope vs out-of-scope |

## Demo Video (2:30)

> Upload to YouTube and paste the link here before submission.

<!-- TODO: Replace with actual video URL -->
<!-- [![SpendGuard Demo](https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg)](https://youtu.be/VIDEO_ID) -->

Screen recording of the live app with voice narration:
1. **The Problem** — Why AI agents need on-chain spending guardrails
2. **Live Payment** — Real x402 payment settling on Stellar Testnet in ~5s
3. **Blocked Payment** — Contract rejects overspending on-chain
4. **Kill Switch** — Owner pauses all agent spending instantly
5. **Audit Log** — Immutable trail with Stellar Expert links
6. **Why Stellar** — Soroban Custom Accounts as the architectural moat
7. **Open Source** — Deploy your own instance in 10 minutes

See [VIDEO_SCRIPT.md](docs/VIDEO_SCRIPT.md) for the full narration script.

## Ecosystem Impact

SpendGuard removes the governance blocker that prevents enterprises from deploying autonomous agents on Stellar. Without on-chain spending policies, institutional adoption stalls — nobody deploys an agent with unlimited access to company funds.

**Volume projection:** If 100 agents deploy SpendGuard-style contracts, each executing 50 governed transactions/day at $0.50 average, that represents **$2,500/day in governed USDC volume** on Stellar — predictable, policy-compliant flow from institutional-grade spending controls.

The precompiled WASM is available as a [GitHub Release](https://github.com/deegalabs/stellar-402-spendguard/releases) — deploy your own instance in under 10 minutes. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full fork guide.

## Open Source

SpendGuard is released under Apache 2.0 and designed as a **public good primitive** for the Stellar ecosystem. We encourage teams to fork, deploy, and extend it for their own x402 agent spending policies. The contract, backend, and frontend are all open source with comprehensive documentation. See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and contribution guidelines.

## License

Apache 2.0 — see [LICENSE](LICENSE).

## Team

Built by [DeegaLabs](https://github.com/deegalabs).
