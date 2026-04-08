export default function ArchitecturePage() {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400">
        <span>Docs</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-secondary font-bold">Architecture</span>
      </div>

      <div>
        <h1 className="text-4xl font-black text-primary tracking-tighter mb-4">Architecture</h1>
        <p className="text-lg text-on-surface-variant">
          System overview, component boundaries, and data flow.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">System Diagram</h2>
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm overflow-x-auto">
          <pre className="text-primary"><code>{`┌─────────────────────────────────────────────────────────────┐
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
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Component Boundaries</h2>
        <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[10px] font-mono uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Component</th>
                <th className="px-4 py-3 text-left">Responsibility</th>
                <th className="px-4 py-3 text-left">Trusts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              <tr>
                <td className="px-4 py-2 font-bold text-primary">Contract</td>
                <td className="px-4 py-2 text-on-surface-variant">Policy enforcement, USDC transfers, audit events</td>
                <td className="px-4 py-2 text-on-surface-variant">Nothing — validates everything</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-bold text-primary">Backend</td>
                <td className="px-4 py-2 text-on-surface-variant">API layer, transaction signing, event streaming</td>
                <td className="px-4 py-2 text-on-surface-variant">Contract for policy enforcement, Horizon for events</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-bold text-primary">Frontend</td>
                <td className="px-4 py-2 text-on-surface-variant">Dashboard, configuration UI, demo visualization</td>
                <td className="px-4 py-2 text-on-surface-variant">Backend API, Freighter for wallet signing</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-bold text-primary">Agent</td>
                <td className="px-4 py-2 text-on-surface-variant">Detects 402 responses, triggers payments</td>
                <td className="px-4 py-2 text-on-surface-variant">Contract to enforce limits (agent can&apos;t bypass)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-bold text-primary">MCP Server</td>
                <td className="px-4 py-2 text-on-surface-variant">Exposes SpendGuard tools to AI agents</td>
                <td className="px-4 py-2 text-on-surface-variant">Contract for policy enforcement</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Key Design Decisions</h2>
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-outline-variant/20 shadow-sm">
            <h3 className="text-secondary font-bold text-sm mb-2">
              ADR-001: Contract-as-Account
            </h3>
            <p className="text-on-surface-variant text-sm">
              The contract holds USDC directly using Soroban Custom Account.
              The agent invokes the contract — the contract transfers USDC from
              its own address. The agent never has access to fund keys.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-outline-variant/20 shadow-sm">
            <h3 className="text-secondary font-bold text-sm mb-2">
              ADR-002: Lazy Daily Reset
            </h3>
            <p className="text-on-surface-variant text-sm">
              No cron job. The daily counter resets when the next payment is
              attempted after 86400 seconds have elapsed since the last reset.
              If no payments for 48 hours, the reset triggers on the next call.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-outline-variant/20 shadow-sm">
            <h3 className="text-secondary font-bold text-sm mb-2">
              ADR-003: Agent Separation
            </h3>
            <p className="text-on-surface-variant text-sm">
              The agent has its own keypair, separate from the owner. If the
              agent process is compromised, the attacker can only spend up to
              the daily limit — they cannot change policies, pause the contract,
              or access the owner&apos;s keys.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Data Flow: x402 Payment</h2>
        <ol className="text-on-surface-variant space-y-1 list-decimal list-inside">
          <li>Agent sends HTTP request to merchant endpoint</li>
          <li>Merchant returns <strong className="text-primary">HTTP 402</strong> with x402 challenge (price, payTo)</li>
          <li>Agent calls <code className="bg-surface-container px-1 rounded text-xs">authorize_payment(price, merchant)</code> on SpendGuard</li>
          <li>Contract validates: not paused, whitelisted, within limits, sufficient balance</li>
          <li>Contract executes <code className="bg-surface-container px-1 rounded text-xs">USDC.transfer(contract → merchant)</code></li>
          <li>Stellar ledger confirms in &lt; 5 seconds</li>
          <li>Agent retries original request with <code className="bg-surface-container px-1 rounded text-xs">X-Payment-Proof</code> header</li>
          <li>Merchant verifies payment and returns <strong className="text-primary">HTTP 200</strong></li>
        </ol>
      </section>

      <section>
        <div className="bg-tertiary-fixed/20 border border-on-tertiary-container/20 rounded-xl p-4">
          <h3 className="text-on-tertiary-container font-bold text-sm mb-2">Full Documentation</h3>
          <p className="text-sm text-on-surface-variant">
            For the complete architecture document with all 7 ADRs, see{" "}
            <a
              href="https://github.com/deegalabs/stellar-402-spendguard/blob/main/docs/ARCHITECTURE.md"
              className="text-secondary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              docs/ARCHITECTURE.md
            </a>{" "}
            and{" "}
            <a
              href="https://github.com/deegalabs/stellar-402-spendguard/blob/main/docs/DECISIONS.md"
              className="text-secondary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              docs/DECISIONS.md
            </a>{" "}
            in the repository.
          </p>
        </div>
      </section>
    </div>
  );
}
