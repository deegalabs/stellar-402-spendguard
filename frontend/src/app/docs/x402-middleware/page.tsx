export default function X402MiddlewarePage() {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400">
        <span>Docs</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-secondary font-bold">x402 Middleware</span>
      </div>

      <div>
        <h1 className="text-4xl font-black text-primary tracking-tighter mb-4">x402 Express Middleware</h1>
        <p className="text-lg text-on-surface-variant">
          Protect any Express endpoint with an x402 paywall in 3 lines of code.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Overview</h2>
        <p className="text-on-surface-variant mb-3">
          The <code className="bg-surface-container px-1 rounded text-xs">x402Paywall</code> middleware handles the full x402 flow:
        </p>
        <ol className="text-on-surface-variant space-y-1 list-decimal list-inside">
          <li>Returns HTTP 402 with x402 challenge to unpaid requests</li>
          <li>Validates payment proofs against the Stellar network</li>
          <li>Caches verified payments (5-min TTL) to avoid re-verification</li>
          <li>Passes through to your handler when payment is valid</li>
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Quick Start</h2>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`import express from "express";
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
        <h2 className="text-xl font-bold text-primary mb-4">PaywallOptions</h2>
        <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[10px] font-mono uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Option</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Required</th>
                <th className="px-4 py-3 text-left">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              <tr>
                <td className="px-4 py-2"><code className="text-xs font-bold text-primary">price</code></td>
                <td className="px-4 py-2 text-on-surface-variant">string</td>
                <td className="px-4 py-2 text-on-surface-variant">Yes</td>
                <td className="px-4 py-2 text-on-surface-variant">Price in USDC (e.g. &quot;0.10&quot; for 10 cents)</td>
              </tr>
              <tr>
                <td className="px-4 py-2"><code className="text-xs font-bold text-primary">merchant</code></td>
                <td className="px-4 py-2 text-on-surface-variant">string</td>
                <td className="px-4 py-2 text-on-surface-variant">Yes</td>
                <td className="px-4 py-2 text-on-surface-variant">Merchant Stellar address (G...) that receives payment</td>
              </tr>
              <tr>
                <td className="px-4 py-2"><code className="text-xs font-bold text-primary">description</code></td>
                <td className="px-4 py-2 text-on-surface-variant">string</td>
                <td className="px-4 py-2 text-on-surface-variant">Yes</td>
                <td className="px-4 py-2 text-on-surface-variant">Human-readable description of the resource</td>
              </tr>
              <tr>
                <td className="px-4 py-2"><code className="text-xs font-bold text-primary">network</code></td>
                <td className="px-4 py-2 text-on-surface-variant">string</td>
                <td className="px-4 py-2 text-on-surface-variant">No</td>
                <td className="px-4 py-2 text-on-surface-variant">Default: &quot;stellar:testnet&quot;</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">402 Response Format</h2>
        <p className="text-on-surface-variant mb-3">When a request arrives without payment, the middleware returns:</p>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`HTTP/1.1 402 Payment Required
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
        <h2 className="text-xl font-bold text-primary mb-4">Pricing Table</h2>
        <p className="text-on-surface-variant mb-3">
          Expose available resources and their prices for agent discovery:
        </p>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`import { x402PricingTable } from "./middleware/x402-spendguard.js";

app.get("/api/pricing",
  x402PricingTable([
    { path: "/api/weather", price: "0.10", description: "Current weather" },
    { path: "/api/forecast", price: "0.25", description: "7-day forecast" },
    { path: "/api/satellite", price: "1.00", description: "Satellite imagery" },
  ])
);`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Payment Verification</h2>
        <p className="text-on-surface-variant mb-3">
          The middleware verifies payment proofs by checking the transaction on
          Stellar Horizon. Valid payments are cached in-memory for 5 minutes.
        </p>
        <p className="text-on-surface-variant mb-3">
          Agents send payment proof via the <code className="bg-surface-container px-1 rounded text-xs">X-Payment</code> or{" "}
          <code className="bg-surface-container px-1 rounded text-xs">X-Payment-Proof</code> header:
        </p>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`GET /api/premium-weather HTTP/1.1
X-Payment-Proof: abc123def456...  # Stellar transaction hash`}</code></pre>

        <div className="bg-tertiary-fixed/20 border border-on-tertiary-container/20 rounded-xl p-4 mt-4">
          <h3 className="text-on-tertiary-container font-bold text-sm mb-2">Integration with SpendGuard</h3>
          <p className="text-sm text-on-surface-variant">
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
