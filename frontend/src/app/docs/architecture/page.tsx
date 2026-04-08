import Mermaid from "@/components/Mermaid";

const SYSTEM_DIAGRAM = `graph TB
    subgraph Frontend["🌐 Frontend — Next.js 14"]
        FE1[Landing Page]
        FE2[Dashboard]
        FE3[Agent Vault]
        FE4[Liquidity]
        FE5[Audit Log]
        FE6[Live Demo]
        FE7[Docs]
    end

    subgraph Backend["⚙️ Backend — Express + TypeScript"]
        B1[Dashboard API]
        B2[Admin API]
        B3[Demo API]
        B4[Stripe Checkout]
        B5[x402 Agent]
        B6[MCP Server]
        B7[x402 Paywall Middleware]
        SC[Stellar Client Layer<br/>Soroban RPC · Horizon · Events]
    end

    subgraph Chain["🔐 BudgetGuard Contract — Soroban"]
        CC[authorize_payment]
        P1[Pause Check]
        P2[Whitelist Check]
        P3[Limit Check]
        P4[Balance Check]
        ST[(Storage:<br/>Owner · Agent · Limits<br/>SpentToday · Whitelist)]
    end

    Ledger[(Stellar Ledger<br/>USDC SAC · &lt;5s finality)]
    Freighter[Freighter Wallet]

    Frontend -->|HTTP / SSE| Backend
    Freighter -.->|owner signatures| Frontend
    B1 --> SC
    B2 --> SC
    B3 --> SC
    B5 --> SC
    B6 --> SC
    B7 --> SC
    SC -->|Soroban RPC| CC
    CC --> P1 --> P2 --> P3 --> P4
    CC <--> ST
    CC -->|USDC.transfer| Ledger
    Ledger -.->|events| SC

    classDef fe fill:#1e293b,stroke:#6366f1,color:#e2e8f0
    classDef be fill:#0f172a,stroke:#22c55e,color:#e2e8f0
    classDef sc fill:#0b1220,stroke:#f59e0b,color:#fef3c7
    class Frontend fe
    class Backend be
    class Chain sc`;

const ACTORS_DIAGRAM = `graph LR
    Owner((Owner))
    Agent((AI Agent))
    Merchant((Merchant))
    MCP((MCP Client))

    Owner -->|manages| Contract[BudgetGuard Contract]
    Agent -->|pays through| Contract
    Contract -->|transfers USDC| Merchant
    MCP -->|discovers tools| MCPServer[MCP Server]
    MCPServer -->|calls| Contract

    style Owner fill:#f59e0b,color:#000
    style Agent fill:#22c55e,color:#000
    style Merchant fill:#06b6d4,color:#000
    style MCP fill:#8b5cf6,color:#fff`;

const OWNER_UC_DIAGRAM = `graph TD
    Owner((Owner))

    Owner --> UC1[Initialize Contract]
    Owner --> UC2[Set Daily Limit]
    Owner --> UC3[Set Max Per-Transaction]
    Owner --> UC4[Whitelist Merchant]
    Owner --> UC5[Remove Merchant]
    Owner --> UC6[Emergency Pause]
    Owner --> UC7[Emergency Unpause]
    Owner --> UC8[Top Up USDC]
    Owner --> UC9[Change Agent Address]
    Owner --> UC10[View Dashboard]
    Owner --> UC11[View Audit Log]

    UC1 -. requires .-> Freighter[Freighter Wallet]
    UC2 -. requires .-> Freighter
    UC3 -. requires .-> Freighter
    UC4 -. requires .-> Freighter
    UC5 -. requires .-> Freighter
    UC6 -. requires .-> Freighter
    UC7 -. requires .-> Freighter
    UC8 -. requires .-> Freighter
    UC8 -. triggers .-> Stripe[Stripe Test Mode]

    style Owner fill:#f59e0b,color:#000
    style Freighter fill:#6366f1,color:#fff
    style Stripe fill:#635bff,color:#fff`;

