import Link from "next/link";

export default function SDKPage() {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-disabled">
        <span>Docs</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-accent-fg font-bold">TypeScript SDK</span>
      </div>

      <div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-4">
          TypeScript SDK
        </h1>
        <p className="text-lg text-text-secondary">
          <code className="bg-dark-200 px-1.5 py-0.5 rounded text-sm font-mono text-accent-fg">
            @spendguard/sdk
          </code>{" "}
          — the recommended way to integrate SpendGuard into TypeScript/Node.js agents.
          Two classes, zero boilerplate: <code className="bg-dark-200 px-1 rounded text-xs">SpendGuardClient</code>{" "}
          wraps the REST API and <code className="bg-dark-200 px-1 rounded text-xs">SpendGuardAgent</code>{" "}
          adds higher-level x402 orchestration.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Install</h2>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`npm install @spendguard/sdk
# or
pnpm add @spendguard/sdk
# or
yarn add @spendguard/sdk`}</code></pre>
        <p className="text-text-secondary mt-3 text-sm">
          The SDK has a single runtime dependency: <code className="bg-dark-200 px-1 rounded text-xs">cross-fetch</code>.
          It has no direct dependency on <code className="bg-dark-200 px-1 rounded text-xs">@stellar/stellar-sdk</code> —
          all signing happens in the backend, the SDK just talks REST.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          SpendGuardClient — low-level REST wrapper
        </h2>
        <p className="text-text-secondary mb-3">
          Read contract state, run admin actions, and fetch audit logs. Every method
          returns a typed promise — no <code className="bg-dark-200 px-1 rounded text-xs">any</code>, no
          unwrapping JSON by hand.
        </p>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`import { SpendGuardClient } from "@spendguard/sdk";

const client = new SpendGuardClient({
  apiUrl: process.env.SPENDGUARD_URL!,        // required
  apiKey: process.env.ADMIN_API_KEY,          // optional (admin actions)
  stellarAddress: process.env.OWNER_PUB_KEY,  // optional (X-Stellar-Address)
});

// Public reads — no auth
const status = await client.getStatus();
console.log(\`Balance: $\${status.balance}\`);
console.log(\`Daily: $\${status.spent_today} of $\${status.daily_limit}\`);
console.log(\`Paused: \${status.paused}\`);

// Paginated audit log
const { transactions, nextCursor } = await client.getTransactions(25);

// Admin actions (need apiKey)
await client.setDailyLimit(100);          // USDC, not stroops
await client.setMaxTx(25);
await client.whitelistMerchant("GAURB...");
await client.pause();`}</code></pre>

        <h3 className="text-sm font-bold text-text-primary mt-6 mb-3 uppercase tracking-widest">
          Method reference
        </h3>
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-200 text-text-secondary text-[10px] font-mono uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Auth</th>
                <th className="px-4 py-3 text-left">Returns</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">getStatus()</code></td><td className="px-4 py-2 text-text-secondary">No</td><td className="px-4 py-2"><code className="text-xs text-text-secondary">ContractStatus</code></td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">getBalance()</code></td><td className="px-4 py-2 text-text-secondary">No</td><td className="px-4 py-2"><code className="text-xs text-text-secondary">BalanceInfo</code></td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">getTransactions(limit?, cursor?)</code></td><td className="px-4 py-2 text-text-secondary">No</td><td className="px-4 py-2"><code className="text-xs text-text-secondary">TransactionResult</code></td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">setDailyLimit(usdc)</code></td><td className="px-4 py-2 text-text-secondary">Yes</td><td className="px-4 py-2"><code className="text-xs text-text-secondary">TxResult</code></td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">setMaxTx(usdc)</code></td><td className="px-4 py-2 text-text-secondary">Yes</td><td className="px-4 py-2"><code className="text-xs text-text-secondary">TxResult</code></td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">whitelistMerchant(addr)</code></td><td className="px-4 py-2 text-text-secondary">Yes</td><td className="px-4 py-2"><code className="text-xs text-text-secondary">TxResult</code></td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">removeMerchant(addr)</code></td><td className="px-4 py-2 text-text-secondary">Yes</td><td className="px-4 py-2"><code className="text-xs text-text-secondary">TxResult</code></td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">pause()</code> / <code className="text-xs font-bold text-text-primary">unpause()</code></td><td className="px-4 py-2 text-text-secondary">Yes</td><td className="px-4 py-2"><code className="text-xs text-text-secondary">TxResult</code></td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">topUp(usdc)</code></td><td className="px-4 py-2 text-text-secondary">Yes</td><td className="px-4 py-2"><code className="text-xs text-text-secondary">TxResult</code></td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">runAgent(url?)</code></td><td className="px-4 py-2 text-text-secondary">No</td><td className="px-4 py-2"><code className="text-xs text-text-secondary">AgentResult</code></td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          SpendGuardAgent — high-level x402 helper
        </h2>
        <p className="text-text-secondary mb-3">
          Wraps <code className="bg-dark-200 px-1 rounded text-xs">SpendGuardClient</code> with three
          methods designed for autonomous agents: <em>check before you pay</em>, <em>pay for a
          resource</em>, and <em>report what you spent</em>. Use this class whenever you&apos;re building
          something that consumes paid APIs.
        </p>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`import { SpendGuardAgent } from "@spendguard/sdk";

const agent = new SpendGuardAgent({
  apiUrl: process.env.SPENDGUARD_URL!,
});

// 1. Dry-run policy check (doesn't hit the chain)
const budget = await agent.checkBudget(0.25, "GAURB...");
if (!budget.allowed) {
  console.log(\`Blocked: \${budget.reason}\`);
  // budget.checks tells you WHICH policy failed:
  //   { paused, within_max_tx, within_daily_limit, sufficient_balance }
  return;
}

// 2. Full x402 cycle: request → 402 → pay → retry → data
const result = await agent.payForResource(
  "https://weather.example/api/forecast"
);
console.log(result.data);                // the actual API response
console.log(result.tx_hash);              // Stellar tx hash
console.log(result.settlement_time_ms);   // end-to-end latency

// 3. Daily spending report
const report = await agent.getSpendingReport();
console.log(\`\${report.utilization_pct}% of daily budget used\`);`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          Pattern: Check-then-pay (recommended)
        </h2>
        <p className="text-text-secondary mb-3">
          Always call <code className="bg-dark-200 px-1 rounded text-xs">checkBudget</code> before{" "}
          <code className="bg-dark-200 px-1 rounded text-xs">payForResource</code>. Failed on-chain
          payments burn ledger fees and slow your agent down — dry-runs are free and instant.
        </p>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`async function fetchPaidResource(
  agent: SpendGuardAgent,
  url: string,
  estimatedPrice: number,
  merchant: string,
) {
  // Preflight: is this even allowed?
  const budget = await agent.checkBudget(estimatedPrice, merchant);
  if (!budget.allowed) {
    throw new BudgetBlockedError(budget.reason, budget.checks);
  }

  // Commit: actual payment + data fetch
  try {
    return await agent.payForResource(url);
  } catch (err) {
    // Rare: price changed between check and pay, or network hiccup
    console.error("Payment failed after preflight OK:", err);
    throw err;
  }
}`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          Pattern: Budget-aware loops
        </h2>
        <p className="text-text-secondary mb-3">
          When an agent processes many items, pull the report once and stop BEFORE hitting the
          daily ceiling — don&apos;t wait for a contract error.
        </p>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`const report = await agent.getSpendingReport();
const remaining = parseFloat(report.remaining_usdc);
const unitCost = 0.10;  // per-item price

const maxItems = Math.floor(remaining / unitCost);
console.log(\`Budget allows \${maxItems} items today\`);

for (let i = 0; i < Math.min(workQueue.length, maxItems); i++) {
  const result = await agent.payForResource(workQueue[i]);
  await process(result.data);
}`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          Error handling
        </h2>
        <p className="text-text-secondary mb-3">
          All SDK errors throw <code className="bg-dark-200 px-1 rounded text-xs">SpendGuardError</code>{" "}
          — a typed error with <code className="bg-dark-200 px-1 rounded text-xs">code</code> and{" "}
          <code className="bg-dark-200 px-1 rounded text-xs">statusCode</code> fields. Match on code,
          never parse messages.
        </p>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`import { SpendGuardError } from "@spendguard/sdk";

try {
  await client.setDailyLimit(1000);
} catch (err) {
  if (err instanceof SpendGuardError) {
    switch (err.code) {
      case "UNAUTHORIZED":
        console.error("Missing or invalid API key");
        break;
      case "INVALID_AMOUNT":
        console.error("Amount must be > 0");
        break;
      case "CONTRACT_PAUSED":
        console.error("Unpause before updating limits");
        break;
      default:
        console.error(\`\${err.code}: \${err.message}\`);
    }
  }
}`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Utilities</h2>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`import {
  stroopsToUsdc,
  usdcToStroops,
  shortAddress,
} from "@spendguard/sdk";

stroopsToUsdc("10000000");     // "1.00"
usdcToStroops(1.5);            // 15000000n  (bigint)
shortAddress("GAURB...XYZ");   // "GAURB...XYZ" truncated`}</code></pre>
      </section>

      <section>
        <div className="bg-accent-glow/30 border border-accent-fg/20 rounded-xl p-4">
          <h3 className="text-accent-fg font-bold text-sm mb-2">Next steps</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>
              <Link href="/docs/first-agent" className="text-accent-fg hover:underline">
                Build your first agent
              </Link>{" "}
              — end-to-end tutorial using this SDK
            </li>
            <li>
              <Link href="/docs/agent-config" className="text-accent-fg hover:underline">
                Agent configuration patterns
              </Link>{" "}
              — how to tune policies for different workloads
            </li>
            <li>
              <Link href="/docs/mcp-integration" className="text-accent-fg hover:underline">
                MCP integration
              </Link>{" "}
              — expose SpendGuard tools to Claude / GPT
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
