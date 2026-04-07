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

  return (
    <article className="prose prose-invert max-w-none">
      <h1>Contract Specification</h1>
      <p className="lead text-slate-300 text-lg">
        BudgetGuard — a Soroban smart contract that enforces spending policies
        for x402 agent payments on Stellar.
      </p>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 my-4">
        <p className="text-slate-300 mb-1">
          <strong>Deployed on Testnet:</strong>
        </p>
        <a
          href="https://stellar.expert/explorer/testnet/contract/CCABMNFY3VKK7BI3YBWXJEE2EXX2NW5S573NASTCFXA6KBXR5PDWFD6E"
          className="text-blue-400 text-sm break-all"
          target="_blank"
          rel="noopener noreferrer"
        >
          CCABMNFY3VKK7BI3YBWXJEE2EXX2NW5S573NASTCFXA6KBXR5PDWFD6E
        </a>
      </div>

      <h2>Storage Schema</h2>
      <p>All monetary values are in USDC stroops. <strong>1 USDC = 10,000,000 stroops.</strong></p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr><th>Key</th><th>Type</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td><code>Owner</code></td><td>Address</td><td>Controls the contract</td></tr>
            <tr><td><code>Agent</code></td><td>Address</td><td>Authorized to call authorize_payment</td></tr>
            <tr><td><code>DailyLimit</code></td><td>i128</td><td>Max USDC per 24h period</td></tr>
            <tr><td><code>MaxTxValue</code></td><td>i128</td><td>Max USDC per single transaction</td></tr>
            <tr><td><code>SpentToday</code></td><td>i128</td><td>USDC spent in current 24h period</td></tr>
            <tr><td><code>LastReset</code></td><td>u64</td><td>Timestamp of last daily reset</td></tr>
            <tr><td><code>Paused</code></td><td>bool</td><td>Kill switch state</td></tr>
            <tr><td><code>Whitelist</code></td><td>Map</td><td>Approved merchant addresses</td></tr>
            <tr><td><code>UsdcToken</code></td><td>Address</td><td>USDC SAC contract address</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Functions</h2>
      <div className="not-prose space-y-3">
        {functions.map((fn) => (
          <div
            key={fn.name}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-center gap-3 mb-1">
              <code className="text-blue-400 font-bold">{fn.name}</code>
              <span className={`text-xs px-2 py-0.5 rounded ${
                fn.caller === "Owner"
                  ? "bg-orange-900/50 text-orange-300"
                  : fn.caller === "Agent"
                  ? "bg-green-900/50 text-green-300"
                  : "bg-slate-700 text-slate-300"
              }`}>
                {fn.caller}
              </span>
            </div>
            <p className="text-slate-300 text-sm mb-1">{fn.desc}</p>
            <p className="text-slate-500 text-xs mb-0">
              Params: <code>{fn.params}</code>
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-8">authorize_payment Flow</h2>
      <p>The core function validates 10 checks in order:</p>
      <ol>
        <li>Contract is initialized</li>
        <li><code>paused == false</code></li>
        <li>Caller is the authorized agent</li>
        <li><code>price &gt; 0</code></li>
        <li><code>price &lt;= max_tx_value</code></li>
        <li>Merchant is in whitelist</li>
        <li>Daily reset check (lazy — if 86400s elapsed, reset counter)</li>
        <li><code>spent_today + price &lt;= daily_limit</code></li>
        <li>No arithmetic overflow</li>
        <li>Contract has sufficient USDC balance</li>
      </ol>

      <h2>Invariants (12)</h2>
      <div className="not-prose">
        <ol className="space-y-2">
          {invariants.map((inv, i) => (
            <li
              key={i}
              className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded p-3"
            >
              <span className="text-green-400 font-mono text-sm font-bold mt-0.5">
                #{i + 1}
              </span>
              <span className="text-slate-300 text-sm">{inv}</span>
            </li>
          ))}
        </ol>
      </div>

      <h2 className="mt-8">Error Enum</h2>
      <pre className="bg-slate-800 border border-slate-700"><code>{`#[contracterror]
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

      <h2>Tests</h2>
      <p>37 destructive TDD tests across 3 categories:</p>
      <ul>
        <li><strong>13 boundary tests</strong> — exact limits, off-by-one, edge values</li>
        <li><strong>12 invariant violation tests</strong> — one per invariant</li>
        <li><strong>12 attack simulation tests</strong> — replay, overflow, unauthorized caller</li>
      </ul>
      <pre className="bg-slate-800 border border-slate-700"><code>{`cd contracts/budget-guard
cargo test
# 37 passed, 0 failed`}</code></pre>
    </article>
  );
}
