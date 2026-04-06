# Contract Invariants

Properties the BudgetGuard contract must maintain in every possible state,
regardless of input sequence or caller identity. Each invariant maps directly
to one or more tests. If an invariant is violated, the contract has a bug.

---

## I-001: spent_today Never Exceeds daily_limit

**Assertion:** After any successful `authorize_payment`, `spent_today <= daily_limit`.

**Why it matters:** This is the core guarantee of the product. If an agent can
spend more than the daily limit, the entire governance promise is broken. An
enterprise trusting SpendGuard to limit AI spending to $10/day must never see
$10.01 spent.

**What breaks if violated:** Unlimited agent spending — the contract becomes a
pass-through with no governance. Total loss of product value proposition.

---

## I-002: token.transfer Never Executes When paused == true

**Assertion:** If `paused` is `true`, no `authorize_payment` call can reach the
`usdc_sac.transfer()` invocation. The function must return `Error::ContractPaused`
before any state mutation or token movement.

**Why it matters:** The kill switch is the last line of defense. If a paused
contract can still move funds, the emergency mechanism is theater, not protection.

**What breaks if violated:** Owner loses the ability to stop a compromised or
malfunctioning agent. Emergency response becomes impossible.

---

## I-003: spent_today Resets to 0 When now - last_reset > 86400

**Assertion:** When `env.ledger().timestamp() - last_reset > 86400`, the next
`authorize_payment` call resets `spent_today` to 0 and updates `last_reset`
before evaluating the payment.

**Why it matters:** Without reset, the daily limit becomes a lifetime limit. The
agent would be permanently blocked after one day of use.

**What breaks if violated:** Agent stops functioning after first day. Owner must
manually reset via contract upgrade — unacceptable for autonomous operation.

---

## I-004: authorize_payment Always Rejects Non-Whitelisted Merchants

**Assertion:** If `merchant` address is not in the whitelist map (or maps to
`false`), `authorize_payment` returns `Error::MerchantNotWhitelisted` regardless
of any other condition.

**Why it matters:** The whitelist controls where funds can flow. Without it, a
compromised agent could drain funds to any arbitrary address.

**What breaks if violated:** Funds sent to unauthorized addresses. No recovery
possible on a public blockchain.

---

## I-005: Only Owner Can Call Administrative Functions

**Assertion:** The following functions reject with `Error::Unauthorized` if the
caller is not the owner address stored in contract state:
- `emergency_pause`
- `emergency_unpause`
- `set_daily_limit`
- `set_max_tx`
- `whitelist_merchant`
- `remove_merchant`
- `set_agent`
- `top_up`

**Why it matters:** Administrative functions control the spending policy. If any
address can modify limits or pause the contract, the governance model collapses.

**What breaks if violated:** Unauthorized policy changes. An attacker could raise
limits to i128::MAX and drain all funds.

---

## I-006: Only Agent Can Call authorize_payment

**Assertion:** `authorize_payment` rejects with `Error::Unauthorized` if the
caller is not the agent address stored in contract state.

**Why it matters:** Only the designated agent process should trigger payments.
If any address can call `authorize_payment`, the whitelist and limits are
meaningless — anyone with a Stellar account could drain the contract up to
the daily limit.

**What breaks if violated:** Unauthorized fund extraction up to daily_limit per
day by any Stellar account holder.

---

## I-007: top_up Always Increases Contract Balance by Exactly amount

**Assertion:** After a successful `top_up(from, amount)`, the contract's USDC
balance has increased by exactly `amount` stroops. No more, no less.

**Why it matters:** The deposit flow must be exact. If the contract receives
more or less than `amount`, the dashboard balance display becomes inaccurate
and the spending calculations are wrong.

**What breaks if violated:** Balance mismatch between on-chain reality and
contract state. Could lead to either stuck funds or phantom spending capacity.

---

## I-008: spent_today Never Decreases Except During Daily Reset

**Assertion:** `spent_today` is monotonically increasing within a 24h period.
The only operation that decreases `spent_today` is the daily reset (which sets
it to 0). No function — including `top_up`, `set_daily_limit`, or
`emergency_unpause` — reduces `spent_today`.

**Why it matters:** If `spent_today` could be reduced without a time-based reset,
the daily limit could be bypassed by calling some admin function between payments.

**What breaks if violated:** Daily limit bypass via admin function sequencing.
Example: spend $9 of $10 limit → call some function that resets spent_today →
spend another $9. Total: $18 on a $10 limit.

---

## I-009: price == 0 Must Be Rejected

**Assertion:** `authorize_payment` returns `Error::InvalidAmount` when `price` is
0 (or negative, if applicable to i128 signed handling).

**Why it matters:** A zero-amount payment serves no legitimate purpose but would
still generate on-chain events and increment transaction counters. It could be
used for event spam or to obscure real transactions in the Audit Log.

**What breaks if violated:** Event pollution, misleading Audit Log data, potential
griefing via free transaction spam.

---

## I-010: Contract Balance Never Goes Below 0

**Assertion:** The USDC SAC enforces this at the token level — a transfer that
would result in a negative balance will fail. The contract must check balance
before attempting the transfer (`Error::InsufficientBalance`) to provide a
clear error rather than an opaque SAC failure.

**Why it matters:** A clear error message ("insufficient balance") is better UX
than a generic SAC transfer failure. The pre-check also prevents wasted gas on
a transaction that will fail at the SAC level.

**What breaks if violated:** Cannot actually violate (SAC enforces), but without
the pre-check, error messages are unclear and gas is wasted.

---

## I-011: initialize Can Only Be Called Once

**Assertion:** After `initialize()` succeeds, any subsequent call returns
`Error::AlreadyInitialized`. Contract storage cannot be re-initialized.

**Why it matters:** Re-initialization would allow an attacker to change the owner,
agent, or USDC token address — completely compromising the contract.

**What breaks if violated:** Full contract takeover. Attacker re-initializes with
their own address as owner, drains all funds.

---

## I-012: max_tx_value Is Always <= daily_limit

**Assertion:** After any `set_max_tx` or `set_daily_limit` call, `max_tx_value <=
daily_limit`. The contract rejects configurations that violate this.

**Why it matters:** If `max_tx_value` > `daily_limit`, the limits are contradictory.
A single transaction could exceed the daily limit but pass the max_tx check,
creating undefined behavior in the spending logic.

**What breaks if violated:** Contradictory limits that confuse the authorization
logic and produce unpredictable spending behavior.
