# Architecture Decision Records

Each ADR documents a technical decision, the alternatives considered, and the
consequences. These records are immutable — if a decision is reversed, a new
ADR supersedes the old one rather than editing it.

---

## ADR-001: Soroban Custom Account vs. Exposing Agent Private Key

**Status:** Accepted

**Context:**
The agent needs to pay merchants autonomously via x402. The simplest approach
is giving the agent a funded Stellar keypair and letting it sign USDC transfers
directly. The alternative is using a Soroban contract as an intermediary that
holds the funds and authorizes transfers based on policies.

**Options considered:**
1. **Agent holds funded keypair** — simple, fast to implement. Risk: if the agent
   is compromised, all funds are exposed. No spending limits enforceable on-chain.
2. **Soroban Custom Account contract** — agent invokes the contract, contract
   validates policies and executes the transfer internally via SAC. Agent never
   touches fund keys.

**Decision:** Option 2 — Soroban Custom Account.

**Consequences:**
- (+) Agent compromise does not expose funds beyond the daily limit
- (+) Spending policies are enforced on-chain, not in application code
- (+) This is the core "why Stellar" argument — no other chain offers this natively
- (-) More complex implementation: contract must handle SAC interactions
- (-) Agent must build Soroban transactions instead of simple token transfers

---

## ADR-002: Ledger Timestamp for Daily Reset vs. External Cron Job

**Status:** Accepted

**Context:**
`spent_today` must reset to zero every 24 hours. Soroban has no native timers
or cron jobs — a contract cannot "wake up" on its own.

**Options considered:**
1. **External cron job** — a backend process calls `reset_daily()` on the contract
   every 24 hours. Simple but introduces an off-chain dependency.
2. **Lazy reset via ledger timestamp** — on each `authorize_payment` call, compare
   `env.ledger().timestamp()` with `last_reset_timestamp`. If delta > 86400 seconds,
   reset `spent_today` to 0 within the same transaction.

**Decision:** Option 2 — lazy reset via ledger timestamp.

**Consequences:**
- (+) Fully on-chain, no external dependencies
- (+) More impressive for hackathon judges — demonstrates Soroban knowledge
- (+) Reset is atomic with the payment authorization
- (-) If no payments happen for > 24h, the reset only fires on the next call
- (-) Edge case at exactly 86400s boundary must be tested carefully

---

## ADR-003: USDC SAC vs. Custom Token Contract

**Status:** Accepted

**Context:**
The contract needs to hold and transfer USDC. Two approaches: interact with the
existing Circle-issued USDC via its Stellar Asset Contract (SAC), or deploy a
custom token contract for the hackathon.

**Options considered:**
1. **Custom token contract** — full control, simpler testing. But not real USDC,
   and judges will notice.
2. **USDC SAC (native)** — real Circle-issued USDC on Stellar, wrapped for Soroban
   via the standard SAC interface. Production-grade.

**Decision:** Option 2 — USDC SAC.

**Consequences:**
- (+) Real USDC, not a mock token — credibility with judges
- (+) SAC enforces balance constraints (no negative balances)
- (+) Compatible with the Built on Stellar Facilitator
- (-) Testnet USDC must be obtained (Friendbot or faucet)
- (-) SAC API surface must be understood correctly

---

## ADR-004: Stripe Checkout Test Mode vs. Real MPP Integration

**Status:** Accepted

**Context:**
The hackathon requires demonstrating a fiat-to-crypto on-ramp. Stripe MPP
(Machine Payments Protocol) launched in March 2026 and is in early access.
A real integration would require production Stripe access and a real
fiat-to-USDC bridge.

**Options considered:**
1. **Real Stripe MPP integration** — production-grade but not achievable in 8 days.
   The stellar-mpp-payments-skill (ASGCompute) exists as reference but is not a
   production SDK.
2. **Stripe Checkout Test Mode** — simulates the flow: user pays with test card,
   webhook fires, backend calls `top_up()` on the contract. Clearly labeled as
   simulation.

**Decision:** Option 2 — Stripe Checkout Test Mode.

**Consequences:**
- (+) Achievable in hackathon timeline
- (+) Demonstrates the architectural intent without false claims
- (+) Test card 4242 4242 4242 4242 makes the demo reproducible
- (-) Must be declared explicitly as simulation in README and every UI element
- (-) Judges may discount this — mitigated by honest documentation

---

## ADR-005: Kill Switch Scope — New Authorizations Only

**Status:** Accepted

**Context:**
The owner needs an emergency mechanism to stop all agent spending immediately.
The question is: can the kill switch cancel transactions already submitted to
the Stellar ledger?

**Options considered:**
1. **Claim full revocation** — market it as "stops everything." Technically false.
   Once a transaction achieves ledger finality, it is irreversible on any blockchain.
2. **Honest scope** — kill switch blocks all new `authorize_payment` calls. Transactions
   already submitted and in-flight are unaffected by design.

**Decision:** Option 2 — honest scope.

**Consequences:**
- (+) Technically accurate — builds credibility with SDF judges
- (+) Ledger finality is a feature of blockchain, not a bug
- (+) The kill switch still provides real protection: the window of exposure is
  limited to transactions in the last ~5 seconds (settlement time)
- (-) The demo must explain this honestly, not gloss over it

---

## ADR-006: Single Agent per Contract vs. Multi-Agent Support

**Status:** Accepted

**Context:**
Should one BudgetGuard contract support multiple agents with individual limits,
or should each agent have its own contract instance?

**Options considered:**
1. **Multi-agent** — one contract, multiple agent addresses, each with their own
   spending limits and whitelists. More efficient for production but significantly
   more complex storage and access control.
2. **Single agent** — one contract, one agent. Simple storage model, clear access
   control, faster to implement and test.

**Decision:** Option 2 — single agent per contract.

**Consequences:**
- (+) Simpler storage: flat keys instead of nested maps
- (+) Simpler access control: `agent.require_auth()` with one address
- (+) Sufficient for hackathon demonstration
- (-) Production use would require deploying N contracts for N agents
- (-) Architecture supports migration to multi-agent without breaking changes
  (DataKey enum can be extended, storage can be namespaced)

---

## ADR-007: Whitelist as Map<Address, bool> vs. List with Metadata

**Status:** Accepted

**Context:**
The merchant whitelist needs to validate that a `payTo` address is approved
before any payment. Two data structures are viable.

**Options considered:**
1. **Vec<Address>** — simple list, O(n) lookup. Cannot store metadata per merchant.
2. **Map<Address, bool>** — constant-time lookup, can be extended to
   Map<Address, MerchantInfo> later without breaking changes.
3. **Map<Address, MerchantInfo>** — includes metadata like name, URL, per-merchant
   limits. More powerful but more complexity for the hackathon.

**Decision:** Option 2 — Map<Address, bool>.

**Consequences:**
- (+) O(1) lookup performance
- (+) Easy to extend to Map<Address, MerchantInfo> post-hackathon
- (+) Simple to test: `whitelist.get(merchant).unwrap_or(false)`
- (-) No per-merchant metadata in MVP (acceptable for hackathon scope)
