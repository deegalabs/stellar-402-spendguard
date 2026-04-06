# Trade-Offs

What is in scope for the hackathon MVP (April 13, 2026) and what was
deliberately excluded — with rationale for each decision.

---

## In Scope (Will Be Built and Demonstrated)

| Feature | Technical Justification |
|---------|------------------------|
| BudgetGuard Soroban contract | Core product — spending policy enforcement on-chain |
| Daily spending limit with lazy reset | Demonstrates Soroban timestamp usage, fully on-chain |
| Max transaction value | Prevents single large unauthorized payments |
| Merchant whitelist (Map<Address, bool>) | Restricts which addresses can receive payments |
| Emergency kill switch (pause/unpause) | Critical safety feature, most dramatic demo moment |
| On-chain event emission | Required for Audit Log and institutional transparency |
| x402 agent flow (end-to-end) | The complete 402 → pay → receive cycle on testnet |
| Stripe Test Mode on-ramp | Simulates fiat → USDC deposit, clearly labeled |
| Frontend dashboard (4 screens) | Governance UI: onboarding, agent vault, audit log, liquidity |
| Freighter wallet integration | Owner signs admin transactions via browser extension |
| Contract deployed on Stellar Testnet | Live, verifiable, with Stellar Expert links |
| TDD with 37+ destructive tests | Red-green-refactor cycle visible in git history |
| Open-source (Apache 2.0) | Required by SCF for any Soroban contract project |

---

## Out of Scope (Deliberately Excluded)

| Feature | Why Excluded | Future Path |
|---------|-------------|-------------|
| **Multi-agent per contract** | Requires nested storage maps and per-agent access control — adds significant complexity without changing the core demonstration. See ADR-006. | Extend DataKey enum with agent-namespaced keys. No breaking changes to existing functions. |
| **Agent reputation scoring** | Was in the original SAGLB spec but has no on-chain mechanism defined. Including it would be a mock with no real backing. | Add as a separate oracle contract that BudgetGuard reads during authorization. |
| **Real Stripe MPP integration** | MPP launched March 2026 and is in early access. No production SDK exists for Stellar. See ADR-004. | Replace Stripe Checkout webhook with MPP session-based flow when SDK stabilizes. |
| **Mainnet deployment** | Requires funded accounts with real USDC. Testnet demonstrates all technical capabilities identically. | Change network config in ENVIRONMENT.md. Contract code is network-agnostic. |
| **Auto-refill autonomous logic** | Requires continuous balance monitoring (cron or event listener) plus automatic Stripe charges — production complexity that adds demo risk. | Backend cron job monitors SAC balance via Horizon, triggers Stripe charge when below threshold. |
| **Rate limiting beyond daily total** | Per-hour, per-minute, or per-merchant limits add storage complexity without changing the core governance story. | Add rate_limit fields to storage, check in authorize_payment before daily_limit check. |
| **Channel mode (one-way payment channels)** | The stellar-mpp-payments-skill describes high-frequency payment channels. Implementing both charge mode and channel mode exceeds hackathon scope. | Add channel_open/channel_close functions to contract. Requires state channel logic. |
| **Multi-sig owner** | Single owner keypair is sufficient for demo. Multi-sig adds Soroban custom auth complexity. | Implement owner as a Soroban custom account with M-of-N signature requirements. |
| **Mobile responsive UI** | Desktop-first for hackathon demo video. Responsive adds CSS complexity without demo value. | Standard Tailwind responsive breakpoints. Layout already uses grid. |
