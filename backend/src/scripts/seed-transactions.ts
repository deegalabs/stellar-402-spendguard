/**
 * Seed Transaction Script
 *
 * Generates 15+ demo transactions on Stellar Testnet by invoking
 * the BudgetGuard contract. Run after deploying the contract and
 * funding the accounts.
 *
 * Usage: npx tsx src/scripts/seed-transactions.ts
 */
import { config } from "../config.js";
import {
  authorizePayment,
  whitelistMerchant,
  setDailyLimit,
  setMaxTx,
  emergencyPause,
  emergencyUnpause,
  topUp,
} from "../stellar/contract.js";

const ONE_USDC = BigInt(10_000_000);

interface SeedStep {
  name: string;
  action: () => Promise<{ hash: string }>;
  delay?: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log("=== SpendGuard Seed Transaction Script ===");
  console.log(`Network: ${config.stellarNetwork}`);
  console.log(`Contract: ${config.contractAddress}`);
  console.log();

  if (!config.contractAddress) {
    console.error("CONTRACT_ADDRESS not set. Deploy the contract first.");
    process.exit(1);
  }

  if (!config.ownerSecretKey || !config.agentSecretKey) {
    console.error("OWNER_SECRET_KEY and AGENT_SECRET_KEY must be set.");
    process.exit(1);
  }

  // Use a known merchant address for demo (agent's own public key as placeholder)
  const demoMerchant = config.agentPublicKey;

  const steps: SeedStep[] = [
    // Admin operations
    {
      name: "1. Set daily limit to 500 USDC",
      action: () => setDailyLimit(ONE_USDC * BigInt(500)),
    },
    {
      name: "2. Set max tx to 100 USDC",
      action: () => setMaxTx(ONE_USDC * BigInt(100)),
    },
    {
      name: "3. Whitelist demo merchant",
      action: () => whitelistMerchant(demoMerchant),
    },
    {
      name: "4. Top up 200 USDC",
      action: () => topUp(ONE_USDC * BigInt(200)),
    },

    // Agent payments — varied amounts
    {
      name: "5. Payment: 0.10 USDC (weather API)",
      action: () => authorizePayment(BigInt(1_000_000), demoMerchant),
    },
    {
      name: "6. Payment: 0.25 USDC (translation)",
      action: () => authorizePayment(BigInt(2_500_000), demoMerchant),
    },
    {
      name: "7. Payment: 1.00 USDC (image gen)",
      action: () => authorizePayment(ONE_USDC, demoMerchant),
    },
    {
      name: "8. Payment: 0.50 USDC (search API)",
      action: () => authorizePayment(BigInt(5_000_000), demoMerchant),
    },
    {
      name: "9. Payment: 0.15 USDC (geocoding)",
      action: () => authorizePayment(BigInt(1_500_000), demoMerchant),
    },
    {
      name: "10. Payment: 2.00 USDC (premium data)",
      action: () => authorizePayment(ONE_USDC * BigInt(2), demoMerchant),
    },
    {
      name: "11. Payment: 0.05 USDC (health check)",
      action: () => authorizePayment(BigInt(500_000), demoMerchant),
    },
    {
      name: "12. Payment: 0.75 USDC (analytics)",
      action: () => authorizePayment(BigInt(7_500_000), demoMerchant),
    },

    // Admin: pause and unpause for demo
    {
      name: "13. Emergency pause (kill switch demo)",
      action: () => emergencyPause(),
    },
    {
      name: "14. Emergency unpause",
      action: () => emergencyUnpause(),
    },

    // More payments after unpause
    {
      name: "15. Payment: 3.00 USDC (batch processing)",
      action: () => authorizePayment(ONE_USDC * BigInt(3), demoMerchant),
    },
    {
      name: "16. Payment: 0.30 USDC (notification)",
      action: () => authorizePayment(BigInt(3_000_000), demoMerchant),
    },
    {
      name: "17. Update daily limit to 1000 USDC",
      action: () => setDailyLimit(ONE_USDC * BigInt(1000)),
    },
  ];

  let succeeded = 0;
  let failed = 0;

  for (const step of steps) {
    try {
      console.log(`${step.name}...`);
      const result = await step.action();
      console.log(`  OK  tx: ${result.hash}`);
      succeeded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  FAIL: ${message}`);
      failed++;
    }

    // Small delay between transactions to avoid rate limiting
    await sleep(step.delay ?? 2000);
  }

  console.log();
  console.log(`=== Done: ${succeeded} succeeded, ${failed} failed ===`);
  console.log(`View on Stellar Expert: https://stellar.expert/explorer/testnet/contract/${config.contractAddress}`);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
