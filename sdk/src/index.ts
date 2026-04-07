// SpendGuard SDK — Governed AI Agent Spending on Stellar
// https://github.com/deegalabs/stellar-402-spendguard

export { SpendGuardClient, SpendGuardError } from "./client.js";
export { SpendGuardAgent } from "./agent.js";
export { stroopsToUsdc, usdcToStroops, shortAddress } from "./utils.js";

export type {
  SpendGuardConfig,
  ContractStatus,
  BalanceInfo,
  TransactionEvent,
  TransactionResult,
  TxResult,
  DemoStepResult,
  AgentResult,
  BudgetCheck,
  PaymentResult,
  SpendingReport,
  ApiError,
} from "./types.js";