const AGENT_UC_DIAGRAM = `graph TD
    Agent((AI Agent))

    Agent --> UC1[Request x402 Resource]
    UC1 --> UC2{HTTP 402?}
    UC2 -->|yes| UC3[Parse x402 Challenge]
    UC2 -->|no| UC7[Receive Resource]
    UC3 --> UC4[Call authorize_payment]
    UC4 --> UC5{Policy Check}
    UC5 -->|approved| UC6[USDC Transfer on Stellar]
    UC5 -->|rejected| UC8[Log Rejection]
    UC6 --> UC7
    UC8 --> UC9[Handle Error]

    UC5 -. validates .-> C1[Not Paused]
    UC5 -. validates .-> C2[Merchant Whitelisted]
    UC5 -. validates .-> C3[Within Max Tx]
    UC5 -. validates .-> C4[Within Daily Limit]
    UC5 -. validates .-> C5[Sufficient Balance]

    style Agent fill:#22c55e,color:#000
    style UC5 fill:#ef4444,color:#fff`;

const MCP_UC_DIAGRAM = `graph TD
    MCP((MCP Agent))

    MCP --> UC1[spendguard_get_status]
    MCP --> UC2[spendguard_check_budget]
    MCP --> UC3[spendguard_authorize_payment]
    MCP --> UC4[spendguard_get_transactions]

    UC1 --> R1[Balance + Limits + Pause State]
    UC2 --> R2[Dry-Run Policy Validation]
    UC3 --> R3[Execute Governed Payment]
    UC4 --> R4[Audit Log + Stellar Expert Links]

    UC2 -. informs .-> UC3
    UC1 -. informs .-> UC2

    style MCP fill:#8b5cf6,color:#fff`;

const PAYMENT_FLOW_DIAGRAM = `sequenceDiagram
    participant A as AI Agent
    participant M as Merchant API
    participant C as BudgetGuard
    participant S as Stellar Ledger
    participant H as Horizon
    participant D as Dashboard

    A->>M: GET /api/resource
    M-->>A: 402 Payment Required<br/>(price, payTo)

    A->>C: authorize_payment(price, merchant)
    Note over C: Validate pause,<br/>whitelist, max_tx,<br/>daily_limit, balance

    alt Policy Approved
        C->>S: USDC.transfer(contract → merchant)
        S-->>C: Confirmed (<5s)
        C->>C: Emit payment_authorized
        C-->>A: Ok(tx_hash)
        A->>M: GET /api/resource + X-Payment-Proof
        M-->>A: 200 OK (data)
    else Policy Rejected
        C-->>A: Error (ExceedsDailyLimit /<br/>ContractPaused / ...)
        A->>A: Log rejection, alert
    end

    H->>D: SSE event stream
    D->>D: Update Audit Log`;

const KILL_SWITCH_DIAGRAM = `sequenceDiagram
    participant O as Owner
    participant F as Freighter
    participant C as BudgetGuard
    participant A as AI Agent

    O->>F: Click "Emergency Pause"
    F-->>O: Sign transaction
    O->>C: emergency_pause()
    C->>C: Set paused = true
    C->>C: Emit emergency_pause event

    Note over A: Next payment attempt
    A->>C: authorize_payment(price, merchant)
    C-->>A: Error::ContractPaused
    A->>A: Stop retrying, alert owner

    Note over O: When ready to resume
    O->>F: Click "Unpause"
    F-->>O: Sign transaction
    O->>C: emergency_unpause()
    C->>C: Set paused = false`;

