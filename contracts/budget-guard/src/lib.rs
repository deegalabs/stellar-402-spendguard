#![no_std]

mod error;
mod events;
mod storage;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

pub use crate::error::Error;
pub use crate::storage::DataKey;

const DAY_SECONDS: u64 = 86_400;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContractStatus {
    pub owner: Address,
    pub agent: Address,
    pub daily_limit: i128,
    pub max_tx_value: i128,
    pub spent_today: i128,
    pub last_reset: u64,
    pub paused: bool,
    pub balance: i128,
}

#[contract]
pub struct BudgetGuardContract;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

fn require_initialized(env: &Env) -> Result<(), Error> {
    let initialized: bool = env
        .storage()
        .instance()
        .get(&DataKey::Initialized)
        .unwrap_or(false);
    if !initialized {
        return Err(Error::NotInitialized);
    }
    Ok(())
}

fn require_owner(env: &Env) -> Result<Address, Error> {
    require_initialized(env)?;
    let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
    owner.require_auth();
    Ok(owner)
}

fn usdc_client(env: &Env) -> token::Client {
    let usdc_addr: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
    token::Client::new(env, &usdc_addr)
}

fn maybe_reset_daily(env: &Env) {
    let now = env.ledger().timestamp();
    let last_reset: u64 = env
        .storage()
        .instance()
        .get(&DataKey::LastReset)
        .unwrap_or(0);

    // Strictly greater than — at exactly 86400 the reset does NOT trigger
    if now - last_reset > DAY_SECONDS {
        let previous_spent: i128 = env
            .storage()
            .instance()
            .get(&DataKey::SpentToday)
            .unwrap_or(0);
        env.storage().instance().set(&DataKey::SpentToday, &0_i128);
        env.storage().instance().set(&DataKey::LastReset, &now);
        events::emit_daily_reset(env, previous_spent);
    }
}

// ---------------------------------------------------------------------------
// Contract implementation
// ---------------------------------------------------------------------------

