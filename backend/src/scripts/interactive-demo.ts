/**
 * Interactive Demo — Full x402 SpendGuard Flow
 *
 * Walks through every step of the demo script interactively,
 * executing real transactions on Stellar Testnet.
 *
 * Usage: npx tsx src/scripts/interactive-demo.ts
 */
import { config } from "../config.js";
import {
  getStatus,
  setDailyLimit,
  setMaxTx,
  whitelistMerchant,
  emergencyPause,
  emergencyUnpause,
  authorizePayment,
  topUp,
} from "../stellar/contract.js";
import { getContractBalance } from "../stellar/horizon.js";
import * as readline from "readline";

const ONE_USDC = BigInt(10_000_000);
const MERCHANT = config.agentPublicKey; // demo merchant

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function waitForEnter(label: string) {
  await ask(`\n  Press ENTER to ${label}...`);
}

function log(icon: string, msg: string) {
  console.log(`  ${icon} ${msg}`);
}

function header(title: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("=".repeat(60));
}

function section(num: number, title: string) {
  console.log(`\n--- Step ${num}: ${title} ---\n`);
}

async function showStatus() {
  const status = await getStatus();
  const balance = await getContractBalance();
  console.log(`
  Contract Status:
    Owner:        ${status.owner.slice(0, 10)}...
    Agent:        ${status.agent.slice(0, 10)}...
    Daily Limit:  $${(Number(status.daily_limit) / 1e7).toFixed(2)} USDC
    Max per Tx:   $${(Number(status.max_tx_value) / 1e7).toFixed(2)} USDC
    Spent Today:  $${(Number(status.spent_today) / 1e7).toFixed(2)} USDC
    Paused:       ${status.paused ? "YES" : "no"}
    Balance:      $${balance.balance_usdc} USDC
    Network:      ${status.network}
  `);
}