const TRUST_DIAGRAM = `graph LR
    subgraph Trusted["Trusted on-chain"]
        Contract[BudgetGuard Contract]
        SAC[USDC SAC]
    end

    subgraph SemiTrusted["Relays only — no custody"]
        Backend[Backend API]
        Facilitator[OpenZeppelin Relayer]
        Horizon[Horizon API]
    end

    subgraph Untrusted["Untrusted — can be compromised"]
        Agent[Agent Process]
        Frontend[Frontend UI]
    end

    Frontend -->|status reads| Backend
    Agent -->|authorize_payment| Contract
    Backend -->|broadcasts| Facilitator
    Facilitator -->|submits| Contract
    Contract -->|transfer| SAC
    Backend -->|reads| Horizon
    Contract -.->|events| Horizon

    classDef trusted fill:#0f172a,stroke:#22c55e,color:#e2e8f0
    classDef semi fill:#0f172a,stroke:#f59e0b,color:#fef3c7
    classDef untrusted fill:#0f172a,stroke:#ef4444,color:#fecaca
    class Trusted trusted
    class SemiTrusted semi
    class Untrusted untrusted`;

export default function ArchitecturePage() {
  return (
    <div className="flex flex-col gap-12 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-disabled">
        <span>Docs</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-accent-fg font-bold">Architecture</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-4">
          Architecture
        </h1>
        <p className="text-lg text-text-secondary">
          System overview, component boundaries, actors, use cases, and end-to-end data flow.
        </p>
      </div>

      {/* One-Sentence Summary */}
      <section className="bg-primary-glow border-l-4 border-primary-500 p-5 rounded-r-xl">
        <p className="text-sm text-text-secondary leading-relaxed">
          <strong className="text-primary-fg">SpendGuard</strong> is a Soroban smart contract that
          acts as the sole payment authorizer for an AI agent using{" "}
          <strong className="text-text-primary">x402</strong> on Stellar — the agent requests, the
          contract decides, the SAC executes. The agent never touches the fund keys.
        </p>
      </section>

      {/* System Diagram */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-2">System Overview</h2>
        <p className="text-sm text-text-muted mb-6">
          The frontend never talks to the chain directly. The backend is a relay — it never
          custodies funds. All policy lives inside the Soroban contract.
        </p>
        <Mermaid chart={SYSTEM_DIAGRAM} caption="Figure 1 · High-level system topology" />
      </section>

      {/* Trust Model */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Trust Model</h2>
        <p className="text-sm text-text-muted mb-6">
          Classify every component by how much trust it requires. Anything untrusted must be
          contained by something on-chain.
        </p>
        <Mermaid chart={TRUST_DIAGRAM} caption="Figure 2 · Trust boundaries" />
      </section>

      {/* Component Boundaries */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-4">Component Boundaries</h2>
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-200 text-text-secondary text-[10px] font-mono uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Component</th>
                <th className="px-4 py-3 text-left">Technology</th>
                <th className="px-4 py-3 text-left">Responsibility</th>
                <th className="px-4 py-3 text-left">What It Does NOT Do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary whitespace-nowrap">
                  BudgetGuard
                </td>
                <td className="px-4 py-3 text-text-muted text-xs font-mono">Rust · Soroban SDK v22</td>
                <td className="px-4 py-3 text-text-secondary">
                  Holds USDC via SAC, enforces spending policies, executes transfers internally,
                  emits events
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  No agent keys, no HTTP, no Stripe
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary whitespace-nowrap">Agent</td>
                <td className="px-4 py-3 text-text-muted text-xs font-mono">Node · TypeScript</td>
                <td className="px-4 py-3 text-text-secondary">
                  Polls x402 endpoints, parses 402 challenges, builds Soroban transactions, signs
                  with its own keypair
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  Cannot hold fund keys or change policy
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary whitespace-nowrap">Backend</td>
                <td className="px-4 py-3 text-text-muted text-xs font-mono">Express · TypeScript</td>
                <td className="px-4 py-3 text-text-secondary">
                  Dashboard endpoints, Stripe webhook intake, calls contract admin functions
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  No x402 payments, no custody
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary whitespace-nowrap">Frontend</td>
                <td className="px-4 py-3 text-text-muted text-xs font-mono">Next.js 14 · Tailwind</td>
                <td className="px-4 py-3 text-text-secondary">
                  Displays contract state, governance UI (sliders, kill switch), Freighter connect
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  Cannot bypass contract, no local state
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary whitespace-nowrap">
                  MCP Server
                </td>
                <td className="px-4 py-3 text-text-muted text-xs font-mono">Node · stdio</td>
                <td className="px-4 py-3 text-text-secondary">
                  Exposes <code className="bg-dark-200 px-1 rounded">get_status</code>,{" "}
                  <code className="bg-dark-200 px-1 rounded">check_budget</code>,{" "}
                  <code className="bg-dark-200 px-1 rounded">authorize_payment</code>,{" "}
                  <code className="bg-dark-200 px-1 rounded">get_transactions</code> to any LLM
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  No policy logic — the contract is still canonical
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary whitespace-nowrap">
                  Facilitator
                </td>
                <td className="px-4 py-3 text-text-muted text-xs font-mono">OZ Relayer</td>
                <td className="px-4 py-3 text-text-secondary">
                  Relays signed transactions to the Stellar ledger, abstracts gas management
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  No custody, no policy validation
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary whitespace-nowrap">
                  Freighter
                </td>
                <td className="px-4 py-3 text-text-muted text-xs font-mono">Browser extension</td>
                <td className="px-4 py-3 text-text-secondary">
                  Signs owner transactions for admin operations (limits, pause, top-up)
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  Never signs agent transactions
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Actors */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Actors</h2>
        <p className="text-sm text-text-muted mb-6">
          Four distinct identities interact with the contract. Each one has a different key and a
          different blast radius.
        </p>
        <Mermaid chart={ACTORS_DIAGRAM} caption="Figure 3 · Actor overview" />
      </section>

      {/* Use Cases */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Use Cases</h2>
        <p className="text-sm text-text-muted mb-6">
          Three grouped diagrams, one per actor. Dashed lines are dependencies; solid lines are
          invocations.
        </p>

        <div className="space-y-10">
          <div>
            <h3 className="text-base font-bold text-accent-fg mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              Owner Use Cases
            </h3>
            <p className="text-sm text-text-muted mb-3">
              Every admin action requires a Freighter signature. Top-up additionally triggers the
              Stripe test-mode on-ramp.
            </p>
            <Mermaid chart={OWNER_UC_DIAGRAM} caption="Figure 4 · Owner UC diagram" />
          </div>

          <div>
            <h3 className="text-base font-bold text-accent-fg mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              Agent Use Cases
            </h3>
            <p className="text-sm text-text-muted mb-3">
              The agent has only one power: asking the contract to pay. Five policy checks run on
              every request.
            </p>
            <Mermaid chart={AGENT_UC_DIAGRAM} caption="Figure 5 · Agent UC diagram" />
          </div>

          <div>
            <h3 className="text-base font-bold text-accent-fg mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">hub</span>
              MCP Agent Use Cases
            </h3>
            <p className="text-sm text-text-muted mb-3">
              LLM clients reach SpendGuard through the MCP server. The dry-run{" "}
              <code className="bg-dark-200 px-1 rounded">check_budget</code> tool lets an agent
              reason about affordability before committing.
            </p>
            <Mermaid chart={MCP_UC_DIAGRAM} caption="Figure 6 · MCP UC diagram" />
          </div>
        </div>
      </section>

      {/* End-to-End Payment Flow */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-2">End-to-End Payment Flow</h2>
        <p className="text-sm text-text-muted mb-6">
          This sequence diagram is the canonical happy path and its reject branch. Every other
          diagram in this page is a projection of this one.
        </p>
        <Mermaid
          chart={PAYMENT_FLOW_DIAGRAM}
          caption="Figure 7 · x402 → SpendGuard → Stellar → Merchant"
        />
      </section>

      {/* Kill Switch */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Emergency Kill Switch</h2>
        <p className="text-sm text-text-muted mb-6">
          The owner can revoke all future authorizations in one signature. In-flight transactions
          already on the ledger are final.
        </p>
        <Mermaid chart={KILL_SWITCH_DIAGRAM} caption="Figure 8 · Pause / unpause lifecycle" />
      </section>

      {/* Why Stellar */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-4">Why Stellar</h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          The question is not &ldquo;why Stellar over Ethereum&rdquo; — it is why Stellar is the
          only chain where this architecture works correctly.
        </p>

        <div className="bg-surface-card p-5 rounded-xl border border-surface-border mb-4">
          <h3 className="text-accent-fg font-bold text-sm mb-2">
            Soroban Custom Account + Auth Framework
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Soroban allows a smart contract to act as a programmable account. BudgetGuard{" "}
            <strong className="text-text-primary">holds USDC</strong> and authorizes transfers
            internally via the SAC. The agent invokes{" "}
            <code className="bg-dark-200 px-1 rounded text-xs">authorize_payment()</code> — the
            contract validates policies and calls{" "}
            <code className="bg-dark-200 px-1 rounded text-xs">token.transfer()</code> from its own
            address to the merchant.
          </p>
          <p className="text-sm text-text-secondary leading-relaxed mt-3">
            <strong className="text-text-primary">The agent never touches the fund keys.</strong>{" "}
            The authorization is born and dies inside the contract logic. This is not possible on
            EVM chains where an EOA must sign every token transfer, or where contract-based wallets
            require complex proxy patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-dark-50 border border-surface-border rounded-xl p-4">
            <p className="stat-label mb-1">Fees</p>
            <p className="text-sm text-text-primary font-mono">~$0.00001 / tx</p>
            <p className="text-xs text-text-muted mt-1">Micropayments of $0.001 are viable.</p>
          </div>
          <div className="bg-dark-50 border border-surface-border rounded-xl p-4">
            <p className="stat-label mb-1">Finality</p>
            <p className="text-sm text-text-primary font-mono">&lt; 5 s</p>
            <p className="text-xs text-text-muted mt-1">x402 is a synchronous HTTP round-trip.</p>
          </div>
          <div className="bg-dark-50 border border-surface-border rounded-xl p-4">
            <p className="stat-label mb-1">USDC</p>
            <p className="text-sm text-text-primary font-mono">Native SAC</p>
            <p className="text-xs text-text-muted mt-1">Circle-issued, not bridged or wrapped.</p>
          </div>
          <div className="bg-dark-50 border border-surface-border rounded-xl p-4">
            <p className="stat-label mb-1">Uptime</p>
            <p className="text-sm text-text-primary font-mono">99.99%</p>
            <p className="text-xs text-text-muted mt-1">20.6B+ operations processed.</p>
          </div>
        </div>
      </section>

      {/* Key Design Decisions */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-4">Key Design Decisions</h2>
        <div className="space-y-4">
          <div className="bg-surface-card p-5 rounded-xl border border-surface-border shadow-sm">
            <h3 className="text-accent-fg font-bold text-sm mb-2">ADR-001 · Contract-as-Account</h3>
            <p className="text-text-secondary text-sm">
              The contract holds USDC directly using Soroban Custom Account. The agent invokes the
              contract — the contract transfers USDC from its own address. The agent never has
              access to fund keys.
            </p>
          </div>

          <div className="bg-surface-card p-5 rounded-xl border border-surface-border shadow-sm">
            <h3 className="text-accent-fg font-bold text-sm mb-2">ADR-002 · Lazy Daily Reset</h3>
            <p className="text-text-secondary text-sm">
              No cron job. The daily counter resets when the next payment is attempted after 86400
              seconds have elapsed since the last reset. If no payments for 48 hours, the reset
              triggers on the next call.
            </p>
          </div>

          <div className="bg-surface-card p-5 rounded-xl border border-surface-border shadow-sm">
            <h3 className="text-accent-fg font-bold text-sm mb-2">ADR-003 · Agent Separation</h3>
            <p className="text-text-secondary text-sm">
              The agent has its own keypair, separate from the owner. If the agent process is
              compromised, the attacker can only spend up to the daily limit — they cannot change
              policies, pause the contract, or access the owner&apos;s keys.
            </p>
          </div>

          <div className="bg-surface-card p-5 rounded-xl border border-surface-border shadow-sm">
            <h3 className="text-accent-fg font-bold text-sm mb-2">ADR-004 · No Mutable Backend</h3>
            <p className="text-text-secondary text-sm">
              The backend stores nothing. Every value in the UI is read live from Horizon or the
              contract. You cannot forge history because there is no history to forge — only the
              ledger.
            </p>
          </div>
        </div>
      </section>

      {/* External Dependencies */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-4">External Dependencies</h2>
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-200 text-text-secondary text-[10px] font-mono uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Dependency</th>
                <th className="px-4 py-3 text-left">Testnet Equivalent</th>
                <th className="px-4 py-3 text-left">Required For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              <tr>
                <td className="px-4 py-2 font-bold text-text-primary">Stellar Network</td>
                <td className="px-4 py-2 text-text-secondary font-mono text-xs">
                  horizon-testnet.stellar.org
                </td>
                <td className="px-4 py-2 text-text-secondary">All on-chain operations</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-bold text-text-primary">USDC SAC</td>
                <td className="px-4 py-2 text-text-secondary font-mono text-xs">Testnet USDC</td>
                <td className="px-4 py-2 text-text-secondary">Token transfers</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-bold text-text-primary">Facilitator</td>
                <td className="px-4 py-2 text-text-secondary font-mono text-xs">
                  Testnet facilitator endpoint
                </td>
                <td className="px-4 py-2 text-text-secondary">x402 payment relay</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-bold text-text-primary">Freighter</td>
                <td className="px-4 py-2 text-text-secondary font-mono text-xs">Testnet mode</td>
                <td className="px-4 py-2 text-text-secondary">Owner transaction signing</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-bold text-text-primary">Stripe</td>
                <td className="px-4 py-2 text-text-secondary font-mono text-xs">Test Mode keys</td>
                <td className="px-4 py-2 text-text-secondary">Simulated fiat on-ramp</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-bold text-text-primary">Horizon API</td>
                <td className="px-4 py-2 text-text-secondary font-mono text-xs">Testnet Horizon</td>
                <td className="px-4 py-2 text-text-secondary">Events, balance reads</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Out of Scope */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-4">Out of Scope</h2>
        <ul className="space-y-2 text-sm text-text-secondary list-disc list-inside">
          <li>Multi-agent per contract (single agent per contract in MVP)</li>
          <li>Agent reputation scoring</li>
          <li>Real Stripe MPP integration (simulated only)</li>
          <li>Mainnet deployment</li>
          <li>Auto-refill autonomous logic</li>
          <li>Rate limiting beyond daily total</li>
        </ul>
      </section>

      {/* Full docs link */}
      <section>
        <div className="bg-success-glow border border-success/20 rounded-xl p-4">
          <h3 className="text-success-fg font-bold text-sm mb-2">Full Documentation</h3>
          <p className="text-sm text-text-secondary">
            For the complete architecture document with all ADRs, see{" "}
            <a
              href="https://github.com/deegalabs/stellar-402-spendguard/blob/main/docs/ARCHITECTURE.md"
              className="text-accent-fg hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              docs/ARCHITECTURE.md
            </a>{" "}
            and{" "}
            <a
              href="https://github.com/deegalabs/stellar-402-spendguard/blob/main/docs/DECISIONS.md"
              className="text-accent-fg hover:underline"
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
