# Narration Script — SpendGuard Demo (90 seconds)

Read this script while recording. Speak naturally, ~2.5 words/second.
Total: ~220 words. Record as a single MP3 file.

---

## 0:00–0:12 — Intro (12s, ~30 words)

> AI agents are making autonomous payments on Stellar using x402.
> But who controls how much they spend?
> Meet SpendGuard — the on-chain spending policy engine
> that was missing for x402 agents.

## 0:12–0:24 — Architecture (12s, ~30 words)

> SpendGuard is a Soroban smart contract.
> The owner sets daily limits, per-transaction caps, and a merchant whitelist.
> The agent can only spend within these boundaries —
> enforced entirely on-chain, not in application code.

## 0:24–0:40 — Payment Flow (16s, ~40 words)

> Here's the x402 flow in action.
> The agent requests a resource and receives HTTP 402 — payment required.
> It calls authorize_payment on the contract.
> SpendGuard validates every policy, executes the USDC transfer,
> and the agent gets its data — settled in under five seconds on Stellar.

## 0:40–0:52 — Blocked Payment (12s, ~30 words)

> Now watch what happens when the agent tries to exceed its limit.
> The contract rejects the payment on-chain.
> No backend hack, no code bypass — the agent simply cannot overspend.
> That's the point.

## 0:52–1:06 — Kill Switch (14s, ~35 words)

> The owner also has an emergency kill switch.
> One click pauses all new authorizations instantly.
> We're honest about what this does — and what it doesn't.
> In-flight transactions on the ledger are final.
> Blockchain finality is a feature, not a bug.

## 1:06–1:20 — Audit Log (14s, ~35 words)

> Every payment is recorded as a Soroban event —
> an immutable audit trail.
> Green means settled. Red means blocked by policy.
> Every transaction links to Stellar Expert for on-chain verification.
> Full transparency, no trust required.

## 1:20–1:30 — Closing (10s, ~25 words)

> SpendGuard is open source, Apache 2.0.
> Deploy your own instance in ten minutes.
> It includes an MCP server, Swagger docs, and a reusable x402 middleware.
> Built for Stellar. Built by DeegaLabs.

---

## Recording Tips

1. Use a quiet room — no echo, no fan noise
2. Phone voice memo app works fine (set to high quality)
3. Speak at natural pace — don't rush
4. Pause briefly between sections (the video has visual transitions)
5. Export as MP3 or WAV
6. Save as `demo-video/public/narration.mp3`
