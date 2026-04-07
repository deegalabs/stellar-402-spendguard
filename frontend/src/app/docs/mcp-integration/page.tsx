export default function MCPIntegrationPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>MCP Integration</h1>
      <p className="lead text-slate-300 text-lg">
        Connect SpendGuard to any MCP-compatible AI agent — Claude, GPT, or
        custom agents.
      </p>

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 my-4">
        <p className="text-blue-300 mb-0">
          <strong>What is MCP?</strong> The{" "}
          <a
            href="https://modelcontextprotocol.io"
            className="text-blue-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            Model Context Protocol
          </a>{" "}
          is an open standard that lets AI agents discover and use tools. SpendGuard
          exposes 4 tools via MCP, allowing any compatible agent to make governed
          payments on Stellar.
        </p>
      </div>

      <h2>Setup</h2>
      <p>Add SpendGuard to your MCP client configuration:</p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`{
  "mcpServers": {
    "spendguard": {
      "command": "node",
      "args": ["path/to/backend/dist/mcp/index.js"],
      "env": {
        "CONTRACT_ADDRESS": "CCAB...",
        "STELLAR_RPC_URL": "https://soroban-testnet.stellar.org",
        "AGENT_SECRET_KEY": "S..."
      }
    }
  }
}`}</code></pre>

      <p>Or run directly:</p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`cd backend
npm run mcp`}</code></pre>

      <h2>Available Tools</h2>

      <h3 className="text-blue-400">spendguard_get_status</h3>
      <p>Read current contract state. No parameters required.</p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`// Agent asks: "What's my remaining budget?"
→ spendguard_get_status()

{
  "balance_usdc": "45.00",
  "daily_limit_usdc": "10.00",
  "spent_today_usdc": "2.30",
  "remaining_today_usdc": "7.70",
  "paused": false
}`}</code></pre>

      <h3 className="text-blue-400">spendguard_check_budget</h3>
      <p>
        Dry-run check whether a payment would be allowed. Does NOT execute a
        transaction.
      </p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`// Agent asks: "Can I pay $2.50 to this merchant?"
→ spendguard_check_budget({ amount: "2.50", merchant: "GAURB..." })

{
  "allowed": true,
  "reason": "Payment of $2.50 to GAURB... is within all policy limits",
  "checks": {
    "paused": false,
    "within_max_tx": true,
    "within_daily_limit": true,
    "sufficient_balance": true
  }
}`}</code></pre>

      <h3 className="text-blue-400">spendguard_authorize_payment</h3>
      <p>
        Execute a governed USDC payment on Stellar. The contract enforces all
        policies on-chain.
      </p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`// Agent decides to pay
→ spendguard_authorize_payment({ amount: "0.10", merchant: "GAURB..." })

// Success:
{
  "success": true,
  "tx_hash": "abc123...",
  "amount_usdc": "0.10",
  "remaining_today_usdc": "7.60",
  "stellar_expert_url": "https://stellar.expert/explorer/testnet/tx/abc123..."
}

// Blocked by policy:
{
  "success": false,
  "error": "ExceedsMaxTx",
  "message": "Payment of $5.00 exceeds max per-transaction limit of $1.00",
  "suggestion": "Request a smaller amount or ask the owner to increase max_tx_value"
}`}</code></pre>

      <h3 className="text-blue-400">spendguard_get_transactions</h3>
      <p>Read recent transaction history from the audit log.</p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`→ spendguard_get_transactions({ limit: 5 })

{
  "transactions": [
    {
      "type": "payment_authorized",
      "amount_usdc": "0.10",
      "merchant": "GAURB...",
      "tx_hash": "abc123...",
      "status": "settled"
    }
  ],
  "total": 5
}`}</code></pre>

      <h2>Agent Workflow Example</h2>
      <p>
        A typical AI agent interaction using SpendGuard via MCP:
      </p>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <pre className="bg-transparent border-none p-0 m-0"><code>{`User: "Get me the premium weather forecast"

Agent thinking:
  1. Check budget → spendguard_get_status()
     → $7.70 remaining today
  2. Forecast costs $0.25 → spendguard_check_budget("0.25", merchant)
     → allowed: true
  3. Pay → spendguard_authorize_payment("0.25", merchant)
     → success, tx_hash: abc123
  4. Fetch data with payment proof
     → 7-day forecast received

Agent: "Here's your forecast: Mon 25°C, Tue 23°C...
        Payment: $0.25 USDC (tx: abc123)
        Remaining budget: $7.45 today"`}</code></pre>
      </div>

      <h2>Security</h2>
      <p>
        The MCP server only exposes agent-facing tools. Admin tools (set limits,
        pause, whitelist) are intentionally NOT available via MCP — the agent
        should never have admin access. Policy management is done through the
        dashboard or direct contract calls by the owner.
      </p>
    </article>
  );
}
