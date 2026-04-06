# Development Plan

8-day execution plan for SpendGuard MVP. Each day has a goal, specific tasks,
a definition of done, and blocker risks.

**Start:** April 5, 2026  
**Deadline:** April 13, 2026 17:00 UTC  
**Target submission:** April 12, 2026 EOD (17h buffer)

---

## Day 1 — GSD Docs + Repo Structure (Apr 5-6)

**Goal:** All 13 spec files committed to main — zero implementation files.

**Tasks:**
1. Create CLAUDE.md with project context and rules
2. Create docs/GLOSSARY.md with all term definitions
3. Create docs/ARCHITECTURE.md with system overview and flow diagram
4. Create docs/DECISIONS.md with 7 ADRs
5. Create TRADE_OFFS.md with in-scope and out-of-scope
6. Create contracts/budget-guard/SPEC.md with formal contract spec
7. Create contracts/budget-guard/INVARIANTS.md with 12 invariants
8. Create contracts/budget-guard/ATTACK_VECTORS.md with 10 vectors
9. Create docs/TEST_STRATEGY.md with 3 test categories
10. Create backend/API_SPEC.md with all endpoints
11. Create backend/AGENT_SPEC.md with x402 agent spec
12. Create docs/ENVIRONMENT.md with all env vars
13. Create docs/DEVELOPMENT_PLAN.md (this file)
14. Create docs/DEMO_SCRIPT.md with 90-second demo sequence

**Definition of Done:** All 13 docs on main. Zero .rs / .ts / .tsx files.
`git log` shows clean doc history.

**Blocker risks:** None — this is documentation only.

---

## Day 2 — Soroban Scaffold + 37 Tests RED (Apr 6-7)

**Goal:** 37 failing tests — zero passing, zero implementation logic.

**Tasks:**
1. Fund owner account on Stellar Testnet with XLM
2. Fund agent keypair separately (different from owner)
3. Create contracts/budget-guard/Cargo.toml (soroban-sdk = "22.0.1")
4. Create src/error.rs with 13-variant Error enum from SPEC.md
5. Create src/storage.rs with DataKey enum (10 keys)
6. Create src/events.rs with event helper stubs
7. Create src/lib.rs with contract struct + 11 function stubs (all `panic!("not implemented")`)
8. Create src/test/setup.rs with test helpers
9. Create src/test/boundary_test.rs (~13 tests)
10. Create src/test/invariant_test.rs (12 tests)
11. Create src/test/attack_test.rs (12 tests)
12. Run `cargo build` — must compile
13. Run `cargo test` — must show 0 passed, ~37 failed

**Definition of Done:** `cargo test` output: 0 passed, 37 failed. No compile
errors. Commit message: `test(contract): write 37 failing TDD tests — RED phase`

**Blocker risks:**
- Soroban SDK v22 API changes — verify `Env::default()` and `env.ledger().set()` work
- Test USDC token setup via `StellarAssetClient` — may need troubleshooting

---

## Day 3 — Contract Implementation → 37 GREEN + Deploy (Apr 7-8)

**Goal:** All 37 tests GREEN + contract address live on Stellar Testnet.

**Tasks:**
1. Implement `authorize_payment` — SAC transfer, daily reset, all checks
2. Implement `emergency_pause` / `emergency_unpause`
3. Implement `set_daily_limit`, `set_max_tx`, `whitelist_merchant`, `remove_merchant`
4. Implement `top_up`, `set_agent`, `get_status`
5. Use `checked_add()` for all i128 arithmetic
6. Run `cargo test` after each function — watch tests go GREEN
7. Final: `cargo test` → 37/37 GREEN
8. Build WASM: `cargo build --target wasm32-unknown-unknown --release`
9. Deploy: `stellar contract deploy --wasm ... --network testnet`
10. Save CONTRACT_ADDRESS to docs/ENVIRONMENT.md
11. Test deploy: `stellar contract invoke --id CONTRACT_ADDRESS --fn get_status`

**Definition of Done:** `cargo test`: 37/37 PASSED. Contract live on testnet.
CONTRACT_ADDRESS in ENVIRONMENT.md. `git log` shows RED commit before GREEN.

**Blocker risks:**
- auth_entry signing in Soroban v22 — the most complex implementation detail
- SAC integration — token.transfer from contract address requires correct auth

---

## Day 4 — x402 Backend: Protected Endpoint + Agent Flow (Apr 8-9)

**Goal:** Full x402 cycle working end-to-end on testnet.

**Tasks:**
1. Initialize backend: npm init, TypeScript strict, Express
2. Set up .env from ENVIRONMENT.md template
3. Implement protected API endpoint with x402 `paymentMiddleware`
4. Implement agent x402-client.ts — detects and parses 402 responses
5. Implement agent payment-handler.ts — builds Soroban transactions
6. Implement agent demo mode — single cycle triggered via API
7. Write integration test: full 402 → pay → receive cycle
8. Manual test: run agent, observe tx hash on Horizon

