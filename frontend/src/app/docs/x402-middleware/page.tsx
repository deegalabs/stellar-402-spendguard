export default function X402MiddlewarePage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>x402 Express Middleware</h1>
      <p className="lead text-slate-300 text-lg">
        Protect any Express endpoint with an x402 paywall in 3 lines of code.
      </p>

      <h2>Overview</h2>
      <p>
        The <code>x402Paywall</code> middleware handles the full x402 flow:
      </p>
      <ol>
        <li>Returns HTTP 402 with x402 challenge to unpaid requests</li>
        <li>Validates payment proofs against the Stellar network</li>
        <li>Caches verified payments (5-min TTL) to avoid re-verification</li>
        <li>Passes through to your handler when payment is valid</li>
      </ol>

      <h2>Quick Start</h2>
      <pre className="bg-slate-800 border border-slate-700"><code>{`import express from "express";
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

      <h2>PaywallOptions</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Type</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>price</code></td>
              <td>string</td>
              <td>Yes</td>
              <td>Price in USDC (e.g. &quot;0.10&quot; for 10 cents)</td>
            </tr>
            <tr>
              <td><code>merchant</code></td>
              <td>string</td>
              <td>Yes</td>
              <td>Merchant Stellar address (G...) that receives payment</td>
            </tr>
            <tr>
              <td><code>description</code></td>
              <td>string</td>
              <td>Yes</td>
              <td>Human-readable description of the resource</td>
            </tr>
            <tr>
              <td><code>network</code></td>
              <td>string</td>
              <td>No</td>
              <td>Default: &quot;stellar:testnet&quot;</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>402 Response Format</h2>
      <p>When a request arrives without payment, the middleware returns:</p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`HTTP/1.1 402 Payment Required
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

      <h2>Pricing Table</h2>
      <p>
        Expose available resources and their prices for agent discovery:
      </p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`import { x402PricingTable } from "./middleware/x402-spendguard.js";

app.get("/api/pricing",
  x402PricingTable([
    { path: "/api/weather", price: "0.10", description: "Current weather" },
    { path: "/api/forecast", price: "0.25", description: "7-day forecast" },
    { path: "/api/satellite", price: "1.00", description: "Satellite imagery" },
  ])
);`}</code></pre>

      <h2>Payment Verification</h2>
      <p>
        The middleware verifies payment proofs by checking the transaction on
        Stellar Horizon. Valid payments are cached in-memory for 5 minutes.
      </p>
      <p>
        Agents send payment proof via the <code>X-Payment</code> or{" "}
        <code>X-Payment-Proof</code> header:
      </p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`GET /api/premium-weather HTTP/1.1
X-Payment-Proof: abc123def456...  # Stellar transaction hash`}</code></pre>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mt-6">
        <h3 className="text-green-400 mt-0">Integration with SpendGuard</h3>
        <p className="mb-0">
          The x402 middleware works with any Stellar payment, but when combined
          with SpendGuard, the agent&apos;s payments are automatically governed by
          on-chain spending policies. The middleware verifies the payment; the
          contract enforces the limits.
        </p>
      </div>
    </article>
  );
}
