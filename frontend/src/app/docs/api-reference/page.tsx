export default function APIReferencePage() {
  const endpoints = [
    {
      method: "GET",
      path: "/api/status",
      tag: "Dashboard",
      desc: "Current contract state: owner, agent, limits, balance, pause status",
    },
    {
      method: "GET",
      path: "/api/transactions",
      tag: "Dashboard",
      desc: "Transaction history with Stellar Expert links",
      params: "?limit=50&cursor=...",
    },
    {
      method: "GET",
      path: "/api/balance",
      tag: "Dashboard",
      desc: "Current USDC balance via Soroban RPC",
    },
    {
      method: "POST",
      path: "/api/admin/set-limit",
      tag: "Admin",
      desc: "Update daily spending cap",
      body: '{ "daily_limit": 100000000 }',
    },
    {
      method: "POST",
      path: "/api/admin/set-max-tx",
      tag: "Admin",
      desc: "Update per-transaction cap",
      body: '{ "max_tx_value": 50000000 }',
    },
    {
      method: "POST",
      path: "/api/admin/whitelist",
      tag: "Admin",
      desc: "Add merchant to whitelist",
      body: '{ "merchant": "GAURB..." }',
    },
    {
      method: "POST",
      path: "/api/admin/remove-merchant",
      tag: "Admin",
      desc: "Remove merchant from whitelist",
      body: '{ "merchant": "GAURB..." }',
    },
    {
      method: "POST",
      path: "/api/admin/pause",
      tag: "Admin",
      desc: "Emergency pause — halt all payments",
    },
    {
      method: "POST",
      path: "/api/admin/unpause",
      tag: "Admin",
      desc: "Resume payment processing",
    },
    {
      method: "POST",
      path: "/api/admin/top-up",
      tag: "Admin",
      desc: "Deposit USDC into contract",
      body: '{ "amount": 50000000 }',
    },
    {
      method: "GET",
      path: "/api/demo/protected-resource",
      tag: "Demo",
      desc: "x402-protected endpoint (402 without payment, 200 with proof)",
    },
    {
      method: "POST",
      path: "/api/demo/run-agent",
      tag: "Demo",
      desc: "Run one complete x402 payment cycle",
    },
    {
      method: "GET",
      path: "/api/demo/pricing",
      tag: "Demo",
      desc: "x402 pricing table — list all protected resources",
    },
    {
      method: "GET",
      path: "/api/events",
      tag: "System",
      desc: "SSE event stream for real-time contract events",
    },
    {
      method: "GET",
      path: "/health",
      tag: "System",
      desc: "Health check",
    },
  ];

  const tagColors: Record<string, string> = {
    Dashboard: "bg-green-900/50 text-green-300",
    Admin: "bg-orange-900/50 text-orange-300",
    Demo: "bg-purple-900/50 text-purple-300",
    System: "bg-slate-700 text-slate-300",
  };

  const methodColors: Record<string, string> = {
    GET: "text-green-400",
    POST: "text-yellow-400",
  };

  return (
    <article className="prose prose-invert max-w-none">
      <h1>API Reference</h1>
      <p className="lead text-slate-300 text-lg">
        All HTTP endpoints exposed by the SpendGuard backend.
      </p>

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 my-4">
        <p className="text-blue-300 mb-0">
          <strong>Interactive docs:</strong> Run the backend and visit{" "}
          <code>http://localhost:3001/api/docs</code> for the full Swagger UI
          where you can test endpoints directly.
        </p>
      </div>

      <h2>Base URL</h2>
      <pre className="bg-slate-800 border border-slate-700"><code>http://localhost:3001</code></pre>

      <h2>Endpoints</h2>
      <div className="not-prose space-y-3">
        {endpoints.map((ep) => (
          <div
            key={ep.path + ep.method}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className={`font-mono font-bold text-sm ${methodColors[ep.method]}`}>
                {ep.method}
              </span>
              <code className="text-white text-sm">{ep.path}</code>
              <span className={`text-xs px-2 py-0.5 rounded ${tagColors[ep.tag]}`}>
                {ep.tag}
              </span>
            </div>
            <p className="text-slate-300 text-sm mb-0">{ep.desc}</p>
            {ep.params && (
              <p className="text-slate-500 text-xs mt-1 mb-0">
                Params: <code>{ep.params}</code>
              </p>
            )}
            {ep.body && (
              <pre className="bg-slate-900 border border-slate-600 rounded mt-2 p-2 text-xs">
                <code>{ep.body}</code>
              </pre>
            )}
          </div>
        ))}
      </div>

      <h2 className="mt-8">Error Codes</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>HTTP</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>INVALID_AMOUNT</code></td><td>400</td><td>Amount is zero, negative, or invalid</td></tr>
            <tr><td><code>INVALID_ADDRESS</code></td><td>400</td><td>Stellar address format is invalid</td></tr>
            <tr><td><code>UNAUTHORIZED</code></td><td>401</td><td>Missing or invalid owner auth</td></tr>
            <tr><td><code>CONTRACT_PAUSED</code></td><td>409</td><td>Contract is paused</td></tr>
            <tr><td><code>EXCEEDS_LIMIT</code></td><td>422</td><td>Exceeds daily limit or max tx</td></tr>
            <tr><td><code>INSUFFICIENT_BALANCE</code></td><td>422</td><td>Balance too low</td></tr>
            <tr><td><code>STELLAR_ERROR</code></td><td>502</td><td>Stellar network error</td></tr>
          </tbody>
        </table>
      </div>

      <h2>OpenAPI Spec</h2>
      <p>
        Download the full OpenAPI 3.0 spec:
      </p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`curl http://localhost:3001/api/openapi.json`}</code></pre>
    </article>
  );
}
