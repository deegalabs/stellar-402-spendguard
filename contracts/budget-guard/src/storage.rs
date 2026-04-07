use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    Agent,
    DailyLimit,
    MaxTxValue,
    SpentToday,
    LastReset,
    Paused,
    Whitelist(Address),
    UsdcToken,
    Initialized,
}
