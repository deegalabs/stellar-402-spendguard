# Video Script — SpendGuard Demo (2:30)

Screen recording of the actual app + voice narration.
Total: ~375 words at ~2.5 words/second.

**Format:** Screen capture (OBS or Loom) + voice narration + background music
**Resolution:** 1920x1080
**Duration:** 2 minutes 30 seconds

---

## 0:00–0:20 — The Problem (20s)

**Screen:** Browser showing a news headline about AI agent costs, or a simple
title card: "What happens when your AI agent has a credit card?"

**Narration:**

> Imagine you deploy an AI agent on Stellar to buy API data using x402.
> It works great — until it doesn't.
> One misconfigured loop. One compromised process.
> And your agent drains ten thousand dollars overnight.
>
> The problem isn't x402 — the protocol is solid.
> The problem is that nobody built the guardrails.
> Until now.

---

## 0:20–0:40 — The Solution (20s)

**Screen:** Open SpendGuard dashboard (`localhost:3000/dashboard`). Show the
clean UI with balance, spend velocity, agent status.

**Narration:**

> This is SpendGuard — an on-chain spending policy engine for x402 agents
> on Stellar.
> The owner sets the rules. The agent follows them.
> Daily limits. Per-transaction caps. Merchant whitelists.
> And an emergency kill switch.
> All enforced by a Soroban smart contract — not by application code.
> The agent literally cannot bypass these rules, even if it's compromised.

---

## 0:40–1:10 — Live Demo: Payment Flow (30s)

**Screen:** Navigate to Live Demo page. Click through the steps.

**Narration:**

> Let me show you how it works.
> I'll run a live x402 payment on Stellar Testnet — right now.
>
> *(click "Read Contract Status")*
> First, the agent checks its budget. Five dollars daily limit,
> two dollars max per transaction.
>
> *(click "Whitelist Merchant")*
> The merchant is whitelisted by the owner.
>
> *(click "Execute x402 Payment")*
> Now the agent requests a resource. The server returns HTTP 402 —
> payment required. The agent calls authorize_payment on the contract.
> SpendGuard validates every policy... and the payment settles on Stellar
> in under five seconds.
>
> *(point to the terminal output showing tx hash)*
> That transaction hash? Click it — it opens on Stellar Expert.
> Real USDC. Real ledger. Real finality.

---

## 1:10–1:35 — Live Demo: Blocked + Kill Switch (25s)

**Screen:** Continue on Live Demo page. Execute the "blocked payment" and
"kill switch" steps.

**Narration:**

> Now watch what happens when the agent tries to overspend.
>
> *(click the payment step that exceeds the limit)*
> The contract rejects it. ExceedsDailyLimit.
> Not the backend — the contract. On-chain enforcement.
>
> *(click "Emergency Pause")*
> The owner can also kill all spending instantly.
> One transaction. The agent is frozen.
>
> *(point to honest disclaimer in the UI)*
> We're transparent about what this does — and what it doesn't.
> In-flight transactions on the ledger are final.
> That's blockchain finality. It's a feature, not a bug.

---

## 1:35–1:55 — Audit Log + Docs (20s)

**Screen:** Navigate to Audit Log. Then quickly show the Docs site.

**Narration:**

> Every payment is an immutable Soroban event.
> Green means settled. Red means blocked by policy.
> Every transaction links directly to Stellar Expert.
>
> *(navigate to /docs)*
> We also built a full documentation site — getting started guides,
> API reference, and integration tutorials for MCP and the x402 middleware.

---

## 1:55–2:15 — Why Stellar (20s)

**Screen:** Show the Architecture page in docs, or the README "Why Stellar"
section.

**Narration:**

> Why does this only work on Stellar?
> Soroban Custom Accounts.
> The contract holds USDC and authorizes transfers internally.
> The agent never touches fund keys.
> On EVM, you'd need a proxy wallet, an EOA signer, and extra gas.
> On Stellar, the contract IS the account.
> This isn't a cost advantage — it's an architectural capability
> that doesn't exist on other chains.

---

## 2:15–2:30 — Closing (15s)

**Screen:** Show the GitHub repo, the Swagger docs, the GitHub Release page.

**Narration:**

> SpendGuard is open source. Apache 2.0.
> Deploy your own instance in ten minutes.
> We published the compiled WASM on GitHub Releases.
> The repo includes Swagger docs, an MCP server for AI agents,
> and a reusable x402 Express middleware.
>
> SpendGuard — the spending-policy contract that was missing
> for x402 agents on Stellar.
> Built by DeegaLabs.

---

## Recording Checklist

Before recording:
- [ ] Backend running: `cd backend && npm run dev`
- [ ] Frontend running: `cd frontend && npm run dev`
- [ ] Browser at `http://localhost:3000/dashboard`
- [ ] Seed data loaded: `cd backend && npm run seed`
- [ ] Freighter connected to Testnet
- [ ] Screen recording tool ready (OBS/Loom, 1920x1080)
- [ ] Quiet room, mic ready
- [ ] Background music file ready

Recording tips:
1. Record the screen and narration separately if easier
2. Move the mouse slowly and deliberately — judges follow your cursor
3. Pause 1-2 seconds after each click so the result is visible
4. If something fails, keep recording — acknowledge it and continue
5. You can edit in post (cut pauses, add music) with any free editor

## Post-Production

1. Combine screen recording + narration + music in a video editor
2. Music at ~15% volume, narration at 100%
3. Export as MP4, 1080p
4. Upload to YouTube (unlisted or public)
5. Add URL to README.md (replace VIDEO_ID placeholder)
