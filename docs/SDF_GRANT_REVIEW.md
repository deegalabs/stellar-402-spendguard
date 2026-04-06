# SDF Grant Review — Stellar 402 SpendGuard

Internal evaluation of the project against Stellar Development Foundation and
Stellar Community Fund (SCF) review criteria. Use this document to identify
weaknesses before judges do.

Last reviewed: 2026-04-06  
Hackathon: Stellar Hacks: Agents (Deadline: Apr 13, 2026)

---

## 1. Stellar Integration Depth

**SCF Criterion:** _"The project must demonstrate that Stellar is or will be a
central and valuable part of the project. Don't shoehorn Stellar — reviewers
want to see the team is committed to the ecosystem."_

### Assessment: STRONG (8/10)

**What we use from Stellar:**
| Stellar Feature | How SpendGuard Uses It | Replaceable by Another Chain? |
|----------------|------------------------|-------------------------------|
| Soroban Custom Account | Contract acts as programmable wallet — authorizes transfers without exposing agent keys | **No.** EVM requires EOA signatures or complex proxy patterns. This is the core differentiator. |
| Soroban Auth Framework | `require_auth()` enforces access control natively | Partially — EVM has `msg.sender` but lacks structured auth entries |
| Stellar Asset Contract (SAC) | USDC transfers via native Soroban interface | No — SAC is Stellar-specific. Other chains use ERC-20. |
| Ledger timestamp | Daily reset without cron via `env.ledger().timestamp()` | Partially — EVM has `block.timestamp` but different trust model |
| Soroban events | Immutable audit trail via `env.events().publish()` | Partially — EVM has events but different indexing |
| Horizon API | Event reading, balance queries, tx history | No — Stellar-specific infrastructure |
| Freighter wallet | Auth-entry signing for owner operations | No — Stellar-specific wallet |
| Built on Stellar Facilitator | x402 payment relay on Stellar | No — Stellar-specific facilitator |
| Native USDC (Circle) | Not bridged, not wrapped — first-class Stellar asset | No — other chains have bridged USDC with different risk profiles |
| $0.00001 fees | Makes $0.001 micropayments economically viable | Partially — some L2s approach this but not with same finality guarantees |

**The "Why Stellar" argument in one paragraph:**

SpendGuard's architecture depends on Soroban Custom Accounts — the ability for
a smart contract to hold funds and authorize transfers internally without
exposing private keys to the agent process. On EVM chains, token transfers
require an EOA signature or complex proxy/multisig patterns that add gas costs
and attack surface. On Stellar, the contract IS the account. The agent invokes
`authorize_payment()`, the contract validates policies, and calls
`token.transfer()` from its own address. The authorization is born and dies
inside the contract logic. This is not a performance advantage or a cost
advantage — it is an architectural capability that does not exist elsewhere.

**Gap identified:**
- The README and pitch must lead with this argument, not fees/speed
- The demo must explicitly show the agent NOT having fund keys

---

## 2. Product-Market Fit

**SCF Criterion:** _"The project demonstrates product-market fit with real
traction or a need clearly validated by someone experienced in the Stellar
ecosystem."_

### Assessment: MODERATE (6/10)

**The problem is real and documented:**
- x402 whitepaper (Coinbase) states: "AI agents require instant, frictionless
  access to real-time data, API services, and distributed compute resources"
- The SDF blog explicitly describes "smart wallets with spending policies" as
  the next step for x402 on Stellar
- Galaxy Research estimates $3-5T in agentic commerce by 2030

**The gap:**
- Zero traction — no users, no deployments, no LOIs
- No testimonials from Stellar ecosystem participants
- The "CFO worried about AI spending" persona is compelling but unvalidated

**Mitigation for hackathon:**
- Frame as infrastructure, not product — "we built the primitive that others
  will use to deploy governed agents"
- Reference the SDF's own blog post describing this exact capability as
  "in active development"
- Hackathon projects are not expected to have traction — but they ARE expected
  to demonstrate awareness of who would use this

**Action items:**
- [ ] Add a "Target Users" section to README: Stellar dApp developers deploying
  x402 agents, enterprises using Stellar for agent-based commerce, OpenClaw
  skill developers who need governed payment flows
- [ ] Reference the SDF blog post explicitly in the README

---

## 3. Technical Quality

**SCF Criterion:** _"The submission is rich in technical details. If smart
contracts are involved, there is a clear plan to open-source them."_

### Assessment: STRONG (9/10)

**What we have:**
- 13 GSD spec files before any implementation
- Formal contract spec with storage schema, function signatures, error enum
- 12 invariants with testable assertions
- 10 attack vectors with expected defenses
- TDD with 37 planned tests (boundary + invariant + attack)
- Architecture Decision Records (7 ADRs) with trade-off analysis
- Honest documentation of limitations (kill switch scope, Stripe simulation)

