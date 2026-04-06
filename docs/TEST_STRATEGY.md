# Test Strategy

Testing philosophy, structure, and execution plan for the BudgetGuard contract
and backend. This document defines what makes a test valuable, how tests are
organized, and what the TDD workflow looks like in practice.

---

## Philosophy: Destructive TDD

Standard TDD writes a test, watches it fail, implements until it passes.
SpendGuard uses **destructive TDD** — tests are designed to break naive
implementations.

### What Makes a Test Valuable

A valuable test:
- **Fails on the first naive implementation** — if a test passes before you
  write real logic, the test is not testing anything
- **Tests behavior at boundaries** — not in the comfortable middle
- **Attempts to violate invariants** — tries to break the contract, not confirm it
- **Simulates real attacks** — not just happy-path usage

A worthless test:
- Passes on a stub that returns hardcoded values
- Only tests the happy path with comfortable margins
- Duplicates another test with different variable names
- Tests implementation details instead of behavior

### The Red-Green Commit Pattern

The git history MUST show:
1. **RED commit** — all tests written, all tests failing (stubs panic)
2. **GREEN commit** — implementation complete, all tests passing

This is not just methodology — it is evidence for hackathon judges that TDD
was actually practiced. Squashing these commits destroys the evidence.

---

## Three Test Categories

### Category 1: Boundary Tests

Test at the exact edge of valid/invalid inputs. Not in the middle.

**Pattern:**
```
Given: daily_limit = 100
Test A: price = 99  → PASS  (one below limit)
Test B: price = 100 → PASS  (exactly at limit)
Test C: price = 101 → FAIL with ExceedsDailyLimit (one above)
```

**Contract boundary tests (~13):**

| Test | Input | Expected |
|------|-------|----------|
| Price exactly at daily_limit | spent=0, price=daily_limit | Success |
| Price one above daily_limit | spent=0, price=daily_limit+1 | ExceedsDailyLimit |
| Cumulative at daily_limit | spent=60, price=40, limit=100 | Success |
| Cumulative one above daily_limit | spent=60, price=41, limit=100 | ExceedsDailyLimit |
| Price exactly at max_tx | price=max_tx | Success |
| Price one above max_tx | price=max_tx+1 | ExceedsMaxTx |
| Reset at 86399 seconds | now-last_reset=86399 | No reset, spent accumulates |
| Reset at 86400 seconds | now-last_reset=86400 | No reset (not strictly greater) |
| Reset at 86401 seconds | now-last_reset=86401 | Reset triggers, spent=0 |
| Zero price | price=0 | InvalidAmount |
| Negative price (if applicable) | price=-1 | InvalidAmount |
| Balance exactly equal to price | balance=price | Success |
| Balance one below price | balance=price-1 | InsufficientBalance |

### Category 2: Invariant Violation Tests

One test per invariant in INVARIANTS.md. Each test directly attempts to break
the invariant.

**Contract invariant tests (12):**

| Test | Invariant | Attack | Expected |
|------|-----------|--------|----------|
| I-001 | spent <= daily_limit | Multiple calls summing above limit | Last call rejected |
| I-002 | No transfer when paused | Pause then authorize | ContractPaused |
| I-003 | Reset after 86400s | Advance time, authorize | spent_today = price only |
| I-004 | Reject non-whitelisted | Authorize to unknown address | MerchantNotWhitelisted |
| I-005 | Only owner calls admin | Non-owner calls set_daily_limit | Unauthorized |
| I-006 | Only agent calls authorize | Non-agent calls authorize | Unauthorized |
| I-007 | top_up exact amount | Top up 1000, check balance | Balance increased by exactly 1000 |
| I-008 | spent_today monotonic | Top up between payments | spent_today unchanged by top_up |
| I-009 | Zero price rejected | authorize(0, merchant) | InvalidAmount |
| I-010 | Balance >= 0 | Authorize more than balance | InsufficientBalance |
| I-011 | Initialize once | Call initialize twice | AlreadyInitialized |
| I-012 | max_tx <= daily_limit | Set max_tx > daily_limit | InvalidAmount |

### Category 3: Attack Simulation Tests

One test per vector in ATTACK_VECTORS.md.

**Contract attack tests (12):**

