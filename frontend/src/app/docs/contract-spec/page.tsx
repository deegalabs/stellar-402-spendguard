export default function ContractSpecPage() {
  const functions = [
    {
      name: "initialize",
      caller: "Owner",
      params: "owner, agent, usdc_token, daily_limit, max_tx_value",
      desc: "Set up the contract — called exactly once",
    },
    {
      name: "authorize_payment",
      caller: "Agent",
      params: "price: i128, merchant: Address",
      desc: "Validate and execute a USDC payment",
    },
    {
      name: "set_daily_limit",
      caller: "Owner",
      params: "amount: i128",
      desc: "Update daily spending cap",
    },
    {
      name: "set_max_tx",
      caller: "Owner",
      params: "amount: i128",
      desc: "Update per-transaction cap (must be <= daily_limit)",
    },
    {
      name: "whitelist_merchant",
      caller: "Owner",
      params: "merchant: Address",
      desc: "Add merchant to approved list",
    },
    {
      name: "remove_merchant",
      caller: "Owner",
      params: "merchant: Address",
      desc: "Remove merchant from approved list",
    },
    {
      name: "emergency_pause",
      caller: "Owner",
      params: "none",
      desc: "Halt all new payments immediately",
    },
    {
      name: "emergency_unpause",
      caller: "Owner",
      params: "none",
      desc: "Resume payment processing",
    },
    {
      name: "top_up",
      caller: "Owner",
      params: "from: Address, amount: i128",
      desc: "Deposit USDC into the contract",
    },
    {
      name: "set_agent",
      caller: "Owner",
      params: "new_agent: Address",
      desc: "Change the authorized agent address",
    },
    {
      name: "get_status",
      caller: "Anyone",
      params: "none",
      desc: "Read current contract state",
    },
  ];

  const invariants = [
    "spent_today never exceeds daily_limit",
    "No transfers when paused",
    "Daily reset only after > 86400 seconds (lazy, no cron)",
    "Only whitelisted merchants receive payments",
    "Only owner can call admin functions",
    "Only agent can call authorize_payment",
    "Zero-amount payments rejected",
    "Balance never goes negative",
    "Contract initializes exactly once",
    "max_tx_value <= daily_limit",
    "Arithmetic overflow is caught and rejected",
    "Events are emitted for every state change",
  ];

  const callerColors: Record<string, string> = {
    Owner: "bg-warning-50 text-warning-600",
    Agent: "bg-success-glow text-success-fg",
    Anyone: "bg-dark-200 text-text-secondary",
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-disabled">
        <span>Docs</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-accent-fg font-bold">Contract Spec</span>
      </div>

      <div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-4">Contract Specification</h1>
        <p className="text-lg text-text-secondary">
          BudgetGuard — a Soroban smart contract that enforces spending policies
          for x402 agent payments on Stellar.
        </p>
      </div>

      <div className="bg-dark-50 border border-surface-border rounded-xl p-4">
        <p className="text-text-secondary text-sm mb-1">
          <strong className="text-text-primary">Deployed on Testnet:</strong>
        </p>
        <a
          href="https://stellar.expert/explorer/testnet/contract/CCABMNFY3VKK7BI3YBWXJEE2EXX2NW5S573NASTCFXA6KBXR5PDWFD6E"
          className="text-accent-fg text-sm break-all hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          CCABMNFY3VKK7BI3YBWXJEE2EXX2NW5S573NASTCFXA6KBXR5PDWFD6E
        </a>
      </div>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Storage Schema</h2>
        <p className="text-text-secondary mb-3">All monetary values are in USDC stroops. <strong className="text-text-primary">1 USDC = 10,000,000 stroops.</strong></p>
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-200 text-text-secondary text-[10px] font-mono uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Key</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">Owner</code></td><td className="px-4 py-2 text-text-secondary">Address</td><td className="px-4 py-2 text-text-secondary">Controls the contract</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">Agent</code></td><td className="px-4 py-2 text-text-secondary">Address</td><td className="px-4 py-2 text-text-secondary">Authorized to call authorize_payment</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">DailyLimit</code></td><td className="px-4 py-2 text-text-secondary">i128</td><td className="px-4 py-2 text-text-secondary">Max USDC per 24h period</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">MaxTxValue</code></td><td className="px-4 py-2 text-text-secondary">i128</td><td className="px-4 py-2 text-text-secondary">Max USDC per single transaction</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">SpentToday</code></td><td className="px-4 py-2 text-text-secondary">i128</td><td className="px-4 py-2 text-text-secondary">USDC spent in current 24h period</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">LastReset</code></td><td className="px-4 py-2 text-text-secondary">u64</td><td className="px-4 py-2 text-text-secondary">Timestamp of last daily reset</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">Paused</code></td><td className="px-4 py-2 text-text-secondary">bool</td><td className="px-4 py-2 text-text-secondary">Kill switch state</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">Whitelist</code></td><td className="px-4 py-2 text-text-secondary">Map</td><td className="px-4 py-2 text-text-secondary">Approved merchant addresses</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-text-primary">UsdcToken</code></td><td className="px-4 py-2 text-text-secondary">Address</td><td className="px-4 py-2 text-text-secondary">USDC SAC contract address</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Functions</h2>
        <div className="space-y-3">
          {functions.map((fn) => (
            <div
              key={fn.name}
              className="bg-surface-card p-4 rounded-xl border border-surface-border shadow-sm"
            >
              <div className="flex items-center gap-3 mb-1">
                <code className="text-accent-fg font-bold text-sm">{fn.name}</code>
                <span className={`text-xs px-2 py-0.5 rounded ${callerColors[fn.caller]}`}>
                  {fn.caller}
                </span>
              </div>
              <p className="text-text-secondary text-sm mb-1">{fn.desc}</p>
              <p className="text-text-secondary/60 text-xs">
                Params: <code className="bg-dark-200 px-1 rounded text-xs">{fn.params}</code>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">authorize_payment Flow</h2>
        <p className="text-text-secondary mb-3">The core function validates 10 checks in order:</p>
        <ol className="text-text-secondary space-y-1 list-decimal list-inside">
          <li>Contract is initialized</li>
          <li><code className="bg-dark-200 px-1 rounded text-xs">paused == false</code></li>
          <li>Caller is the authorized agent</li>
          <li><code className="bg-dark-200 px-1 rounded text-xs">price &gt; 0</code></li>
          <li><code className="bg-dark-200 px-1 rounded text-xs">price &lt;= max_tx_value</code></li>
          <li>Merchant is in whitelist</li>
          <li>Daily reset check (lazy — if 86400s elapsed, reset counter)</li>
          <li><code className="bg-dark-200 px-1 rounded text-xs">spent_today + price &lt;= daily_limit</code></li>
          <li>No arithmetic overflow</li>
          <li>Contract has sufficient USDC balance</li>
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Invariants (12)</h2>
        <ol className="space-y-2">
          {invariants.map((inv, i) => (
            <li
              key={i}
              className="flex items-start gap-3 bg-surface-card border border-surface-border rounded-xl p-3 shadow-sm"
            >
              <span className="text-success-fg font-mono text-sm font-bold mt-0.5">
                #{i + 1}
              </span>
              <span className="text-text-secondary text-sm">{inv}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Error Enum</h2>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`#[contracterror]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    ContractPaused = 4,
    ExceedsDailyLimit = 5,
    ExceedsMaxTx = 6,
    MerchantNotWhitelisted = 7,
    InvalidAmount = 8,
    InsufficientBalance = 9,
    ArithmeticOverflow = 10,
    AlreadyPaused = 11,
    NotPaused = 12,
}`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Tests</h2>
        <p className="text-text-secondary mb-3">37 destructive TDD tests across 3 categories:</p>
        <ul className="text-text-secondary space-y-1 list-disc list-inside">
          <li><strong className="text-text-primary">13 boundary tests</strong> — exact limits, off-by-one, edge values</li>
          <li><strong className="text-text-primary">12 invariant violation tests</strong> — one per invariant</li>
          <li><strong className="text-text-primary">12 attack simulation tests</strong> — replay, overflow, unauthorized caller</li>
        </ul>
        <pre className="bg-dark-50 p-4 rounded-xl border border-surface-border font-mono text-sm text-text-primary mt-3"><code>{`cd contracts/budget-guard
cargo test
# 37 passed, 0 failed`}</code></pre>
      </section>
    </div>
  );
}
