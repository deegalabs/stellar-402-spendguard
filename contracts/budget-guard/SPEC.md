# BudgetGuard Contract Specification

Formal specification for the BudgetGuard Soroban smart contract.
This document is the source of truth for implementation and testing.
Every function signature, storage key, error variant, and event must
match this spec exactly.

**All monetary values are in USDC stroops (i128). 1 USDC = 10_000_000 stroops.**

---

## Storage Schema

All storage uses Instance storage (lives as long as the contract instance).

| Key (DataKey) | Type | Description |
|---------------|------|-------------|
| `Owner` | `Address` | Owner address — can call all admin functions |
| `Agent` | `Address` | Agent address — the only address that can call `authorize_payment` |
| `DailyLimit` | `i128` | Maximum USDC (stroops) the agent can spend per 24h period |
| `MaxTxValue` | `i128` | Maximum USDC (stroops) per single transaction |
| `SpentToday` | `i128` | USDC (stroops) spent in the current 24h period |
| `LastReset` | `u64` | Ledger timestamp (seconds) of the last daily reset |
| `Paused` | `bool` | If true, all `authorize_payment` calls are rejected |
| `Whitelist` | `Map<Address, bool>` | Approved merchant addresses |
| `UsdcToken` | `Address` | Address of the USDC SAC contract |
| `Initialized` | `bool` | Whether `initialize()` has been called |

---

## Initialization

### `initialize(env, owner, agent, usdc_token, daily_limit, max_tx_value)`

Must be called exactly once before any other function.

| Parameter | Type | Description |
|-----------|------|-------------|
| `owner` | `Address` | Owner address |
| `agent` | `Address` | Agent address |
| `usdc_token` | `Address` | USDC SAC address on this network |
| `daily_limit` | `i128` | Initial daily spending limit (stroops) |
| `max_tx_value` | `i128` | Initial max per-transaction value (stroops) |

**Preconditions:**
- `Initialized` must be `false` (or absent)
- `daily_limit` > 0
- `max_tx_value` > 0
- `max_tx_value` <= `daily_limit`

**Postconditions:**
- All storage keys are set to their initial values
- `SpentToday` = 0
- `LastReset` = `env.ledger().timestamp()`
- `Paused` = false
- `Initialized` = true

**Errors:** `AlreadyInitialized`, `InvalidAmount`

---

## Public Functions

### `authorize_payment(env, price, merchant) -> Result<(), Error>`

The core function. Called by the agent to authorize a USDC payment.

| Parameter | Type | Description |
|-----------|------|-------------|
| `price` | `i128` | Amount in USDC stroops |
| `merchant` | `Address` | Recipient Stellar address |

**Auth required:** Agent (`agent.require_auth()`)

**Preconditions (checked in this order):**
1. Contract is initialized
2. `paused` == false → else `Error::ContractPaused`
3. Caller is `agent` → else `Error::Unauthorized`
4. `price` > 0 → else `Error::InvalidAmount`
5. `price` <= `max_tx_value` → else `Error::ExceedsMaxTx`
6. `merchant` is in whitelist → else `Error::MerchantNotWhitelisted`
7. Daily reset check: if `env.ledger().timestamp() - last_reset > 86400`,
   reset `spent_today = 0` and `last_reset = env.ledger().timestamp()`
8. `spent_today + price <= daily_limit` → else `Error::ExceedsDailyLimit`
9. `spent_today + price` does not overflow → else `Error::ArithmeticOverflow`
10. Contract USDC balance >= price → else `Error::InsufficientBalance`

**Side effects (if all checks pass):**
- Calls `usdc_sac.transfer(contract_address, merchant, price)`
- Updates `spent_today += price`
- Emits `payment_authorized` event

**Returns:** `Ok(())` on success

---

### `top_up(env, from, amount) -> Result<(), Error>`

Deposits USDC into the contract. Called by the owner after a Stripe webhook.

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | `Address` | Source address (must be owner) |
| `amount` | `i128` | Amount in USDC stroops |

**Auth required:** `from.require_auth()`

**Preconditions:**
1. Contract is initialized
2. `from` == owner → else `Error::Unauthorized`
3. `amount` > 0 → else `Error::InvalidAmount`

**Side effects:**
- Calls `usdc_sac.transfer(from, contract_address, amount)`
- Emits `top_up_completed` event with amount

---

### `set_daily_limit(env, amount) -> Result<(), Error>`

| Parameter | Type | Description |
|-----------|------|-------------|
| `amount` | `i128` | New daily limit in USDC stroops |

**Auth required:** Owner

**Preconditions:**
- `amount` > 0 → else `Error::InvalidAmount`
- `amount` >= `max_tx_value` → else `Error::InvalidAmount`

**Side effects:**
- Updates `DailyLimit` storage
- Emits `limit_updated` event

