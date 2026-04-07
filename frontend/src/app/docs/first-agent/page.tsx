export default function FirstAgentPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Your First Agent</h1>
      <p className="lead text-slate-300 text-lg">
        Build an x402 agent that makes governed payments through SpendGuard in
        5 steps.
      </p>

      <h2>How x402 Works</h2>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <pre className="bg-transparent border-none p-0 m-0"><code>{`Agent → GET /api/weather
Agent ← HTTP 402 Payment Required
         { price: "1000000", payTo: "G...MERCHANT" }

Agent → authorize_payment(price, merchant)  ← SpendGuard contract
        ✓ validates: paused? whitelist? limits? balance?
        ✓ executes: USDC transfer on Stellar

Agent → GET /api/weather (with X-Payment-Proof: <tx_hash>)
Agent ← HTTP 200 OK { data: "sunny, 25°C" }`}</code></pre>
      </div>

      <h2>Step 1: Set Up the Contract</h2>
      <p>
        Follow the <a href="/docs/installation" className="text-blue-400">Installation</a>{" "}
        guide to deploy your contract. Make sure you have:
      </p>
      <ul>
        <li>A deployed contract address</li>
        <li>An owner account (sets policies)</li>
        <li>An agent account (makes payments)</li>
        <li>At least one whitelisted merchant</li>
      </ul>

      <h2>Step 2: Configure Spending Policies</h2>
      <pre className="bg-slate-800 border border-slate-700"><code>{`# Set daily limit to 5 USDC (50,000,000 stroops)
stellar contract invoke --id <CONTRACT> --source <OWNER_KEY> \\
  --network testnet -- set_daily_limit --amount 50000000

# Set max per-transaction to 1 USDC
stellar contract invoke --id <CONTRACT> --source <OWNER_KEY> \\
  --network testnet -- set_max_tx --amount 10000000

# Whitelist a merchant
stellar contract invoke --id <CONTRACT> --source <OWNER_KEY> \\
  --network testnet -- whitelist_merchant --merchant <MERCHANT_ADDR>`}</code></pre>

      <h2>Step 3: Make Your First Payment</h2>
      <p>
        The agent calls <code>authorize_payment</code> on the contract. The
        contract validates all policies and executes the USDC transfer:
      </p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`import { authorizePayment } from "./stellar/contract.js";

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

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 my-4">
        <p className="text-blue-300 mb-0">
          <strong>Key insight:</strong> The agent signs with its OWN keypair,
          not the owner&apos;s. It authorizes the contract invocation — the contract
          executes the USDC transfer internally. The agent never touches fund keys.
        </p>
      </div>

      <h2>Step 4: Handle the Full x402 Flow</h2>
      <pre className="bg-slate-800 border border-slate-700"><code>{`// 1. Request a protected resource
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

      <h2>Step 5: Monitor via Dashboard</h2>
      <p>
        Open <code>http://localhost:3000/dashboard</code> to see:
      </p>
      <ul>
        <li>Real-time balance and spend velocity</li>
        <li>Transaction history with Stellar Expert links</li>
        <li>Policy configuration (Agent Vault screen)</li>
        <li>Emergency kill switch</li>
      </ul>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mt-6">
        <h3 className="text-green-400 mt-0">What&apos;s Next?</h3>
        <ul className="mb-0">
          <li>
            <a href="/docs/x402-middleware" className="text-blue-400">x402 Middleware</a>{" "}
            — protect your own Express endpoints with x402 paywalls
          </li>
          <li>
            <a href="/docs/mcp-integration" className="text-blue-400">MCP Integration</a>{" "}
            — connect SpendGuard to Claude, GPT, or any MCP-compatible agent
          </li>
        </ul>
      </div>
    </article>
  );
}