**Definition of Done:** Full x402 cycle visible in terminal. Horizon shows USDC
transfer on-chain. Integration tests GREEN.

**Blocker risks:**
- payment-handler.ts building SorobanTransaction is the hardest backend piece
- Built on Stellar Facilitator may require registration before use
- @x402/stellar package compatibility with Stellar SDK version

---

## Day 5 — Stripe Simulation + Horizon Events (Apr 9-10)

**Goal:** Deposit flow works + Audit Log reads real on-chain events.

**Tasks:**
1. Implement Stripe Checkout session creation (test mode)
2. Implement Stripe webhook handler (payment_intent.succeeded → contract.top_up)
3. Label all Stripe UI elements with "(Test Mode)"
4. Implement Horizon event reader for contract events
5. Implement dashboard API: GET /api/status, /api/transactions, /api/balance
6. Implement admin API: POST pause, unpause, set-limit, set-max-tx, whitelist
7. Seed 15+ transactions on testnet for Audit Log history

**Definition of Done:** Stripe test payment → contract balance increases on
Horizon. GET /api/transactions returns real events. 15+ seed txs on testnet.

**Blocker risks:**
- Stripe webhook testing requires `stripe listen --forward-to` CLI
- Horizon event pagination — may need cursor handling

---

## Day 6 — Frontend: Onboarding + Agent Vault + Kill Switch (Apr 10-11)

**Goal:** Core governance UI functional with real contract calls.

**Tasks:**
1. Configure Freighter extension for Stellar Testnet
2. Initialize Next.js 14 with TypeScript, Tailwind, Geist font
3. Implement global layout: sidebar + header (enterprise fintech light theme)
4. Implement Freighter wallet connect (auth-entry signing)
5. Implement Onboarding page (empty state)
6. Implement Agent Vault: daily limit slider → contract.set_daily_limit()
7. Implement Agent Vault: max tx slider → contract.set_max_tx()
8. Implement Agent Vault: merchant whitelist management
9. Implement Kill Switch: button → modal → contract.emergency_pause()
10. Implement global PAUSED banner

**Definition of Done:** Slider moves update contract on-chain (visible on
Horizon). Kill Switch modal works. Freighter connects to Testnet and signs.

**Blocker risks:**
- Freighter must be on Testnet, not Mainnet — silent failures if wrong
- Soroban transaction building from frontend requires @stellar/stellar-sdk

---

## Day 7 — Frontend: Dashboard + Audit Log + Integration (Apr 11-12)

**Goal:** All 4 screens functional with real data + full demo rehearsed.

**Tasks:**
1. Implement Dashboard: 4 metric cards, Live Payment Feed, Spend Velocity chart
2. Implement Liquidity page: Stripe form labeled "(Test Mode)"
3. Implement Audit Log: table with STATUS, DATE, ENDPOINT, TX HASH, AMOUNT
4. TX Hash → clickable Stellar Expert link
5. System Metadata Stream — dark terminal panel with live Horizon events
6. BLOCKED row in Audit Log on contract rejection events
7. Run full demo script end-to-end per DEMO_SCRIPT.md
8. Fix any integration issues found during rehearsal

**Definition of Done:** Full DEMO_SCRIPT.md runs without improvisation. BLOCKED
row visible. TX hashes open on Stellar Expert. 15+ txs in Audit Log.

**Blocker risks:**
- Empty Audit Log if seed transactions weren't created on Day 5
- Horizon event polling may have latency — test websocket fallback

---

## Day 8 — README + Demo Video + Submission (Apr 12)

**Goal:** Submitted on DoraHacks before April 13 17:00 UTC.

**Tasks:**
1. Write README.md: problem, why Stellar, architecture, contract address,
   limitations (honest), open source declaration
2. Verify git log shows progression: docs → RED → GREEN → backend → frontend
3. Verify no secrets in repo: grep for SECRET, PRIVATE_KEY, SK1
4. Set GitHub topics: stellar, soroban, x402, ai-agents, defi, rust, hackathon
5. Pre-configure testnet state per DEMO_SCRIPT.md
6. Record 90-second demo video following the script exactly
7. Upload video to YouTube (unlisted) or Loom
8. Submit on DoraHacks: GitHub URL + video URL + description
9. Screenshot submission confirmation

**Definition of Done:** DoraHacks confirmation received. GitHub public with
README, LICENSE, contract address, video link.

**Blocker risks:**
- DoraHacks load spikes on deadline day — submit Apr 12, not Apr 13
- Video recording quality — do a test recording first
