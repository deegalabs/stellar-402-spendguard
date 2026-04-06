# CLAUDE.md — Stellar 402 SpendGuard

## Project Context
SpendGuard is a Soroban spending-policy contract that governs x402 payments
made by AI agents on the Stellar network. Built for the Stellar Hacks: Agents
hackathon (SDF). Deadline: April 13, 2026. Prize pool: $10,000 USD.

## Absolute Rule
DO NOT write any implementation file (.rs, .ts, .tsx) without the
corresponding spec file in docs/ existing and being complete.
Order: spec → tests → implementation. Never the reverse.

## Stack
- Contract: Rust + Soroban SDK v22
- Backend: Node.js + TypeScript + @stellar/stellar-sdk + @x402/stellar
- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Network: Stellar Testnet
- Wallet: Freighter (auth-entry signing)
- Facilitator: Built on Stellar (OpenZeppelin Relayer)
- USDC: Stellar Asset Contract (SAC) native — not bridged

## Testing Philosophy (Destructive TDD)
Tests are written BEFORE implementation.
Tests MUST FAIL on first run — that is the point.
A test that passes without implementation is documentation, not a test.
Priority: boundary cases, invariant violations, attack simulations.
Never write tests that only confirm the happy path.

### Three Test Categories
1. **Boundary tests** — test at exact limits (daily_limit, daily_limit+1, daily_limit-1)
2. **Invariant violation tests** — directly attempt to break each invariant from INVARIANTS.md
3. **Attack simulation tests** — one test per vector from ATTACK_VECTORS.md

## Reference Documents (read before any task)
- docs/ARCHITECTURE.md — system overview
- docs/DECISIONS.md — ADRs with trade-offs
- contracts/budget-guard/SPEC.md — formal contract specification
- contracts/budget-guard/INVARIANTS.md — inviolable properties
- contracts/budget-guard/ATTACK_VECTORS.md — attack vectors for tests
- docs/TEST_STRATEGY.md — testing philosophy and categories
- backend/API_SPEC.md — API contracts
- backend/AGENT_SPEC.md — x402 agent specification

## Directory Structure
```
stellar-402-spendguard/
├── CLAUDE.md
├── TRADE_OFFS.md
├── LICENSE (Apache 2.0)
├── README.md
├── contracts/
│   └── budget-guard/
│       ├── SPEC.md
│       ├── INVARIANTS.md
│       ├── ATTACK_VECTORS.md
│       └── src/
├── backend/
│   ├── API_SPEC.md
│   ├── AGENT_SPEC.md
│   └── src/
├── frontend/
│   └── src/
└── docs/
    ├── ARCHITECTURE.md
    ├── DECISIONS.md
    ├── TEST_STRATEGY.md
    ├── ENVIRONMENT.md
    ├── GLOSSARY.md
    ├── DEVELOPMENT_PLAN.md
    └── DEMO_SCRIPT.md
```

## Code Conventions
- Rust: snake_case, explicit errors via Result<T, Error>, no unwrap() in production
- TypeScript: strict mode, no `any`, interfaces for all public types
- Commits: type(scope): description in English (feat/docs/test/fix)

## What NOT To Do
- Do not use unwrap() in the Soroban contract — use Result and the Error enum
- Do not hardcode testnet addresses — use ENVIRONMENT.md + .env
- Do not write tests that only verify the happy path
- Do not implement features outside TRADE_OFFS.md without discussion
- Do not use `any` in TypeScript
