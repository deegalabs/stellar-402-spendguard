export default function ArchitecturePage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Architecture</h1>
      <p className="lead text-slate-300 text-lg">
        System overview, component boundaries, and data flow.
      </p>

      <h2>System Diagram</h2>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 font-mono text-sm">
        <pre className="bg-transparent border-none p-0 m-0 text-slate-300"><code>{`┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
│  Dashboard │ Agent Vault │ Liquidity │ Audit │ Live Demo    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  Docs: Introduction │ Guides │ Reference                    │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP / SSE
┌────────────────────────────▼────────────────────────────────┐
│                    Backend (Express.js)                      │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Dashboard │ │  Admin   │ │   Demo   │ │  Stripe  │      │
│  │   API    │ │   API    │ │   API    │ │ Checkout │      │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
│       │             │            │             │            │
│  ┌────▼─────────────▼────────────▼─────────────▼───┐       │
│  │              Stellar Client Layer               │       │
│  │    Soroban RPC │ Horizon │ Event Stream        │       │
│  └─────────────────────┬───────────────────────────┘       │
│                        │                                    │
│  ┌─────────────────────┤  ┌────────────────────────┐       │
│  │    x402 Agent       │  │    MCP Server          │       │
│  │  ┌────────────┐     │  │  4 tools (stdio)       │       │
│  │  │ 402 Client │     │  │  get_status             │       │
│  │  │ Payment    │     │  │  authorize_payment      │       │
│  │  │ Handler    │     │  │  check_budget           │       │
│  │  └────────────┘     │  │  get_transactions       │       │
│  └─────────────────────┘  └────────────────────────┘       │
│                        │                                    │
│  ┌─────────────────────┴───────────────────────────┐       │
│  │         x402 Paywall Middleware                  │       │
│  │  x402Paywall() │ x402PricingTable()             │       │
│  └─────────────────────────────────────────────────┘       │
└────────────────────────────┬────────────────────────────────┘
                             │ Soroban RPC
┌────────────────────────────▼────────────────────────────────┐
│                BudgetGuard Contract (Soroban)                │
│                                                             │
│  authorize_payment() ──► Policy checks ──► USDC Transfer    │
│  ┌──────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐           │
│  │Paused│ │Whitelist │ │ Limits  │ │ Balance  │           │
│  │Check │ │  Check   │ │  Check  │ │  Check   │           │
│  └──────┘ └──────────┘ └─────────┘ └──────────┘           │
│                                                             │
│  Storage: Owner │ Agent │ DailyLimit │ MaxTx │ SpentToday  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│               Stellar Ledger (< 5s finality)                │
│                  USDC SAC (native Circle)                    │
└─────────────────────────────────────────────────────────────┘`}</code></pre>
      </div>

      <h2>Component Boundaries</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr><th>Component</th><th>Responsibility</th><th>Trusts</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Contract</strong></td>
              <td>Policy enforcement, USDC transfers, audit events</td>
              <td>Nothing — validates everything</td>
            </tr>
            <tr>
              <td><strong>Backend</strong></td>
              <td>API layer, transaction signing, event streaming</td>
              <td>Contract for policy enforcement, Horizon for events</td>
            </tr>
            <tr>
              <td><strong>Frontend</strong></td>
              <td>Dashboard, configuration UI, demo visualization</td>
              <td>Backend API, Freighter for wallet signing</td>
            </tr>
            <tr>
              <td><strong>Agent</strong></td>
              <td>Detects 402 responses, triggers payments</td>
              <td>Contract to enforce limits (agent can&apos;t bypass)</td>
            </tr>
            <tr>
              <td><strong>MCP Server</strong></td>
              <td>Exposes SpendGuard tools to AI agents</td>
              <td>Contract for policy enforcement</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Key Design Decisions</h2>

      <div className="not-prose space-y-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-blue-400 text-base font-semibold mb-2">
            ADR-001: Contract-as-Account
          </h3>
          <p className="text-slate-300 text-sm">
            The contract holds USDC directly using Soroban Custom Account.
            The agent invokes the contract — the contract transfers USDC from
            its own address. The agent never has access to fund keys.
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-blue-400 text-base font-semibold mb-2">
            ADR-002: Lazy Daily Reset
          </h3>
          <p className="text-slate-300 text-sm">
            No cron job. The daily counter resets when the next payment is
            attempted after 86400 seconds have elapsed since the last reset.
            If no payments for 48 hours, the reset triggers on the next call.
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-blue-400 text-base font-semibold mb-2">
            ADR-003: Agent Separation
          </h3>
          <p className="text-slate-300 text-sm">
            The agent has its own keypair, separate from the owner. If the
            agent process is compromised, the attacker can only spend up to
            the daily limit — they cannot change policies, pause the contract,
            or access the owner&apos;s keys.
          </p>
        </div>
      </div>

      <h2 className="mt-8">Data Flow: x402 Payment</h2>
      <ol>
        <li>Agent sends HTTP request to merchant endpoint</li>
        <li>Merchant returns <strong>HTTP 402</strong> with x402 challenge (price, payTo)</li>
        <li>Agent calls <code>authorize_payment(price, merchant)</code> on SpendGuard</li>
        <li>Contract validates: not paused, whitelisted, within limits, sufficient balance</li>
        <li>Contract executes <code>USDC.transfer(contract → merchant)</code></li>
        <li>Stellar ledger confirms in &lt; 5 seconds</li>
        <li>Agent retries original request with <code>X-Payment-Proof</code> header</li>
        <li>Merchant verifies payment and returns <strong>HTTP 200</strong></li>
      </ol>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mt-6">
        <h3 className="text-green-400 mt-0">Full Documentation</h3>
        <p className="mb-0 text-slate-300">
          For the complete architecture document with all 7 ADRs, see{" "}
          <a
            href="https://github.com/deegalabs/stellar-402-spendguard/blob/main/docs/ARCHITECTURE.md"
            className="text-blue-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs/ARCHITECTURE.md
          </a>{" "}
          and{" "}
          <a
            href="https://github.com/deegalabs/stellar-402-spendguard/blob/main/docs/DECISIONS.md"
            className="text-blue-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs/DECISIONS.md
          </a>{" "}
          in the repository.
        </p>
      </div>
    </article>
  );
}