**What judges will verify:**
| Check | Status |
|-------|--------|
| Contract compiles and deploys on testnet | Pending (Day 3) |
| Tests exist and pass | Pending (Day 2-3) |
| Git history shows TDD progression (RED → GREEN) | Planned |
| Contract is open-source (Apache 2.0) | Done (LICENSE in repo) |
| README explains how to build and test | Pending (Day 8) |
| Code quality (no unwrap, proper error handling) | Enforced in CLAUDE.md |

**Gap identified:**
- No code exists yet — all quality claims are aspirational
- The spec quality is unusually high for a hackathon — this is a strength if
  the implementation matches, a weakness if the code is rushed

---

## 4. Open Source & Ecosystem Contribution

**SCF Criterion:** _"If the project develops smart contracts using Soroban,
it must clearly explain a plan to open-source those contracts."_

### Assessment: NEEDS IMPROVEMENT (5/10)

**What we have:**
- Apache 2.0 LICENSE in repo root — ✓
- Public GitHub repo — ✓

**What's missing:**
- [ ] Explicit "Open Source" section in README stating:
  - The BudgetGuard contract is fully open-source under Apache 2.0
  - Other developers can fork, deploy, and extend the contract
  - No proprietary dependencies — all deps are open-source
- [ ] Contributing guidelines (even minimal for hackathon)
- [ ] Clear documentation on how another developer would deploy their own
  instance of the contract
- [ ] Published WASM artifact or deployment instructions

**Why this matters:**
The SCF has historically rejected projects that use Soroban but don't commit to
open-sourcing their contracts. For SpendGuard, this is trivially fixable — the
entire repo is public. But the README must SAY it explicitly.

---

## 5. Innovation & Differentiation

**SCF Criterion:** _"Originality and impact on the ecosystem."_

### Assessment: STRONG (8/10)

**Competitive landscape scan:**
| Project Type | Count in x402 Hackathons | What They Do | SpendGuard Difference |
|-------------|--------------------------|-------------|----------------------|
| Agent-pays-for-API | ~70% of submissions | Agent with wallet calls x402 endpoints | SpendGuard adds governance BETWEEN the agent and the wallet |
| Payment dashboard | ~15% | Shows tx history, maybe charts | SpendGuard dashboard controls policy, not just displays data |
| Multi-chain bridge | ~10% | x402 across chains | SpendGuard is single-chain, deep integration |
| Spending governance | ~0% | Nobody has built this | **SpendGuard is the first** |

**The differentiation is genuine:**
No project in Cronos, Solana, SKALE, or previous Stellar hackathons focused on
the governance layer between the agent and the funds. Everyone built agents that
pay — nobody built infrastructure that governs HOW agents pay.

**The SDF alignment is strong:**
The SDF blog post on "what's next for x402 on Stellar" explicitly describes:
- "MCP integration for agents to discover paid resources and authorize payments
  via smart wallets with spending policies defined by the user"
- "Embedded smart wallets with OpenZeppelin supporting spending limits and
  programmable policies"

SpendGuard is building exactly what the SDF described as their roadmap.

---

## 6. Demo & Presentation Quality

**SCF Criterion:** _"Deliverables need to be of high quality, clear language,
and rich in technical detail."_

### Assessment: PENDING (Day 8)

**Planned:**
- 90-second demo video following exact script (DEMO_SCRIPT.md)
- 5-screen UI with enterprise fintech aesthetic
- Real on-chain transactions visible on Stellar Expert
- Kill switch demonstration with honest limitation disclosure

**Risk factors:**
- [ ] Demo depends on testnet availability — have a backup recording
- [ ] Stripe Test Mode checkout must complete smoothly — rehearse
- [ ] Freighter popups must not be blocked by browser — test in advance
- [ ] Kill switch modal must show the honest disclaimer text

**Presentation checklist for README:**
- [ ] Problem statement (1 paragraph)
- [ ] Solution (1 paragraph + architecture diagram)
- [ ] Why Stellar (the auth-entry argument, not fees)
- [ ] How to run locally (step-by-step)
- [ ] Contract address on testnet with Stellar Expert link
- [ ] Video link
- [ ] Open-source declaration
- [ ] Limitations and honest disclaimers
- [ ] Team
- [ ] License

---

## 7. Honest Limitations

**SCF Criterion:** _(Implicit — SCF reviewers reward honesty and penalize
overclaiming.)_

### Assessment: STRONG (9/10)

**Limitations we declare explicitly:**

