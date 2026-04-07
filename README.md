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

Deployed on **Stellar Testnet**.

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

## Frontend (4 screens)

| Screen | Purpose |
|--------|---------|
| **Dashboard** | Balance, spend velocity bar, x402 agent demo terminal |
| **Agent Vault** | Daily limit, max tx, merchant whitelist, kill switch |
| **Liquidity** | USDC deposit via Stripe (Test Mode) |
| **Audit Log** | Transaction table with Stellar Expert links, system metadata stream |

## Stack

| Layer | Technology |
|-------|-----------|
| Contract | Rust + Soroban SDK v22 |
| Backend | Node.js + TypeScript + Express + @stellar/stellar-sdk v15 |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Network | Stellar Testnet |
| Wallet | Freighter (auth-entry signing) |
| USDC | Stellar Asset Contract (SAC) — native Circle-issued |

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
| [ENVIRONMENT.md](docs/ENVIRONMENT.md) | All environment variables |
| [TRADE_OFFS.md](TRADE_OFFS.md) | In-scope vs out-of-scope |

## License

Apache 2.0 — see [LICENSE](LICENSE).

## Team

Built by [DeegaLabs](https://github.com/deegalabs).
