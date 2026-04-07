use soroban_sdk::testutils::Ledger;
use soroban_sdk::Env;

use super::setup::*;

// =============================================================================
// BOUNDARY TESTS — Test at exact edges of valid/invalid inputs
// From TEST_STRATEGY.md Category 1 and SPEC.md preconditions
// =============================================================================

/// Price exactly at daily_limit should succeed
#[test]
fn test_price_exactly_at_daily_limit() {
    let ctx = setup_funded_contract();
    // spent=0, price=daily_limit → should succeed
    let result = ctx.contract.try_authorize_payment(&DEFAULT_DAILY_LIMIT, &ctx.merchant);
    assert!(result.is_ok(), "Price exactly at daily_limit should succeed");
}

/// Price one above daily_limit should fail with ExceedsDailyLimit
#[test]
fn test_price_one_above_daily_limit() {
    let ctx = setup_funded_contract();
    let result = ctx.contract.try_authorize_payment(&(DEFAULT_DAILY_LIMIT + 1), &ctx.merchant);
    assert!(result.is_err(), "Price above daily_limit must be rejected");
}

/// Cumulative spending at exactly daily_limit should succeed
#[test]
fn test_cumulative_exactly_at_daily_limit() {
    let ctx = setup_funded_contract();
    // First payment: 60% of limit
    let first_payment = DEFAULT_DAILY_LIMIT * 60 / 100;
    ctx.contract.authorize_payment(&first_payment, &ctx.merchant);

    // Second payment: remaining 40% — should succeed (total = 100%)
    let second_payment = DEFAULT_DAILY_LIMIT - first_payment;
    let result = ctx.contract.try_authorize_payment(&second_payment, &ctx.merchant);
    assert!(result.is_ok(), "Cumulative at exactly daily_limit should succeed");
}

/// Cumulative spending one above daily_limit should fail
#[test]
fn test_cumulative_one_above_daily_limit() {
    let ctx = setup_funded_contract();
    let first_payment = DEFAULT_DAILY_LIMIT * 60 / 100;
    ctx.contract.authorize_payment(&first_payment, &ctx.merchant);

    // Try to spend remaining + 1 — should fail
    let over_payment = DEFAULT_DAILY_LIMIT - first_payment + 1;
    let result = ctx.contract.try_authorize_payment(&over_payment, &ctx.merchant);
    assert!(result.is_err(), "Cumulative above daily_limit must be rejected");
}

/// Price exactly at max_tx_value should succeed
#[test]
fn test_price_exactly_at_max_tx() {
    let ctx = setup_funded_contract();
    let result = ctx.contract.try_authorize_payment(&DEFAULT_MAX_TX, &ctx.merchant);
    assert!(result.is_ok(), "Price exactly at max_tx should succeed");
}

/// Price one above max_tx_value should fail with ExceedsMaxTx
#[test]
fn test_price_one_above_max_tx() {
    let ctx = setup_funded_contract();
    let result = ctx.contract.try_authorize_payment(&(DEFAULT_MAX_TX + 1), &ctx.merchant);
    assert!(result.is_err(), "Price above max_tx must be rejected");
}

/// No reset at 86399 seconds — spent_today should accumulate
#[test]
fn test_no_reset_at_86399_seconds() {
    let ctx = setup_funded_contract();
    let payment = ONE_USDC;
    ctx.contract.authorize_payment(&payment, &ctx.merchant);

    // Advance to 86399 seconds — NOT enough for reset
    advance_time(&ctx.env, DAY_SECONDS - 1);

    // Second payment should accumulate (no reset)
    ctx.contract.authorize_payment(&payment, &ctx.merchant);

    let status = ctx.contract.get_status();
    assert_eq!(
        status.spent_today,
        payment * 2,
        "spent_today should accumulate without reset at 86399s"
    );
}

/// No reset at exactly 86400 seconds (boundary — not strictly greater)
#[test]
fn test_no_reset_at_86400_seconds() {
    let ctx = setup_funded_contract();
    let payment = ONE_USDC;
    ctx.contract.authorize_payment(&payment, &ctx.merchant);

    // Advance to exactly 86400 seconds — boundary, should NOT reset
    advance_time(&ctx.env, DAY_SECONDS);

    ctx.contract.authorize_payment(&payment, &ctx.merchant);

    let status = ctx.contract.get_status();
    assert_eq!(
        status.spent_today,
        payment * 2,
        "spent_today should accumulate at exactly 86400s (not strictly greater)"
    );
}

/// Reset at 86401 seconds — spent_today should reset
#[test]
fn test_reset_at_86401_seconds() {
    let ctx = setup_funded_contract();
    let payment = ONE_USDC;
    ctx.contract.authorize_payment(&payment, &ctx.merchant);

    // Advance to 86401 seconds — reset should trigger
    advance_time(&ctx.env, DAY_SECONDS + 1);

    ctx.contract.authorize_payment(&payment, &ctx.merchant);

    let status = ctx.contract.get_status();
    assert_eq!(
        status.spent_today, payment,
        "spent_today should be only the latest payment after reset at 86401s"
    );
}

/// Zero price should be rejected with InvalidAmount
#[test]
fn test_zero_price_rejected() {
    let ctx = setup_funded_contract();
    let result = ctx.contract.try_authorize_payment(&0_i128, &ctx.merchant);
    assert!(result.is_err(), "Zero price must be rejected");
}

/// Balance exactly equal to price should succeed
#[test]
fn test_balance_exactly_equals_price() {
    let ctx = setup_funded_contract();
    // Fund with exactly the price amount (reset funding first by spending)
    // Use a fresh contract with exact balance
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000_000);

    let (owner, agent, merchant, _) = create_accounts(&env);
    let (usdc_token, _, _, token_admin_client) = create_usdc_token(&env);
    let contract = deploy_contract(&env);

    let exact_amount = ONE_USDC * 5; // 5 USDC
    init_contract(&contract, &owner, &agent, &usdc_token, ONE_USDC * 100, exact_amount);
    contract.whitelist_merchant(&merchant);
    token_admin_client.mint(&owner, &exact_amount);
    contract.top_up(&owner, &exact_amount);

    // Price equals entire balance — should succeed
    let result = contract.try_authorize_payment(&exact_amount, &merchant);
    assert!(result.is_ok(), "Price exactly equal to balance should succeed");
}

/// Balance one below price should fail with InsufficientBalance
#[test]
fn test_balance_one_below_price() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000_000);

    let (owner, agent, merchant, _) = create_accounts(&env);
    let (usdc_token, _, _, token_admin_client) = create_usdc_token(&env);
    let contract = deploy_contract(&env);

    let balance = ONE_USDC * 5;
    let price = balance + 1; // One stroops more than balance
    init_contract(&contract, &owner, &agent, &usdc_token, ONE_USDC * 100, price);
    contract.whitelist_merchant(&merchant);
    token_admin_client.mint(&owner, &balance);
    contract.top_up(&owner, &balance);

    let result = contract.try_authorize_payment(&price, &merchant);
    assert!(result.is_err(), "Price above balance must be rejected");
}

/// Zero top_up amount should be rejected with InvalidAmount
#[test]
fn test_zero_top_up_rejected() {
    let ctx = setup_funded_contract();
    let result = ctx.contract.try_top_up(&ctx.owner, &0_i128);
    assert!(result.is_err(), "Zero top_up amount must be rejected");
}
