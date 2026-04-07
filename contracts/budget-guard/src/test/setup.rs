use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::token::{StellarAssetClient, TokenClient};
use soroban_sdk::{Address, Env};

use crate::{BudgetGuardContract, BudgetGuardContractClient};

/// Default daily limit: 100 USDC (in stroops)
pub const DEFAULT_DAILY_LIMIT: i128 = 1_000_000_000; // 100 USDC * 10^7

/// Default max tx value: 50 USDC (in stroops)
pub const DEFAULT_MAX_TX: i128 = 500_000_000; // 50 USDC * 10^7

/// One USDC in stroops
pub const ONE_USDC: i128 = 10_000_000;

/// 24 hours in seconds
pub const DAY_SECONDS: u64 = 86_400;

/// Initial funding amount: 1000 USDC
pub const INITIAL_FUNDING: i128 = 10_000_000_000;

pub struct TestContext {
    pub env: Env,
    pub contract: BudgetGuardContractClient<'static>,
    pub owner: Address,
    pub agent: Address,
    pub merchant: Address,
    pub attacker: Address,
    pub usdc_token: Address,
    pub usdc_admin: Address,
    pub token_client: TokenClient<'static>,
    pub token_admin_client: StellarAssetClient<'static>,
}

/// Create all test accounts
pub fn create_accounts(env: &Env) -> (Address, Address, Address, Address) {
    let owner = Address::generate(env);
    let agent = Address::generate(env);
    let merchant = Address::generate(env);
    let attacker = Address::generate(env);
    (owner, agent, merchant, attacker)
}

/// Deploy the BudgetGuard contract and return its client
pub fn deploy_contract(env: &Env) -> BudgetGuardContractClient<'static> {
    let contract_id = env.register(BudgetGuardContract, ());
    BudgetGuardContractClient::new(env, &contract_id)
}

/// Create a test USDC token using StellarAssetClient
pub fn create_usdc_token(
    env: &Env,
) -> (Address, Address, TokenClient<'static>, StellarAssetClient<'static>) {
    let admin = Address::generate(env);
    let token_address = env.register_stellar_asset_contract_v2(admin.clone()).address();
    let token_client = TokenClient::new(env, &token_address);
    let token_admin_client = StellarAssetClient::new(env, &token_address);
    (token_address, admin, token_client, token_admin_client)
}

/// Initialize the contract with default values
pub fn init_contract(
    client: &BudgetGuardContractClient,
    owner: &Address,
    agent: &Address,
    usdc_token: &Address,
    daily_limit: i128,
    max_tx_value: i128,
) {
    client.initialize(owner, agent, usdc_token, &daily_limit, &max_tx_value);
}

/// Fund the contract with USDC by minting to owner then calling top_up
pub fn fund_contract(
    env: &Env,
    token_admin_client: &StellarAssetClient,
    usdc_admin: &Address,
    owner: &Address,
    contract: &BudgetGuardContractClient,
    amount: i128,
) {
    // Mint USDC to owner
    token_admin_client.mint(owner, &amount);

    // Owner calls top_up to deposit into the contract
    contract.top_up(owner, &amount);
}

/// Advance the ledger timestamp by the given number of seconds
pub fn advance_time(env: &Env, seconds: u64) {
    let current = env.ledger().timestamp();
    env.ledger().set_timestamp(current + seconds);
}

/// Set the ledger timestamp to a specific value
pub fn set_timestamp(env: &Env, timestamp: u64) {
    env.ledger().set_timestamp(timestamp);
}

/// Full setup: deploy, init, fund, whitelist merchant
/// Returns a ready-to-test context
pub fn setup_funded_contract() -> TestContext {
    let env = Env::default();
    env.mock_all_auths();

    // Set initial timestamp
    env.ledger().set_timestamp(1_000_000);

    let (owner, agent, merchant, attacker) = create_accounts(&env);
    let (usdc_token, usdc_admin, token_client, token_admin_client) =
        create_usdc_token(&env);

    let contract = deploy_contract(&env);

    // Initialize
    init_contract(
        &contract,
        &owner,
        &agent,
        &usdc_token,
        DEFAULT_DAILY_LIMIT,
        DEFAULT_MAX_TX,
    );

    // Whitelist merchant
    contract.whitelist_merchant(&merchant);

    // Fund the contract
    fund_contract(
        &env,
        &token_admin_client,
        &usdc_admin,
        &owner,
        &contract,
        INITIAL_FUNDING,
    );

    TestContext {
        env,
        contract,
        owner,
        agent,
        merchant,
        attacker,
        usdc_token,
        usdc_admin,
        token_client,
        token_admin_client,
    }
}