---

### `set_max_tx(env, amount) -> Result<(), Error>`

| Parameter | Type | Description |
|-----------|------|-------------|
| `amount` | `i128` | New max per-transaction value in USDC stroops |

**Auth required:** Owner

**Preconditions:**
- `amount` > 0 → else `Error::InvalidAmount`
- `amount` <= `daily_limit` → else `Error::InvalidAmount`

**Side effects:**
- Updates `MaxTxValue` storage
- Emits `max_tx_updated` event

---

### `whitelist_merchant(env, merchant) -> Result<(), Error>`

**Auth required:** Owner

**Side effects:**
- Sets `whitelist.set(merchant, true)`
- Emits `merchant_whitelisted` event

---

### `remove_merchant(env, merchant) -> Result<(), Error>`

**Auth required:** Owner

**Side effects:**
- Removes merchant from whitelist map
- Emits `merchant_removed` event

---

### `emergency_pause(env) -> Result<(), Error>`

**Auth required:** Owner

**Preconditions:**
- `paused` == false → else `Error::AlreadyPaused`

**Side effects:**
- Sets `Paused` = true
- Emits `emergency_pause` event with timestamp

**Important:** Does NOT cancel in-flight transactions. See ADR-005.

---

### `emergency_unpause(env) -> Result<(), Error>`

**Auth required:** Owner

**Preconditions:**
- `paused` == true → else `Error::NotPaused`

**Side effects:**
- Sets `Paused` = false
- Emits `emergency_unpause` event with timestamp

---

### `set_agent(env, new_agent) -> Result<(), Error>`

**Auth required:** Owner

**Side effects:**
- Updates `Agent` storage to `new_agent`
- Emits `agent_updated` event

---

### `get_status(env) -> ContractStatus`

**Auth required:** None (read-only)

**Returns:**
```rust
pub struct ContractStatus {
    pub owner: Address,
    pub agent: Address,
    pub daily_limit: i128,
    pub max_tx_value: i128,
    pub spent_today: i128,
    pub last_reset: u64,
    pub paused: bool,
    pub balance: i128,    // current USDC balance of the contract
}
```

---

## Error Enum

```rust
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    ContractPaused = 4,
    ExceedsDailyLimit = 5,
    ExceedsMaxTx = 6,
    MerchantNotWhitelisted = 7,
    InvalidAmount = 8,
    InsufficientBalance = 9,
    ArithmeticOverflow = 10,
    AlreadyPaused = 11,
    NotPaused = 12,
    MerchantAlreadyWhitelisted = 13,
}
```

---

## Events

All events use `env.events().publish()` with structured topics.

| Event | Topic | Data | When |
|-------|-------|------|------|
| `payment_authorized` | `("SpendGuard", "payment")` | `(merchant: Address, price: i128, spent_today: i128)` | After successful authorize_payment |
| `payment_rejected` | `("SpendGuard", "rejected")` | `(merchant: Address, price: i128, reason: Error)` | When authorize_payment fails a policy check |
| `top_up_completed` | `("SpendGuard", "topup")` | `(from: Address, amount: i128)` | After successful top_up |
| `emergency_pause` | `("SpendGuard", "pause")` | `(timestamp: u64)` | After emergency_pause |
| `emergency_unpause` | `("SpendGuard", "unpause")` | `(timestamp: u64)` | After emergency_unpause |
| `limit_updated` | `("SpendGuard", "limit")` | `(new_limit: i128)` | After set_daily_limit |
| `max_tx_updated` | `("SpendGuard", "max_tx")` | `(new_max: i128)` | After set_max_tx |
| `merchant_whitelisted` | `("SpendGuard", "whitelist")` | `(merchant: Address)` | After whitelist_merchant |
| `merchant_removed` | `("SpendGuard", "remove")` | `(merchant: Address)` | After remove_merchant |
| `agent_updated` | `("SpendGuard", "agent")` | `(new_agent: Address)` | After set_agent |
| `daily_reset` | `("SpendGuard", "reset")` | `(previous_spent: i128, timestamp: u64)` | When daily reset triggers inside authorize_payment |

---

## Access Control Matrix

| Function | Owner | Agent | Anyone |
|----------|-------|-------|--------|
| `initialize` | Yes (first call only) | No | No |
| `authorize_payment` | No | Yes | No |
| `top_up` | Yes | No | No |
| `set_daily_limit` | Yes | No | No |
| `set_max_tx` | Yes | No | No |
| `whitelist_merchant` | Yes | No | No |
| `remove_merchant` | Yes | No | No |
| `emergency_pause` | Yes | No | No |
| `emergency_unpause` | Yes | No | No |
| `set_agent` | Yes | No | No |
| `get_status` | Yes | Yes | Yes |