| Test | Vector | Attack | Expected |
|------|--------|--------|----------|
| AV-001 | Replay | Submit same payment twice | Second limited by spent_today |
| AV-002 | Overflow | price=i128::MAX, spent=1 | ArithmeticOverflow |
| AV-003 | Unauthorized agent | Third-party calls authorize | Auth failure |
| AV-004 | Owner impersonation | Non-owner calls pause | Auth failure |
| AV-005 | Whitelist bypass | Pay non-whitelisted merchant | MerchantNotWhitelisted |
| AV-006 | Paused bypass | Authorize when paused | ContractPaused |
| AV-007 | Daily limit bypass | Three payments exceeding total | Third rejected |
| AV-008a | Zero-amount griefing (payment) | authorize(0, merchant) | InvalidAmount |
| AV-008b | Zero-amount griefing (top_up) | top_up(owner, 0) | InvalidAmount |
| AV-009 | Timestamp edge | Test at 86399, 86400, 86401 | Reset only at 86401 |
| AV-010 | SAC failure | Authorize > balance | InsufficientBalance |
| AV-010b | Re-initialization | Initialize a second time | AlreadyInitialized |

---

## Test File Structure

### Contract (Rust)

```
contracts/budget-guard/
├── src/
│   ├── lib.rs            # Contract + function stubs
│   ├── error.rs          # Error enum
│   ├── storage.rs        # DataKey enum
│   ├── events.rs         # Event helpers
│   └── test/
│       ├── mod.rs         # Module declarations
│       ├── setup.rs       # Test helpers: deploy, init, fund, advance_time
│       ├── boundary_test.rs    # ~13 boundary tests
│       ├── invariant_test.rs   # 12 invariant tests
│       └── attack_test.rs      # 12 attack tests
```

### Backend (TypeScript)

```
backend/
├── src/
│   └── __tests__/
│       ├── setup.ts              # Test helpers
│       ├── x402-flow.test.ts     # Full 402 cycle integration
│       ├── stripe-webhook.test.ts # Webhook processing
│       └── dashboard-api.test.ts  # Dashboard endpoint tests
```

---

## Test Helpers (setup.rs)

The setup module provides reusable helpers:

- `deploy_contract(env)` — registers and returns the contract client
- `init_contract(client, owner, agent, usdc, limit, max_tx)` — calls initialize
- `fund_contract(env, usdc_client, owner, contract, amount)` — deposits USDC
- `create_accounts(env)` — creates owner, agent, merchant, attacker addresses
- `advance_time(env, seconds)` — moves ledger timestamp forward
- `create_usdc_token(env, admin)` — creates a test USDC SAC
- `setup_funded_contract(env)` — convenience: deploy + init + fund + whitelist

---

## Running Tests

### Contract
```bash
# Run all tests
cargo test

# Run specific category
cargo test boundary
cargo test invariant
cargo test attack

# Run single test
cargo test test_price_exactly_at_daily_limit

# Show output
cargo test -- --nocapture
```

### Backend
```bash
cd backend
npm test

# Run specific file
npm test -- x402-flow

# Watch mode
npm test -- --watch
```

---

## Coverage Expectations

| Component | Target | Rationale |
|-----------|--------|-----------|
| `authorize_payment` | 100% branch | Core function — every path must be tested |
| `emergency_pause/unpause` | 100% branch | Safety-critical |
| `top_up` | 100% branch | Financial operation |
| `set_daily_limit/set_max_tx` | 100% branch | Validation logic |
| `whitelist_merchant/remove_merchant` | 90%+ | Straightforward CRUD |
| `get_status` | 80%+ | Read-only, lower risk |
| Backend x402 flow | 100% happy + error paths | Demo-critical |
| Backend Stripe webhook | 90%+ | Simulated, lower risk |

---

## What NOT to Mock

- **Stellar ledger behavior** — integration tests must use actual Testnet
- **Soroban Auth Framework** — use `env.mock_all_auths()` in unit tests but
  test real auth in at least one integration test
- **USDC SAC token operations** — use `StellarAssetClient` in tests, not a
  mock token with different behavior
- **Ledger timestamps** — use `env.ledger().set()` to control time, do not
  replace the timestamp mechanism
