import Link from "next/link";

export default function FirstAgentPage() {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-disabled">
        <span>Docs</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-accent-fg font-bold">Guides</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-accent-fg font-bold">Your First Agent</span>
      </div>

      <div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-4">
          Your First Agent
        </h1>
        <p className="text-lg text-text-secondary">
          Build an autonomous agent that pays for web resources through the x402 protocol,
          with every payment governed on-chain by SpendGuard. End-to-end in under 50 lines
          of TypeScript.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">What you&apos;ll build</h2>
        <p className="text-text-secondary mb-3">
          An agent that fetches a paywalled weather forecast. The merchant returns HTTP 402
          with an x402 challenge; the agent checks its budget, pays through the SpendGuard
          contract, and retries with proof of payment. No manual approval, no fund keys in
          memory — just a daily cap the contract enforces on-chain.
        </p>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`Agent → GET /api/forecast
       ← HTTP 402  { price: "0.10", payTo: "G...MERCHANT", asset: USDC }

Agent → SpendGuard.authorize_payment(price, merchant)
        ✓ paused?          → no
        ✓ within max_tx?   → yes
        ✓ within daily?    → yes
        ✓ whitelisted?     → yes
        ✓ balance?         → yes
        → USDC.transfer(contract → merchant)
        → tx_hash: abc123...

Agent → GET /api/forecast  (X-Payment-Proof: abc123...)
       ← HTTP 200  { forecast: "Mon 25°C, Tue 23°C, ..." }`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Prerequisites</h2>
        <p className="text-text-secondary mb-3">
          You need a running SpendGuard backend pointed at a deployed contract. If you
          haven&apos;t done that yet, follow the{" "}
          <Link href="/docs/installation" className="text-accent-fg hover:underline">
            Installation
          </Link>{" "}
          guide first. Then confirm you have:
        </p>
        <ul className="text-text-secondary space-y-1 list-disc list-inside">
          <li>Backend running at <code className="bg-dark-200 px-1 rounded text-xs">http://localhost:3001</code></li>
          <li>At least one whitelisted merchant</li>
          <li>A positive USDC balance in the contract (top up via the Vault UI or{" "}
            <code className="bg-dark-200 px-1 rounded text-xs">client.topUp()</code>)
          </li>
          <li>Node.js 20+ and a fresh project folder</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          Step 1 — Install the SDK
        </h2>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`mkdir my-agent && cd my-agent
npm init -y
npm install @spendguard/sdk
npm install -D typescript tsx @types/node
npx tsc --init`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          Step 2 — Configure spending policies
        </h2>
        <p className="text-text-secondary mb-3">
          Before the agent runs, set a <strong className="text-text-primary">conservative daily
          cap</strong>. An agent that can&apos;t exceed $1/day is an agent you can safely leave running
          overnight.
        </p>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`// setup.ts
import { SpendGuardClient } from "@spendguard/sdk";

const admin = new SpendGuardClient({
  apiUrl: "http://localhost:3001",
  apiKey: process.env.ADMIN_API_KEY,  // set in backend .env
});

// $1.00/day, $0.25/transaction max
await admin.setDailyLimit(1);
await admin.setMaxTx(0.25);
await admin.whitelistMerchant("GAURBKKJGAJJTHWWQGLG5HPADOPSIA5T2KNUIC3UOHKNCANBQ37SB5RQ");

const status = await admin.getStatus();
console.log("Policy locked in:", {
  daily_limit: status.daily_limit,
  max_tx: status.max_tx_value,
  balance: status.balance,
});`}</code></pre>
        <pre className="bg-dark-50 p-4 rounded-xl border border-surface-border font-mono text-sm text-text-primary mt-3"><code>{`npx tsx setup.ts`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          Step 3 — Write the agent
        </h2>
        <p className="text-text-secondary mb-3">
          The agent uses <code className="bg-dark-200 px-1 rounded text-xs">SpendGuardAgent</code>, which
          handles the full x402 cycle. Notice the check-then-pay pattern: dry-run first, commit
          only when the contract confirms it&apos;s safe.
        </p>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`// agent.ts
import { SpendGuardAgent, SpendGuardError } from "@spendguard/sdk";

const agent = new SpendGuardAgent({
  apiUrl: "http://localhost:3001",
});

async function getForecast() {
  // 1. How much budget do we have left today?
  const report = await agent.getSpendingReport();
  console.log(\`Budget: $\${report.remaining_usdc} remaining (\${report.utilization_pct}% used)\`);

  if (parseFloat(report.remaining_usdc) < 0.10) {
    console.log("Not enough budget — bailing out.");
    return;
  }

  // 2. Dry-run the payment (free, instant)
  const merchant = "GAURBKKJGAJJTHWWQGLG5HPADOPSIA5T2KNUIC3UOHKNCANBQ37SB5RQ";
  const precheck = await agent.checkBudget(0.10, merchant);
  if (!precheck.allowed) {
    console.error("Blocked by policy:", precheck.reason);
    console.error("Failed check:", precheck.checks);
    return;
  }

  // 3. Full x402 cycle — request, pay, fetch, return
  try {
    const result = await agent.payForResource(
      "http://localhost:3001/api/demo/protected-resource"
    );
    console.log("Data:", result.data);
    console.log(\`Settled in \${result.settlement_time_ms}ms\`);
    console.log(\`tx: \${result.tx_hash}\`);
  } catch (err) {
    if (err instanceof SpendGuardError) {
      console.error(\`SpendGuard rejected: \${err.code}\`);
    } else {
      throw err;
    }
  }
}

getForecast();`}</code></pre>
        <pre className="bg-dark-50 p-4 rounded-xl border border-surface-border font-mono text-sm text-text-primary mt-3"><code>{`npx tsx agent.ts`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          Step 4 — Watch the guardrails fire
        </h2>
        <p className="text-text-secondary mb-3">
          Now prove the contract actually blocks you. Change the amount to exceed your max
          per-tx cap and re-run:
        </p>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`// Change the precheck amount from 0.10 to 5.00
const precheck = await agent.checkBudget(5.00, merchant);

// Output:
// Blocked by policy: $5.00 exceeds max per-transaction limit of $0.25
// Failed check: {
//   paused: false,
//   within_max_tx: false,      // ← this failed
//   within_daily_limit: true,
//   sufficient_balance: true
// }`}</code></pre>
        <div className="bg-accent-glow/30 border border-accent-fg/20 rounded-xl p-4 mt-4">
          <p className="text-accent-fg text-sm">
            <strong>Key insight:</strong> the check is just metadata — the REAL enforcement
            happens inside the contract. Even if the agent process is compromised and skips
            the pre-check, the contract still rejects the payment on-chain. The dry-run only
            exists to fail fast without burning ledger fees.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          Step 5 — Monitor and iterate
        </h2>
        <p className="text-text-secondary mb-3">
          Open <code className="bg-dark-200 px-1 rounded text-xs">http://localhost:3000/dashboard</code>.
          You should see your payment in the audit log with a Stellar Expert link, the daily
          spend bar incremented, and the balance dropped by exactly the paid amount.
        </p>
        <p className="text-text-secondary">
          When you&apos;re comfortable, bump the daily limit, loop over a queue of requests, and
          let the agent run. If anything ever feels wrong, hit{" "}
          <strong className="text-text-primary">Emergency Pause</strong> on the Vault page —
          the contract refuses new payments instantly.
        </p>
      </section>

      <section>
        <div className="bg-success-glow border border-success/20 rounded-xl p-4">
          <h3 className="text-success-fg font-bold text-sm mb-2">What&apos;s next?</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>
              <Link href="/docs/agent-config" className="text-accent-fg hover:underline">
                Agent configuration patterns
              </Link>{" "}
              — conservative vs. aggressive policies and when to use each
            </li>
            <li>
              <Link href="/docs/x402-middleware" className="text-accent-fg hover:underline">
                x402 middleware
              </Link>{" "}
              — protect your own Express endpoints with a paywall
            </li>
            <li>
              <Link href="/docs/mcp-integration" className="text-accent-fg hover:underline">
                MCP integration
              </Link>{" "}
              — plug SpendGuard into Claude or any MCP-compatible agent
            </li>
            <li>
              <Link href="/docs/sdk" className="text-accent-fg hover:underline">
                Full SDK reference
              </Link>{" "}
              — every method with type signatures
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
