# Security Policy — Stellar 402 SpendGuard

> Hackathon build — Stellar Hacks: Agents (SDF). Deployed to **testnet only**.
> Do **not** use this contract or backend to custody mainnet funds without
> the follow-up work listed under [Known Limitations](#known-limitations).

---

## Reporting a Vulnerability

Please do **not** open a public GitHub issue for security-relevant findings.

- Open a GitHub **private security advisory** on this repository, or
- Email the maintainer via the git commit author address.

Please include: affected component (contract / backend / frontend), a short
reproduction, and the impact you observed. We aim to acknowledge within 72h
during the hackathon window.

---

## Threat Model

SpendGuard is a Soroban spending-policy contract that governs x402 payments
initiated by an AI agent on Stellar. The security posture assumes three
distinct principals with asymmetric trust:

| Principal | Holds                       | Trust level | Attack surface                          |
| --------- | --------------------------- | ----------- | --------------------------------------- |
| Owner     | Freighter secret (offline)  | High        | Admin endpoints, owner key theft        |
| Agent     | Agent secret (server-side)  | Medium      | Compromised process → daily-limit loss  |
| Merchant  | Stellar address only        | Low         | Whitelist abuse, front-running          |
| Public    | No keys                     | Zero        | Rate limiting, CORS, paywall bypass     |

**What the contract protects against:**

1. A fully compromised agent cannot exceed `daily_limit` / `max_tx_value`.
2. A compromised agent cannot send funds to any address not on the whitelist.
3. The owner can freeze all outflows via `emergency_pause` in one transaction.
4. Re-initialization, overflow, and replay cannot re-grant privileges.

**What the contract does *not* protect against:**

- Theft of the owner secret key → full contract takeover.
- Theft of the agent secret + a whitelisted merchant controlled by the attacker
  → drains up to `daily_limit` per 24h until the owner pauses.
- Bugs in the USDC Stellar Asset Contract (trusted dependency).
- Social engineering the owner into whitelisting a hostile address.

---

## Contract Audit — `contracts/budget-guard`

Audit performed against [INVARIANTS.md](contracts/budget-guard/INVARIANTS.md)
and [ATTACK_VECTORS.md](contracts/budget-guard/ATTACK_VECTORS.md) on
**2026-04-08** by reviewing [lib.rs](contracts/budget-guard/src/lib.rs),
[error.rs](contracts/budget-guard/src/error.rs), and
[storage.rs](contracts/budget-guard/src/storage.rs).

### Invariants → Code mapping

| ID    | Invariant                                           | Enforced at                                       | Status |
| ----- | --------------------------------------------------- | ------------------------------------------------- | :----: |
| I-001 | `spent_today ≤ daily_limit`                         | [lib.rs:179-183](contracts/budget-guard/src/lib.rs#L179-L183) |   OK   |
| I-002 | No transfer when `paused`                           | [lib.rs:138-142](contracts/budget-guard/src/lib.rs#L138-L142) |   OK   |
| I-003 | Reset when `now - last_reset > 86400`               | [lib.rs:70-80](contracts/budget-guard/src/lib.rs#L70-L80)     |   OK   |
| I-004 | Non-whitelisted merchant rejected                   | [lib.rs:162-170](contracts/budget-guard/src/lib.rs#L162-L170) |   OK   |
| I-005 | Admin functions gated by `owner.require_auth()`     | [lib.rs:49-54](contracts/budget-guard/src/lib.rs#L49-L54)     |   OK   |
| I-006 | `authorize_payment` gated by `agent.require_auth()` | [lib.rs:145-146](contracts/budget-guard/src/lib.rs#L145-L146) |   OK   |
| I-007 | `top_up` deposits exact amount                      | [lib.rs:224-226](contracts/budget-guard/src/lib.rs#L224-L226) |   OK   |
| I-008 | `spent_today` monotonic except on reset             | whole-contract property, no reducer exists        |   OK   |
| I-009 | `price ≤ 0` rejected                                | [lib.rs:149-152](contracts/budget-guard/src/lib.rs#L149-L152) |   OK   |
| I-010 | Balance never negative                              | [lib.rs:186-192](contracts/budget-guard/src/lib.rs#L186-L192) |   OK   |
| I-011 | `initialize` once                                   | [lib.rs:97-104](contracts/budget-guard/src/lib.rs#L97-L104)   |   OK   |
| I-012 | `max_tx_value ≤ daily_limit`                        | [lib.rs:109-111](contracts/budget-guard/src/lib.rs#L109-L111), [lib.rs:244-247](contracts/budget-guard/src/lib.rs#L244-L247), [lib.rs:266-269](contracts/budget-guard/src/lib.rs#L266-L269) |   OK   |

### Attack vectors

| ID     | Attack                                  | Defense                                         | Status |
| ------ | --------------------------------------- | ----------------------------------------------- | :----: |
| AV-001 | Replay                                  | Stellar seq numbers + `spent_today` accrual     |   OK   |
| AV-002 | Integer overflow                        | `checked_add` → `ArithmeticOverflow`            |   OK   |
| AV-003 | Non-agent calls `authorize_payment`     | `agent.require_auth()`                          |   OK   |
| AV-004 | Owner impersonation                     | `owner.require_auth()` via `require_owner`      |   OK   |
| AV-005 | Whitelist bypass                        | `Whitelist(merchant).unwrap_or(false)`          |   OK   |
| AV-006 | Paused bypass                           | Paused check is step 1 of `authorize_payment`   |   OK   |
| AV-007 | Daily-limit bypass via multiple calls   | `spent_today + price > daily_limit` per call    |   OK   |
| AV-008 | Zero-amount griefing                    | `price ≤ 0` and `amount ≤ 0` rejected           |   OK   |
| AV-009 | 86400-second boundary                   | Strictly `>` not `>=`                           |   OK   |
| AV-010 | SAC transfer failure mid-execution      | Balance pre-check + Soroban atomicity           |   OK   |

### Contract findings

**C-01 — [LOW] `payment_rejected` events can be emitted pre-auth when paused**

[lib.rs:140](contracts/budget-guard/src/lib.rs#L140) emits
`payment_rejected` before `agent.require_auth()` runs (the paused check is
step 1, auth is step 2). Any caller can invoke `authorize_payment` on a
paused contract and pollute the event log. No funds move, but the Audit Log
can be filled with noise. **Suggested fix:** move the agent auth check
before the paused check, or skip event emission on the paused branch.

**C-02 — [INFO] `MerchantAlreadyWhitelisted` error is defined but unused**

[error.rs:19](contracts/budget-guard/src/error.rs#L19) declares the error
but [`whitelist_merchant`](contracts/budget-guard/src/lib.rs#L278-L290) does
not check the current state before overwriting. Idempotency is correct but
the code is dead. Either enforce it or remove from the enum.

**C-03 — [INFO] `set_agent` emits an event without the old agent address**

[lib.rs:344-345](contracts/budget-guard/src/lib.rs#L344-L345) logs only the
new agent. An audit reviewer cannot reconstruct the rotation chain from
events alone. **Suggested fix:** include the previous agent in the event.

**C-04 — [INFO] `top_up` is owner-only by design**

Third parties cannot fund the contract. This is intentional (see
[SPEC.md](contracts/budget-guard/SPEC.md)) and prevents griefing via
dust transfers, but is worth documenting for integrators.

### Contract: Out of scope for this audit

- Formal verification of Soroban host semantics.
- Trusted dependency: USDC SAC correctness is assumed.
- Economic attacks on the broader x402 facilitator network.

---

## Backend Audit — `backend/src`

Audited against the 10-category security checklist on **2026-04-08**. The
backend is an Express service that holds the owner and agent secret keys
and signs Soroban transactions on their behalf.

### Backend findings

**B-01 — [CRITICAL] Admin auth accepts spoofable `X-Stellar-Address` header**

File: [backend/src/middleware/admin-auth.ts:34-45](backend/src/middleware/admin-auth.ts#L34-L45)

```ts
const stellarAddress = req.headers["x-stellar-address"] as string | undefined;
if (stellarAddress === config.ownerPublicKey) { next(); return; }
```

Stellar public keys are **public**. Any attacker who knows the owner's
public key (visible in Stellar explorer, in any transaction, in the
frontend bundle) can send the header and be authorized as the owner. The
backend then signs admin transactions with the owner secret on their
behalf.

**Impact:** Full owner impersonation against every `/api/admin/*` endpoint
— raise `daily_limit`, whitelist attacker-controlled merchant, `unpause`,
`top_up`, rotate `agent`. Combined with the agent key held server-side,
this is effectively full contract takeover for anyone who can reach the
backend over HTTPS.

**Mitigations in place today:**
- CORS restricts browsers to `config.frontendUrl` (but not curl/scripts).
- Rate limiting caps calls to 60 / 15 min.
- On testnet only — no mainnet funds at risk.

**Required fix before any non-demo deployment:** require a Freighter
signature on a server-issued nonce and verify it with
`Keypair.verify()`. The file already contains a comment acknowledging
this: *"For production use, this should be replaced with Freighter wallet
signature verification."* Until that lands, set `ADMIN_API_KEY` and
remove the `X-Stellar-Address` fallback, or hard-fail when
`NODE_ENV === "production"`.

---

**B-02 — [CRITICAL] x402 payment proof is not bound to amount / merchant / asset**

File: [backend/src/middleware/x402-spendguard.ts:98-138](backend/src/middleware/x402-spendguard.ts#L98-L138)

The paywall middleware verifies only that a transaction hash exists on
Horizon and is `successful`:

```ts
const txResponse = await fetch(`${horizonUrl}/transactions/${paymentProof}`);
if (!txResponse.ok) { /* reject */ }
const txData = await txResponse.json();
if (!txData.successful) { /* reject */ }
// accept
```

It does **not** verify:
1. That the transaction paid `merchant` (the expected `payTo`).
2. That the transaction paid at least `priceStroops`.
3. That the asset transferred was the configured USDC SAC.
4. That the transaction is fresh (tx timestamp vs. challenge issue time).
5. That the payer is not replaying someone else's tx hash.

**Impact:** Any successful testnet tx hash — e.g. a friendbot funding
transaction the attacker received — unlocks the paywalled route.

**Fix:** parse the operation list on the Horizon response and require a
`payment` or SAC `invokeHostFunction` op to the exact `merchant` address,
amount `≥ priceStroops`, asset equal to `config.usdcSacAddress`. Also
require the tx `created_at` to be within a short window of the 402
challenge issue time, and cache by the tuple `(route, txHash)` rather
than `txHash` alone.

**Note:** this only affects the `x402Paywall` *middleware example*
(`/api/demo/premium-weather`). The primary demo flow
(`/api/demo/run-agent` → `authorize_payment`) does not use this
middleware and is enforced on-chain by the contract itself.

---

**B-03 — [HIGH] Unbounded `verifiedPayments` map in paywall middleware**

File: [backend/src/middleware/x402-spendguard.ts:39-49](backend/src/middleware/x402-spendguard.ts#L39-L49)

`verifiedPayments = new Map<string, PaymentRecord>()` grows with every
distinct successful proof and is only cleaned lazily when the next
request enters `cleanExpiredPayments()`. Also, the cache key is just the
tx hash, so one verified payment unlocks **every** paywalled route for
five minutes.

**Fix:** bound the map (LRU, ~1000 entries), scan-clean on a timer, and
key by `(routePath, txHash)`.

---

**B-04 — [MEDIUM] Known CVEs in frontend Next.js 14.2.35**

`pnpm audit` on `frontend/` reports 5 advisories against `next@14.2.35`:

| Advisory              | Severity | Exploitable in our config?                             |
| --------------------- | :------: | ------------------------------------------------------ |
| GHSA-h25m-26qc-wcjf   |   High   | No — we do not use insecure RSC patterns               |
| GHSA-5j98-mcp5-4vw2   |   High   | No — `glob` CLI is not invoked at runtime              |
| GHSA-ggv3-7p47-pfv8   | Moderate | No — we do not proxy via `rewrites` to external hosts  |
| GHSA-9g9p-9gw9-jx7f   | Moderate | No — no `images.remotePatterns` configured             |
| GHSA-3x4c-7xq6-9pq8   | Moderate | No — image optimizer disk cache not a concern on Vercel |

None are directly exploitable in the current hackathon deployment, but
the pin is 8+ months stale. **Recommended:** upgrade to `next@15.5.14+`
after the hackathon demo.

Backend `pnpm audit` reports **0 vulnerabilities** (184 deps).

---

**B-05 — [MEDIUM] Rate limiting is in-memory, per instance**

File: [backend/src/middleware/rate-limit.ts](backend/src/middleware/rate-limit.ts)

`express-rate-limit` uses its default in-memory store. On Railway with
one instance this is correct. If horizontally scaled, each replica
enforces its own counter, effectively multiplying the limit by N. Not a
risk today (single instance) but flagged for any autoscaling rollout.
**Fix when scaling:** switch the store to Redis.

---

**B-06 — [LOW] CORS fallback is `*`**

File: [backend/src/server.ts:17-21](backend/src/server.ts#L17-L21)

```ts
cors({ origin: config.frontendUrl
  ? config.frontendUrl.split(",").map((u) => u.trim())
  : "*" })
```

If `FRONTEND_URL` is unset in production, every origin is allowed. This
amplifies B-01 because the spoofable admin header can then be sent from
any browser context. **Fix:** hard-fail when `NODE_ENV === "production"`
and `FRONTEND_URL` is missing, or default to a locked-down allowlist.

---

**B-07 — [LOW] Shallow input validation on admin endpoints**

File: [backend/src/api/admin.ts](backend/src/api/admin.ts)

- `amount <= 0` uses loose JS comparison before `BigInt(amount)`, which
  will throw on non-numeric input and leak as a generic 500.
- `merchant.startsWith("G")` is a weak strkey validator — it accepts any
  string starting with `G` and lets the SDK raise a 500 downstream.

**Fix:** validate via a `zod` schema (numeric string, `≥ 1`) and call
`StrKey.isValidEd25519PublicKey(merchant)` from `@stellar/stellar-sdk`.

---

**B-08 — [INFO] Secrets in backend env (custodial by design)**

`OWNER_SECRET_KEY` and `AGENT_SECRET_KEY` are held server-side. This is
documented as a hackathon trade-off in
[TRADE_OFFS.md](TRADE_OFFS.md) — in production the owner key should sign
via Freighter on the client and the agent key should live in an HSM or
OpenZeppelin Relayer. The newly-added `ConfigError`
([client.ts:31-52](backend/src/stellar/client.ts#L31-L52)) makes
misconfiguration return `503` with a clear message instead of the opaque
"invalid encoded string" produced by `Keypair.fromSecret("")`.

---

**B-09 — [INFO] Swagger UI publicly exposed**

[backend/src/swagger.ts](backend/src/swagger.ts) mounts `/api/docs`.
Safe but leaks the API surface to passive reconnaissance. Gate behind
`NODE_ENV !== "production"` or behind the admin key for deployments
past demo day.

---

**B-10 — [INFO] Stripe webhook signature verification**

Out of scope for this audit pass; confirm that
[backend/src/stripe/webhook.ts](backend/src/stripe/webhook.ts) uses
`stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`. Raw body
must be preserved through `express.json()`.

---

## Known Limitations

1. **Testnet only** — contract address, accounts, and USDC SAC are all
   Stellar testnet. No mainnet deployment.
2. **Custodial backend** — the server holds the owner and agent secrets.
   Non-custodial signing (Freighter for owner, HSM/Relayer for agent) is
   on the post-hackathon roadmap.
3. **Admin auth is demo-grade** — finding B-01 must be resolved before
   the backend is exposed to any non-demo traffic.
4. **x402 middleware example is not production-ready** — finding B-02
   must be resolved before the reusable `x402Paywall` is recommended for
   third-party use.
5. **Rate limiting is single-instance** — finding B-05 blocks any
   horizontal scaling.
6. **No penetration test** — findings above come from code review only.

---

## Remediation Priority

Before the hackathon demo:

- [x] Invariant + attack-vector audit of the Soroban contract.
- [x] Structured error surfacing for config failures (ConfigError).
- [x] Tiered rate limiting per route class.
- [ ] **B-01** — gate admin endpoints behind `ADMIN_API_KEY` in production
      and remove the `X-Stellar-Address` fallback (or keep it only behind
      a `NODE_ENV !== "production"` guard).

Post-hackathon, before any pilot:

- [ ] **B-02** — bind x402 payment proofs to `(merchant, amount, asset, freshness)`.
- [ ] **B-03** — LRU-bound the verified-payment cache and key by route.
- [ ] Replace admin auth with Freighter signature verification on a
      server-issued nonce.
- [ ] Move the agent secret to OpenZeppelin Relayer or a KMS.
- [ ] Upgrade Next.js to `^15.5.14` and re-run `pnpm audit`.
- [ ] **C-01** — reorder `authorize_payment` so the paused branch does
      not emit pre-auth events.

---

## Audit Log

| Date       | Component                             | Auditor          | Outcome |
| ---------- | ------------------------------------- | ---------------- | ------- |
| 2026-04-08 | Soroban contract + backend code review | Internal (Claude) | This file |
