# Glossary

Precise definitions for every term used in the Stellar 402 SpendGuard project.
When a term appears in specs, tests, or code, it means exactly what is defined here.

---

## Agent
A **Node.js process** that autonomously makes HTTP requests to x402-protected
endpoints. It is NOT an AI model — it is a deterministic program that intercepts
HTTP 402 responses, requests payment authorization from the BudgetGuard contract,
and retries with payment proof. The agent holds its own Stellar keypair for
signing transactions but never holds private keys to the funds.

## Owner
The human or entity that deploys the BudgetGuard contract, funds it with USDC,
and configures spending policies. The owner controls administrative functions:
setting limits, managing the whitelist, and activating the kill switch. In the
hackathon context, the owner interacts via the frontend dashboard with Freighter.

## Merchant
Any Stellar address (G...) that receives x402 payments. A merchant operates an
API endpoint protected by the x402 payment middleware. The merchant address is
the `payTo` field in the HTTP 402 response headers. Only whitelisted merchants
can receive payments from the BudgetGuard contract.

## Spending Policy
The set of on-chain rules enforced by the BudgetGuard contract before any USDC
transfer is authorized. Policies include: daily spending limit, maximum value
per transaction, and merchant whitelist. Policies are immutable during execution —
they can only be changed by the owner through administrative functions.

## Auth Entry (Authorization Entry)
A Soroban-specific authorization mechanism. When a contract needs to perform an
action on behalf of an account (like transferring USDC), an auth entry is
included in the transaction. This is NOT a signature in the EVM sense — it is
a structured authorization that the Soroban runtime validates. The BudgetGuard
contract validates policies and then executes the USDC transfer internally,
so the agent's auth entry authorizes the contract invocation, not the token
transfer directly.

## Facilitator
The Built on Stellar Facilitator (OpenZeppelin Relayer) that abstracts blockchain
complexity for x402 payments. The facilitator receives signed transactions,
verifies payment proofs, broadcasts to the Stellar network, and confirms
settlement. On testnet, Coinbase facilitator is also available. The facilitator
is NOT a custodian — it relays, not holds.

## SAC (Stellar Asset Contract)
The native Soroban wrapper for Stellar assets. USDC on Stellar is issued by
Circle and wrapped via SAC, making it callable from Soroban smart contracts.
The BudgetGuard contract interacts with the USDC SAC to execute transfers —
it does NOT implement its own token logic. The SAC enforces balance constraints
(e.g., balance never goes below zero).

## Kill Switch
The `emergency_pause()` function on the BudgetGuard contract. When activated by
the owner, it immediately blocks ALL new payment authorizations. **What it does
NOT do:** it cannot revoke or cancel transactions already submitted to the Stellar
ledger. Once a transaction achieves ledger finality (typically < 5 seconds), it is
irreversible. This is a property of blockchain finality, not a limitation of the
contract. The kill switch is reversible via `emergency_unpause()`.

## Daily Reset
The mechanism by which `spent_today` resets to zero after 24 hours. Implemented
as a lazy check: on each `authorize_payment` call, the contract compares
`env.ledger().timestamp()` against `last_reset_timestamp`. If the difference
exceeds 86400 seconds, `spent_today` resets to 0 and `last_reset_timestamp`
updates. There is no cron job, no external trigger, no timer — the reset
happens within the next payment authorization call.

## x402 Challenge
The HTTP 402 Payment Required response that a merchant API returns when payment
is needed. The response includes headers or body fields specifying: the price
(in USDC), the payTo address (merchant's Stellar address), the network
(stellar:testnet or stellar:pubnet), and the facilitator URL. The agent parses
this challenge, requests authorization from the contract, and retries the
request with payment proof.

## Simulated On-Ramp (Stripe Test Mode)
The fiat-to-USDC deposit flow implemented using Stripe Checkout in Test Mode.
This simulates what a real Stripe MPP (Machine Payments Protocol) integration
would do in production. In the hackathon: the user pays with a test card
(4242 4242 4242 4242), a webhook fires, and the backend calls `top_up()` on
the contract. This is NOT a real fiat-to-crypto bridge — it is an architectural
demonstration. Every UI element and document labels this as "(Test Mode)".

## Invariant
A property that the BudgetGuard contract must maintain in ALL possible states,
regardless of input sequence or caller. Invariants are defined in INVARIANTS.md
and each one maps directly to one or more tests. Example: "spent_today never
exceeds daily_limit after any authorize_payment call." If an invariant is
violated, the contract has a bug — no exceptions.

## BudgetGuard Contract
The Soroban smart contract at the core of SpendGuard. It holds USDC via the SAC,
enforces spending policies, and executes token transfers internally when policies
are satisfied. The contract is the sole authorizer of payments — the agent
requests, the contract decides. One contract instance manages one agent.

## Soroban Custom Account
A Soroban feature that allows a smart contract to act as an account with
programmable authorization logic. This is the technically unique property that
makes Stellar the only viable chain for SpendGuard's architecture: the contract
can authorize USDC transfers without exposing the agent's private key to the
funds. No other chain offers this with the same elegance at $0.00001 per tx.