#[contractimpl]
impl BudgetGuardContract {
    /// Initialize the contract. Must be called exactly once.
    pub fn initialize(
        env: Env,
        owner: Address,
        agent: Address,
        usdc_token: Address,
        daily_limit: i128,
        max_tx_value: i128,
    ) -> Result<(), Error> {
        let initialized: bool = env
            .storage()
            .instance()
            .get(&DataKey::Initialized)
            .unwrap_or(false);
        if initialized {
            return Err(Error::AlreadyInitialized);
        }

        if daily_limit <= 0 || max_tx_value <= 0 {
            return Err(Error::InvalidAmount);
        }
        if max_tx_value > daily_limit {
            return Err(Error::InvalidAmount);
        }

        let now = env.ledger().timestamp();

        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Agent, &agent);
        env.storage().instance().set(&DataKey::UsdcToken, &usdc_token);
        env.storage().instance().set(&DataKey::DailyLimit, &daily_limit);
        env.storage().instance().set(&DataKey::MaxTxValue, &max_tx_value);
        env.storage().instance().set(&DataKey::SpentToday, &0_i128);
        env.storage().instance().set(&DataKey::LastReset, &now);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::Initialized, &true);

        Ok(())
    }

    /// Authorize a USDC payment from the contract to a merchant.
    /// Called by the agent. Validates all spending policies.
    pub fn authorize_payment(
        env: Env,
        price: i128,
        merchant: Address,
    ) -> Result<(), Error> {
        require_initialized(&env)?;

        // 1. Check paused
        let paused: bool = env.storage().instance().get(&DataKey::Paused).unwrap_or(false);
        if paused {
            events::emit_payment_rejected(&env, &merchant, price, Error::ContractPaused);
            return Err(Error::ContractPaused);
        }

        // 2. Check caller is agent
        let agent: Address = env.storage().instance().get(&DataKey::Agent).unwrap();
        agent.require_auth();

        // 3. Check price > 0
        if price <= 0 {
            events::emit_payment_rejected(&env, &merchant, price, Error::InvalidAmount);
            return Err(Error::InvalidAmount);
        }

        // 4. Check max tx value
        let max_tx: i128 = env.storage().instance().get(&DataKey::MaxTxValue).unwrap();
        if price > max_tx {
            events::emit_payment_rejected(&env, &merchant, price, Error::ExceedsMaxTx);
            return Err(Error::ExceedsMaxTx);
        }

        // 5. Check whitelist
        let whitelisted: bool = env
            .storage()
            .instance()
            .get(&DataKey::Whitelist(merchant.clone()))
            .unwrap_or(false);
        if !whitelisted {
            events::emit_payment_rejected(&env, &merchant, price, Error::MerchantNotWhitelisted);
            return Err(Error::MerchantNotWhitelisted);
        }

        // 6. Daily reset check
        maybe_reset_daily(&env);

        // 7. Check daily limit
        let daily_limit: i128 = env.storage().instance().get(&DataKey::DailyLimit).unwrap();
        let spent_today: i128 = env.storage().instance().get(&DataKey::SpentToday).unwrap_or(0);

        let new_spent = spent_today.checked_add(price).ok_or(Error::ArithmeticOverflow)?;
        if new_spent > daily_limit {
            events::emit_payment_rejected(&env, &merchant, price, Error::ExceedsDailyLimit);
            return Err(Error::ExceedsDailyLimit);
        }

        // 8. Check balance
        let usdc = usdc_client(&env);
        let contract_addr = env.current_contract_address();
        let balance = usdc.balance(&contract_addr);
        if balance < price {
            events::emit_payment_rejected(&env, &merchant, price, Error::InsufficientBalance);
            return Err(Error::InsufficientBalance);
        }

        // 9. Execute transfer
        usdc.transfer(&contract_addr, &merchant, &price);

        // 10. Update spent_today
        env.storage().instance().set(&DataKey::SpentToday, &new_spent);

        // 11. Emit event
        events::emit_payment_authorized(&env, &merchant, price, new_spent);

        Ok(())
    }

    /// Deposit USDC into the contract.
    pub fn top_up(
        env: Env,
        from: Address,
        amount: i128,
    ) -> Result<(), Error> {
        require_initialized(&env)?;

        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        if from != owner {
            return Err(Error::Unauthorized);
        }
        from.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let usdc = usdc_client(&env);
        let contract_addr = env.current_contract_address();
        usdc.transfer(&from, &contract_addr, &amount);

        events::emit_top_up(&env, &from, amount);

        Ok(())
    }

    /// Set the daily spending limit. Owner only.
    pub fn set_daily_limit(
        env: Env,
        amount: i128,
    ) -> Result<(), Error> {
        require_owner(&env)?;

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let max_tx: i128 = env.storage().instance().get(&DataKey::MaxTxValue).unwrap();
        if amount < max_tx {
            return Err(Error::InvalidAmount);
        }

        env.storage().instance().set(&DataKey::DailyLimit, &amount);
        events::emit_limit_updated(&env, amount);

        Ok(())
    }

    /// Set the max per-transaction value. Owner only.
    pub fn set_max_tx(
        env: Env,
        amount: i128,
    ) -> Result<(), Error> {
        require_owner(&env)?;

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let daily_limit: i128 = env.storage().instance().get(&DataKey::DailyLimit).unwrap();
        if amount > daily_limit {
            return Err(Error::InvalidAmount);
        }

        env.storage().instance().set(&DataKey::MaxTxValue, &amount);
        events::emit_max_tx_updated(&env, amount);

        Ok(())
    }

    /// Add a merchant to the whitelist. Owner only.
    pub fn whitelist_merchant(
        env: Env,
        merchant: Address,
    ) -> Result<(), Error> {
        require_owner(&env)?;

        env.storage()
            .instance()
            .set(&DataKey::Whitelist(merchant.clone()), &true);
        events::emit_merchant_whitelisted(&env, &merchant);

        Ok(())
    }

    /// Remove a merchant from the whitelist. Owner only.
    pub fn remove_merchant(
        env: Env,
        merchant: Address,
    ) -> Result<(), Error> {
        require_owner(&env)?;

        env.storage()
            .instance()
            .remove(&DataKey::Whitelist(merchant.clone()));
        events::emit_merchant_removed(&env, &merchant);

        Ok(())
    }

    /// Emergency pause — block all new authorizations. Owner only.
    pub fn emergency_pause(env: Env) -> Result<(), Error> {
        require_owner(&env)?;

        let paused: bool = env.storage().instance().get(&DataKey::Paused).unwrap_or(false);
        if paused {
            return Err(Error::AlreadyPaused);
        }

        env.storage().instance().set(&DataKey::Paused, &true);
        events::emit_emergency_pause(&env);

        Ok(())
    }

    /// Resume operations after emergency pause. Owner only.
    pub fn emergency_unpause(env: Env) -> Result<(), Error> {
        require_owner(&env)?;

        let paused: bool = env.storage().instance().get(&DataKey::Paused).unwrap_or(false);
        if !paused {
            return Err(Error::NotPaused);
        }

        env.storage().instance().set(&DataKey::Paused, &false);
        events::emit_emergency_unpause(&env);

        Ok(())
    }

    /// Change the authorized agent address. Owner only.
    pub fn set_agent(
        env: Env,
        new_agent: Address,
    ) -> Result<(), Error> {
        require_owner(&env)?;

        env.storage().instance().set(&DataKey::Agent, &new_agent);
        events::emit_agent_updated(&env, &new_agent);

        Ok(())
    }

    /// Read-only: returns current contract state.
    pub fn get_status(env: Env) -> Result<ContractStatus, Error> {
        require_initialized(&env)?;

        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        let agent: Address = env.storage().instance().get(&DataKey::Agent).unwrap();
        let daily_limit: i128 = env.storage().instance().get(&DataKey::DailyLimit).unwrap();
        let max_tx_value: i128 = env.storage().instance().get(&DataKey::MaxTxValue).unwrap();
        let spent_today: i128 = env.storage().instance().get(&DataKey::SpentToday).unwrap_or(0);
        let last_reset: u64 = env.storage().instance().get(&DataKey::LastReset).unwrap_or(0);
        let paused: bool = env.storage().instance().get(&DataKey::Paused).unwrap_or(false);

        let usdc = usdc_client(&env);
        let balance = usdc.balance(&env.current_contract_address());

        Ok(ContractStatus {
            owner,
            agent,
            daily_limit,
            max_tx_value,
            spent_today,
            last_reset,
            paused,
            balance,
        })
    }
}
