use soroban_sdk::{Address, Env, Symbol};

use crate::error::Error;

pub fn emit_payment_authorized(
    env: &Env,
    merchant: &Address,
    price: i128,
    spent_today: i128,
) {
    env.events().publish(
        (Symbol::new(env, "SpendGuard"), Symbol::new(env, "payment")),
        (merchant.clone(), price, spent_today),
    );
}

pub fn emit_payment_rejected(
    env: &Env,
    merchant: &Address,
    price: i128,
    reason: Error,
) {
    env.events().publish(
        (Symbol::new(env, "SpendGuard"), Symbol::new(env, "rejected")),
        (merchant.clone(), price, reason as u32),
    );
}

pub fn emit_top_up(env: &Env, from: &Address, amount: i128) {
    env.events().publish(
        (Symbol::new(env, "SpendGuard"), Symbol::new(env, "topup")),
        (from.clone(), amount),
    );
}

pub fn emit_emergency_pause(env: &Env) {
    env.events().publish(
        (Symbol::new(env, "SpendGuard"), Symbol::new(env, "pause")),
        env.ledger().timestamp(),
    );
}

pub fn emit_emergency_unpause(env: &Env) {
    env.events().publish(
        (Symbol::new(env, "SpendGuard"), Symbol::new(env, "unpause")),
        env.ledger().timestamp(),
    );
}

pub fn emit_limit_updated(env: &Env, new_limit: i128) {
    env.events().publish(
        (Symbol::new(env, "SpendGuard"), Symbol::new(env, "limit")),
        new_limit,
    );
}

pub fn emit_max_tx_updated(env: &Env, new_max: i128) {
    env.events().publish(
        (Symbol::new(env, "SpendGuard"), Symbol::new(env, "max_tx")),
        new_max,
    );
}

pub fn emit_merchant_whitelisted(env: &Env, merchant: &Address) {
    env.events().publish(
        (Symbol::new(env, "SpendGuard"), Symbol::new(env, "whitelist")),
        merchant.clone(),
    );
}

pub fn emit_merchant_removed(env: &Env, merchant: &Address) {
    env.events().publish(
        (Symbol::new(env, "SpendGuard"), Symbol::new(env, "remove")),
        merchant.clone(),
    );
}

pub fn emit_agent_updated(env: &Env, new_agent: &Address) {
    env.events().publish(
        (Symbol::new(env, "SpendGuard"), Symbol::new(env, "agent")),
        new_agent.clone(),
    );
}

pub fn emit_daily_reset(env: &Env, previous_spent: i128) {
    env.events().publish(
        (Symbol::new(env, "SpendGuard"), Symbol::new(env, "reset")),
        (previous_spent, env.ledger().timestamp()),
    );
}
