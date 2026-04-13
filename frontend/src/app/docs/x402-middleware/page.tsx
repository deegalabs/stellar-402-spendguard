export default function X402MiddlewarePage() {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-disabled">
        <span>Docs</span>
        <span translate="no" className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-accent-fg font-bold">x402 Middleware</span>
      </div>

      <div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-4">x402 Express Middleware</h1>
        <p className="text-lg text-text-secondary">
          Protect any Express endpoint with an x402 paywall in 3 lines of code.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Overview</h2>
        <p className="text-text-secondary mb-3">
          The <code className="bg-dark-200 px-1 rounded text-xs">x402Paywall</code> middleware handles the full x402 flow:
        </p>
        <ol className="text-text-secondary space-y-1 list-decimal list-inside">
          <li>Returns HTTP 402 with x402 challenge to unpaid requests</li>
          <li>Validates payment proofs against the Stellar network</li>
          <li>Caches verified payments (5-min TTL) to avoid re-verification</li>
          <li>Passes through to your handler when payment is valid</li>
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Quick Start</h2>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`import express from "express";
import { x402Paywall } from "./middleware/x402-spendguard.js";

const app = express();

// Protect an endpoint — 0.10 USDC per request
app.get("/api/premium-weather",
  x402Paywall({
    price: "0.10",
    merchant: "GAURB...",
    description: "7-day premium weather forecast",
  }),
  (req, res) => {
    // This only runs after valid payment
    res.json({ forecast: "Mon 25C, Tue 23C, Wed 27C..." });
  }
);`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">PaywallOptions</h2>
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-200 text-text-secondary text-[10px] font-mono uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Option</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Required</th>
                <th className="px-4 py-3 text-left">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              <tr>
                <td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">price</code></td>
                <td className="px-4 py-2 text-text-secondary">string</td>
                <td className="px-4 py-2 text-text-secondary">Yes</td>
                <td className="px-4 py-2 text-text-secondary">Price in USDC (e.g. &quot;0.10&quot; for 10 cents)</td>
              </tr>
              <tr>
                <td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">merchant</code></td>
                <td className="px-4 py-2 text-text-secondary">string</td>
                <td className="px-4 py-2 text-text-secondary">Yes</td>
                <td className="px-4 py-2 text-text-secondary">Merchant Stellar address (G...) that receives payment</td>
              </tr>
              <tr>
                <td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">description</code></td>
                <td className="px-4 py-2 text-text-secondary">string</td>
                <td className="px-4 py-2 text-text-secondary">Yes</td>
                <td className="px-4 py-2 text-text-secondary">Human-readable description of the resource</td>
              </tr>
              <tr>
                <td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">network</code></td>
                <td className="px-4 py-2 text-text-secondary">string</td>
                <td className="px-4 py-2 text-text-secondary">No</td>
                <td className="px-4 py-2 text-text-secondary">Default: &quot;stellar:testnet&quot;</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">402 Response Format</h2>
        <p className="text-text-secondary mb-3">When a request arrives without payment, the middleware returns:</p>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "stellar:testnet",
    "price": "1000000",
    "payTo": "GAURB...",
    "asset": { "address": "CADU..." }
  }],
  "description": "7-day premium weather forecast",
  "error": "Payment Required"
}`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Pricing Table</h2>
        <p className="text-text-secondary mb-3">
          Expose available resources and their prices for agent discovery:
        </p>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`import { x402PricingTable } from "./middleware/x402-spendguard.js";

app.get("/api/pricing",
  x402PricingTable([
    { path: "/api/weather", price: "0.10", description: "Current weather" },
    { path: "/api/forecast", price: "0.25", description: "7-day forecast" },
    { path: "/api/satellite", price: "1.00", description: "Satellite imagery" },
  ])
);`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Payment Verification</h2>
        <p className="text-text-secondary mb-3">
          The middleware verifies payment proofs by checking the transaction on
          Stellar Horizon. Valid payments are cached in-memory for 5 minutes.
        </p>
        <p className="text-text-secondary mb-3">
          Agents send payment proof via the <code className="bg-dark-200 px-1 rounded text-xs">X-Payment</code> or{" "}
          <code className="bg-dark-200 px-1 rounded text-xs">X-Payment-Proof</code> header:
        </p>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`GET /api/premium-weather HTTP/1.1
X-Payment-Proof: abc123def456...  # Stellar transaction hash`}</code></pre>

        <div className="bg-success-glow border border-success/20 rounded-xl p-4 mt-4">
          <h3 className="text-success-fg font-bold text-sm mb-2">Integration with SpendGuard</h3>
          <p className="text-sm text-text-secondary">
            The x402 middleware works with any Stellar payment, but when combined
            with SpendGuard, the agent&apos;s payments are automatically governed by
            on-chain spending policies. The middleware verifies the payment; the
            contract enforces the limits.
          </p>
        </div>
      </section>
    </div>
  );
}
