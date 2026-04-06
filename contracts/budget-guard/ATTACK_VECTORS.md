# Attack Vectors

Every known attack surface for the BudgetGuard contract. Each vector describes
the attack, the expected defense, and the test that proves the defense works.

---

## AV-001: Replay Attack

**Attack:** An attacker captures a valid `authorize_payment` transaction payload
and submits it a second time, attempting to drain funds by replaying the same
authorization.

**Defense:** Soroban transactions include a unique sequence number and ledger
bounds. The Stellar ledger rejects duplicate transactions at the protocol level.
Additionally, `spent_today` increments on each successful call, so even if a
replay were possible, the daily limit would still apply.

**Test:** Call `authorize_payment` with identical parameters twice in the same
test. First call succeeds. Verify `spent_today` increased. Second call should
either succeed (if within limits — proving idempotency is safe) or fail (if it
exceeds the daily limit — proving the limit holds across calls).

---

## AV-002: Integer Overflow

**Attack:** Submit `price = i128::MAX` when `spent_today = 1`. The addition
`spent_today + price` overflows i128, potentially wrapping to a negative number
that passes the `<= daily_limit` check.

**Defense:** Use `checked_add()` for all i128 arithmetic. If the addition
overflows, return `Error::ArithmeticOverflow` before any state mutation or
token transfer.

**Test:** Set `spent_today = 1` (by making one small payment first). Call
`authorize_payment(i128::MAX, merchant)`. Must return `Error::ArithmeticOverflow`.
Verify `spent_today` did not change. Verify no USDC was transferred.

---

## AV-003: Unauthorized Caller — Non-Agent Calls authorize_payment

**Attack:** An address that is not the designated agent calls `authorize_payment`,
attempting to trigger USDC transfers.

**Defense:** `authorize_payment` calls `agent.require_auth()` at the start.
Soroban Auth Framework rejects the call if the transaction was not signed by
the agent's keypair.

**Test:** Create a third-party address (not owner, not agent). Call
`authorize_payment` from this address. Must fail with authorization error.
Verify no USDC was transferred and `spent_today` is unchanged.

---

## AV-004: Owner Impersonation

**Attack:** A non-owner address calls administrative functions (`set_daily_limit`,
`emergency_pause`, `whitelist_merchant`, etc.) to change spending policies.

**Defense:** Every admin function calls `owner.require_auth()`. Soroban Auth
Framework rejects calls not signed by the owner.

**Test:** For each admin function, call it from a non-owner address. Must fail
with authorization error. Verify no storage was modified.

---

## AV-005: Whitelist Bypass

**Attack:** Call `authorize_payment` with a merchant address that has not been
whitelisted, hoping to redirect funds to an unauthorized recipient.

**Defense:** `authorize_payment` checks `whitelist.get(merchant).unwrap_or(false)`
before proceeding. Non-whitelisted merchants are rejected with
`Error::MerchantNotWhitelisted`.

**Test:** Set up a funded contract with one whitelisted merchant. Call
`authorize_payment` with a different, non-whitelisted merchant address. Must
return `Error::MerchantNotWhitelisted`. Verify no USDC was transferred.

---

## AV-006: Paused Bypass

**Attack:** Call `authorize_payment` when the contract is paused, hoping the
pause check has a logic error or race condition.

**Defense:** `authorize_payment` checks `paused == true` as the FIRST validation
step (after initialization check). The check happens before any other logic,
state reads, or token operations.

**Test:** Call `emergency_pause()`. Then call `authorize_payment` with valid
parameters (correct agent, whitelisted merchant, within limits). Must return
`Error::ContractPaused`. Verify no USDC was transferred and `spent_today` is
unchanged.

---

## AV-007: Daily Limit Bypass via Multiple Calls

**Attack:** Make multiple small payments that individually pass the `max_tx_value`
check but collectively exceed the `daily_limit`. For example, with
`daily_limit = 100` and `max_tx_value = 50`: make three payments of 40 each
(total 120 > daily_limit).

**Defense:** `authorize_payment` checks `spent_today + price <= daily_limit` on
every call. The third call (spent_today=80, price=40, sum=120 > 100) is rejected
with `Error::ExceedsDailyLimit`.

**Test:** Set `daily_limit = 100`, `max_tx_value = 50`. Make payment of 40
(success, spent=40). Make payment of 40 (success, spent=80). Make payment of 40
(must fail: 80+40=120 > 100). Verify `spent_today` remains at 80 after rejection.

---

## AV-008: Zero-Amount Griefing

**Attack:** Call `top_up(owner, 0)` or `authorize_payment(0, merchant)` repeatedly
to spam on-chain events without spending anything. This pollutes the Audit Log
and wastes network resources.

**Defense:** Both `top_up` and `authorize_payment` check `amount > 0` /
`price > 0` and return `Error::InvalidAmount` for zero values. No event is
emitted for rejected calls (only `payment_rejected` event, which is useful
for the Audit Log).

**Test:** Call `authorize_payment(0, whitelisted_merchant)`. Must return
`Error::InvalidAmount`. Call `top_up(owner, 0)`. Must return `Error::InvalidAmount`.
Verify no state changes occurred.

---

## AV-009: Ledger Timestamp Edge Case

**Attack:** Call `authorize_payment` at exactly the 86400-second boundary,
attempting to exploit off-by-one errors in the daily reset logic.

**Defense:** The reset condition is `now - last_reset > 86400` (strictly greater
than). At exactly 86400, the reset does NOT trigger. At 86401, it does. This is
a deliberate design choice — 24 hours means 24 full hours.

**Test three scenarios:**
1. Set timestamp to `last_reset + 86399`. Make payment. `spent_today` accumulates
   (no reset). Expected: reset does NOT trigger.
2. Set timestamp to `last_reset + 86400`. Make payment. Expected: reset does NOT
   trigger (boundary — 86400 is not > 86400).
3. Set timestamp to `last_reset + 86401`. Make payment. Expected: reset DOES
   trigger. `spent_today` should equal only the current payment, not the
   accumulated total.

---

## AV-010: SAC Transfer Failure Mid-Execution

**Attack:** The USDC SAC transfer fails (e.g., insufficient balance in the
contract) after the contract has already updated `spent_today`. This would
create a state where `spent_today` reflects a payment that never actually
moved funds.

**Defense:** The contract checks the USDC balance before attempting the transfer
(`Error::InsufficientBalance`). If the pre-check passes but the SAC transfer
still fails (unexpected error), Soroban's transaction atomicity ensures the
entire transaction reverts — including the `spent_today` update. No partial
state is possible.

**Test:** Fund the contract with 5 USDC. Set `daily_limit` to 100 USDC. Call
`authorize_payment(10_USDC, merchant)`. Must return `Error::InsufficientBalance`
(pre-check catches it). Verify `spent_today` is unchanged. Verify contract
balance is unchanged.
