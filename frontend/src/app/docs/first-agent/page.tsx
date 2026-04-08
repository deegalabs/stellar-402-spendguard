import Link from "next/link";

export default function FirstAgentPage() {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400">
        <span>Docs</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-secondary font-bold">Guides</span>
      </div>

      <div>
        <h1 className="text-4xl font-black text-primary tracking-tighter mb-4">Your First Agent</h1>
        <p className="text-lg text-on-surface-variant">
          Build an x402 agent that makes governed payments through SpendGuard in 5 steps.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">How x402 Works</h2>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`Agent → GET /api/weather
Agent ← HTTP 402 Payment Required
         { price: "1000000", payTo: "G...MERCHANT" }

Agent → authorize_payment(price, merchant)  ← SpendGuard contract
        ✓ validates: paused? whitelist? limits? balance?
        ✓ executes: USDC transfer on Stellar

Agent → GET /api/weather (with X-Payment-Proof: <tx_hash>)
Agent ← HTTP 200 OK { data: "sunny, 25°C" }`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Step 1: Set Up the Contract</h2>
        <p className="text-on-surface-variant mb-3">
          Follow the <Link href="/docs/installation" className="text-secondary hover:underline">Installation</Link> guide to deploy your contract. Make sure you have:
        </p>
        <ul className="text-on-surface-variant space-y-1 list-disc list-inside">
          <li>A deployed contract address</li>
          <li>An owner account (sets policies)</li>
          <li>An agent account (makes payments)</li>
          <li>At least one whitelisted merchant</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Step 2: Configure Spending Policies</h2>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`# Set daily limit to 5 USDC (50,000,000 stroops)
stellar contract invoke --id <CONTRACT> --source <OWNER_KEY> \\
  --network testnet -- set_daily_limit --amount 50000000

# Set max per-transaction to 1 USDC
stellar contract invoke --id <CONTRACT> --source <OWNER_KEY> \\
  --network testnet -- set_max_tx --amount 10000000

# Whitelist a merchant
stellar contract invoke --id <CONTRACT> --source <OWNER_KEY> \\
  --network testnet -- whitelist_merchant --merchant <MERCHANT_ADDR>`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Step 3: Make Your First Payment</h2>
        <p className="text-on-surface-variant mb-3">
          The agent calls <code className="bg-surface-container px-1 rounded text-xs">authorize_payment</code> on the contract. The contract validates all policies and executes the USDC transfer:
        </p>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`import { authorizePayment } from "./stellar/contract.js";

// Price in stroops (0.10 USDC = 1,000,000 stroops)
const price = BigInt(1_000_000);
const merchant = "GAURB...";

try {
  const result = await authorizePayment(price, merchant);
  console.log("Payment settled:", result.hash);
  console.log("Settlement time: ~5 seconds");
} catch (err) {
  // Contract rejected the payment — policy violation
  console.error("Blocked:", err.message);
  // e.g. "ExceedsMaxTx", "MerchantNotWhitelisted"
}`}</code></pre>

        <div className="bg-secondary-fixed/30 border border-secondary/20 rounded-xl p-4 mt-4">
          <p className="text-secondary text-sm">
            <strong>Key insight:</strong> The agent signs with its OWN keypair, not the owner&apos;s. It authorizes the contract invocation — the contract executes the USDC transfer internally. The agent never touches fund keys.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Step 4: Handle the Full x402 Flow</h2>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`// 1. Request a protected resource
const response = await fetch("https://merchant.example/api/data");

if (response.status === 402) {
  // 2. Parse the x402 challenge
  const challenge = await response.json();
  const { price, payTo } = challenge.accepts[0];

  // 3. Pay through SpendGuard (on-chain policy enforcement)
  const result = await authorizePayment(BigInt(price), payTo);

  // 4. Retry with payment proof
  const data = await fetch("https://merchant.example/api/data", {
    headers: { "X-Payment-Proof": result.hash }
  });
  console.log("Got data:", await data.json());
}`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Step 5: Monitor via Dashboard</h2>
        <p className="text-on-surface-variant mb-3">
          Open <code className="bg-surface-container px-1 rounded text-xs">http://localhost:3000/dashboard</code> to see:
        </p>
        <ul className="text-on-surface-variant space-y-1 list-disc list-inside">
          <li>Real-time balance and spend velocity</li>
          <li>Transaction history with Stellar Expert links</li>
          <li>Policy configuration (Agent Vault screen)</li>
          <li>Emergency kill switch</li>
        </ul>

        <div className="bg-tertiary-fixed/20 border border-on-tertiary-container/20 rounded-xl p-4 mt-4">
          <h3 className="text-on-tertiary-container font-bold text-sm mb-2">What&apos;s Next?</h3>
          <ul className="text-sm text-on-surface-variant space-y-1">
            <li><Link href="/docs/x402-middleware" className="text-secondary hover:underline">x402 Middleware</Link> — protect your own Express endpoints with x402 paywalls</li>
            <li><Link href="/docs/mcp-integration" className="text-secondary hover:underline">MCP Integration</Link> — connect SpendGuard to Claude, GPT, or any MCP-compatible agent</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
