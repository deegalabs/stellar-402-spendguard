use soroban_sdk::contracterror;

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