| Limitation | Where Documented | Why Honest |
|-----------|-----------------|-----------|
| Kill switch cannot cancel in-flight transactions | SPEC.md, INVARIANTS.md, UI modal text | Blockchain finality is a feature, not a bug |
| Stripe integration is Test Mode simulation | ADR-004, TRADE_OFFS.md, UI labels | MPP is in early access, claiming real integration would be false |
| Single agent per contract | ADR-006, TRADE_OFFS.md | Multi-agent is production complexity, not hackathon scope |
| No agent reputation scoring | TRADE_OFFS.md | Was in original spec, removed because no real mechanism existed |
| Daily reset is lazy (triggers on next call) | ADR-002, GLOSSARY.md | If no payments for 24h, reset only fires on next call |
| Testnet only | TRADE_OFFS.md | Contract code is network-agnostic but not tested on mainnet |

**Why this matters:**
SDF/SCF reviewers have seen hundreds of projects. They can spot overclaiming
instantly. A project that says "limitations: none" is a red flag. A project
that says "the kill switch blocks new authorizations but cannot revoke in-flight
transactions — this is a property of blockchain finality" demonstrates deep
technical understanding.

---

## 8. Ecosystem Impact

**SCF Criterion:** _"Is this an application or service that helps the Stellar
network grow? Does it bring new users or liquidity to Stellar?"_

### Assessment: MODERATE (6/10)

**How SpendGuard grows the Stellar ecosystem:**

```
More governed agents → More x402 payments on Stellar → More USDC volume
     ↑                                                        ↓
More merchants accept x402 ← More merchants trust agent payments
```

The argument: enterprises won't deploy autonomous agents with unlimited spending
on any blockchain. SpendGuard removes that blocker. More governed agents means
more transaction volume on Stellar.

**The gap:**
- This is an infrastructure play, not a user-facing product
- It does not directly bring new users to Stellar — it enables OTHER projects
  to bring users safely
- The impact is indirect and hard to quantify

**How to strengthen this for judges:**
- [ ] Frame SpendGuard as a "public good" for the Stellar x402 ecosystem
- [ ] Show that the contract is reusable — any developer can deploy their own
  instance in 5 minutes
- [ ] Reference the potential: if 100 agents use SpendGuard, that's 100x daily
  transaction volume on Stellar from governed, predictable spending

---

## Summary Scorecard

| Criterion | Score | Status |
|-----------|-------|--------|
| Stellar integration depth | 8/10 | Strong — Soroban Custom Account is the differentiator |
| Product-market fit | 6/10 | Problem is real, zero traction, good narrative |
| Technical quality | 9/10 | Specs are exceptional, code pending |
| Open source | 5/10 | License exists, README declaration missing |
| Innovation | 8/10 | First spending governance for x402 agents |
| Demo quality | ?/10 | Pending Day 8 |
| Honest limitations | 9/10 | Documented across multiple files |
| Ecosystem impact | 6/10 | Indirect but real — needs stronger framing |

**Overall: 7.3/10 (before implementation)**

**Top 3 actions to improve score:**
1. **README open-source section** — explicitly state contract is Apache 2.0,
   fork-friendly, with deployment instructions (raises Open Source from 5→8)
2. **Ecosystem impact framing** — position as public good, show reusability,
   reference SDF blog roadmap alignment (raises Impact from 6→8)
3. **Ship the code** — specs without implementation are promises. Every test
   passing on testnet moves Technical Quality from aspirational to proven.

---

## Red Flags a Judge Might Raise

| Red Flag | Our Answer |
|----------|-----------|
| "Why not just use a multisig wallet?" | Multisig requires human signers. SpendGuard is programmatic — the contract enforces policies autonomously without human intervention per transaction. |
| "Is the Stripe integration real?" | No — it is a Test Mode simulation, clearly labeled. The architecture supports real MPP when the SDK stabilizes. See ADR-004. |
| "This is just a smart contract with limits — what's novel?" | The novelty is the combination: x402 challenge parsing + on-chain policy enforcement + SAC integration + audit trail + kill switch. No other project has assembled this stack for agent governance. |
| "Can't I just set spending limits in the agent code?" | You can, but that's application-level security. A compromised agent ignores its own limits. SpendGuard enforces limits on-chain — the agent CANNOT bypass them even if compromised. |
| "Single agent per contract doesn't scale" | Correct for production. The architecture supports multi-agent via DataKey namespacing. For the hackathon, single agent demonstrates the complete governance flow without storage complexity. |
| "Where are the users?" | SpendGuard is infrastructure. The users are developers deploying x402 agents on Stellar. The SDF's own blog describes this exact capability as "in active development" — we're building what they asked for. |