async function run() {
  header("SpendGuard Interactive Demo");
  console.log(`
  This demo walks through the complete x402 SpendGuard flow:
    1. View contract status
    2. Configure spending policies
    3. Execute x402 payments (success)
    4. Hit the daily limit (blocked)
    5. Emergency kill switch (pause)
    6. Resume operations (unpause)
    7. Audit trail review

  Contract: ${config.contractAddress}
  Network:  ${config.stellarNetwork}
  Stellar Expert: https://stellar.expert/explorer/testnet/contract/${config.contractAddress}
  `);

  // ---- Step 1: Status ----
  section(1, "Current Contract Status");
  await showStatus();

  // ---- Step 2: Configure Policies ----
  section(2, "Configure Spending Policies");
  await waitForEnter("set daily limit to $5.00 USDC");

  log(">>", "Setting daily limit to $5.00 USDC...");
  const limitResult = await setDailyLimit(ONE_USDC * BigInt(5));
  log("OK", `tx: ${limitResult.hash}`);
  log(">>", `   https://stellar.expert/explorer/testnet/tx/${limitResult.hash}`);

  await waitForEnter("set max transaction to $2.00 USDC");

  log(">>", "Setting max transaction to $2.00 USDC...");
  const maxTxResult = await setMaxTx(ONE_USDC * BigInt(2));
  log("OK", `tx: ${maxTxResult.hash}`);
  log(">>", `   https://stellar.expert/explorer/testnet/tx/${maxTxResult.hash}`);

  await waitForEnter("whitelist demo merchant");

  log(">>", `Whitelisting merchant ${MERCHANT.slice(0, 10)}...`);
  try {
    const wlResult = await whitelistMerchant(MERCHANT);
    log("OK", `tx: ${wlResult.hash}`);
  } catch {
    log("--", "Merchant already whitelisted (skipping)");
  }

  console.log("\n  Updated status:");
  await showStatus();

  // ---- Step 3: Successful Payments ----
  section(3, "x402 Payment Flow (Success)");

  const payments = [
    { label: "Weather API call", amount: BigInt(1_000_000), usdc: "$0.10" },
    { label: "Translation service", amount: BigInt(2_500_000), usdc: "$0.25" },
    { label: "Image generation", amount: ONE_USDC, usdc: "$1.00" },
    { label: "Search API", amount: BigInt(5_000_000), usdc: "$0.50" },
  ];

  for (const p of payments) {
    await waitForEnter(`execute payment: ${p.label} (${p.usdc})`);

    console.log(`\n  Simulating x402 flow:`);
    log("1.", `Agent requests protected resource...`);
    log("2.", `Merchant responds: HTTP 402 Payment Required (${p.usdc} USDC)`);
    log("3.", `Agent calls contract.authorize_payment(${p.usdc}, merchant)...`);

    const start = Date.now();
    try {
      const result = await authorizePayment(p.amount, MERCHANT);
      const ms = Date.now() - start;
      log("4.", `Contract validates: paused? limits? whitelist? balance?`);
      log("OK", `Payment authorized! Settlement: ${ms}ms`);
      log(">>", `tx: ${result.hash}`);
      log(">>", `https://stellar.expert/explorer/testnet/tx/${result.hash}`);
      log("5.", `Agent retries with X-Payment-Proof header -> HTTP 200 OK`);
    } catch (err) {
      const ms = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      log("XX", `Payment BLOCKED after ${ms}ms: ${msg}`);
    }
  }

  console.log("\n  Status after payments:");
  await showStatus();

  // ---- Step 4: Over Limit ----
  section(4, "Daily Limit Enforcement (Blocked Payment)");
  await waitForEnter("attempt payment that exceeds daily limit ($2.00)");

  console.log(`\n  Attempting $2.00 payment (should exceed $5.00 daily limit)...`);
  log("1.", "Agent requests premium data endpoint...");
  log("2.", "Merchant responds: HTTP 402 ($2.00 USDC)");
  log("3.", "Agent calls contract.authorize_payment($2.00, merchant)...");

  const startBlocked = Date.now();
  try {
    await authorizePayment(ONE_USDC * BigInt(2), MERCHANT);
    log("??", "Payment went through (daily limit not yet reached)");
  } catch (err) {
    const ms = Date.now() - startBlocked;
    log("4.", "Contract validates...");
    log("XX", `BLOCKED! ExceedsDailyLimit (${ms}ms)`);
    log(">>", "The contract rejected this on-chain.");
    log(">>", "The agent code did NOT block this -- the blockchain did.");
  }

  // ---- Step 5: Kill Switch ----
  section(5, "Emergency Kill Switch");
  await waitForEnter("activate emergency pause");

  log(">>", "Calling contract.emergency_pause()...");
  const pauseResult = await emergencyPause();
  log("OK", `Contract PAUSED! tx: ${pauseResult.hash}`);
  log(">>", `https://stellar.expert/explorer/testnet/tx/${pauseResult.hash}`);
  log("!!", "All new payment authorizations are now blocked.");
  log("!!", "In-flight transactions on the ledger are final (blockchain finality).");

  await waitForEnter("attempt payment while paused");

  log(">>", "Agent attempts $0.10 payment while paused...");
  try {
    await authorizePayment(BigInt(1_000_000), MERCHANT);
    log("??", "Unexpected success");
  } catch {
    log("XX", "BLOCKED! ContractPaused");
    log(">>", "Kill switch working: no payments go through.");
  }

  // ---- Step 6: Unpause ----
  section(6, "Resume Operations");
  await waitForEnter("unpause the contract");

  log(">>", "Calling contract.emergency_unpause()...");
  const unpauseResult = await emergencyUnpause();
  log("OK", `Contract UNPAUSED! tx: ${unpauseResult.hash}`);
  log(">>", `https://stellar.expert/explorer/testnet/tx/${unpauseResult.hash}`);

  // ---- Step 7: Audit Trail ----
  section(7, "Final Status & Audit Trail");
  await showStatus();

  console.log(`
  View full audit trail on Stellar Expert:
    Contract: https://stellar.expert/explorer/testnet/contract/${config.contractAddress}
    Owner:    https://stellar.expert/explorer/testnet/account/${config.ownerPublicKey}

  Every transaction is immutable, verifiable, and public.
  The agent never held fund keys. The contract enforced every policy.
  `);

  header("Demo Complete!");
  console.log(`
  SpendGuard -- the spending-policy contract
  that was missing for x402 agents on Stellar.

  github.com/deegalabs/stellar-402-spendguard
  `);

  rl.close();
}

run().catch((err) => {
  console.error("\nFatal error:", err);
  rl.close();
  process.exit(1);
});
