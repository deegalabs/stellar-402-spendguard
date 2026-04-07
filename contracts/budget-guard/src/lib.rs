#![no_std]

mod error;
mod events;
mod storage;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use crate::error::Error;
pub use crate::storage::DataKey;

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

#[contractimpl]
impl BudgetGuardContract {
    /// Initialize the contract. Must be called exactly once.
    pub fn initialize(
        _env: Env,
        _owner: Address,
        _agent: Address,
        _usdc_token: Address,
        _daily_limit: i128,
        _max_tx_value: i128,
    ) -> Result<(), Error> {
        panic!("not implemented")
    }

    /// Authorize a USDC payment from the contract to a merchant.
    /// Called by the agent. Validates all spending policies.
    pub fn authorize_payment(
        _env: Env,
        _price: i128,
        _merchant: Address,
    ) -> Result<(), Error> {
        panic!("not implemented")
    }

    /// Deposit USDC into the contract.
    pub fn top_up(
        _env: Env,
        _from: Address,
        _amount: i128,
    ) -> Result<(), Error> {
        panic!("not implemented")
    }

    /// Set the daily spending limit. Owner only.
    pub fn set_daily_limit(
        _env: Env,
        _amount: i128,
    ) -> Result<(), Error> {
        panic!("not implemented")
    }

    /// Set the max per-transaction value. Owner only.
    pub fn set_max_tx(
        _env: Env,
        _amount: i128,
    ) -> Result<(), Error> {
        panic!("not implemented")
    }

    /// Add a merchant to the whitelist. Owner only.
    pub fn whitelist_merchant(
        _env: Env,
        _merchant: Address,
    ) -> Result<(), Error> {
        panic!("not implemented")
    }

    /// Remove a merchant from the whitelist. Owner only.
    pub fn remove_merchant(
        _env: Env,
        _merchant: Address,
    ) -> Result<(), Error> {
        panic!("not implemented")
    }

    /// Emergency pause — block all new authorizations. Owner only.
    pub fn emergency_pause(_env: Env) -> Result<(), Error> {
        panic!("not implemented")
    }

    /// Resume operations after emergency pause. Owner only.
    pub fn emergency_unpause(_env: Env) -> Result<(), Error> {
        panic!("not implemented")
    }

    /// Change the authorized agent address. Owner only.
    pub fn set_agent(
        _env: Env,
        _new_agent: Address,
    ) -> Result<(), Error> {
        panic!("not implemented")
    }

    /// Read-only: returns current contract state.
    pub fn get_status(_env: Env) -> Result<ContractStatus, Error> {
        panic!("not implemented")
    }
}
