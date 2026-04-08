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
    Dashboard: "bg-success-glow text-success-fg",
    Admin: "bg-warning-50 text-warning-600",
    Demo: "bg-accent-glow/30 text-accent-fg",
    System: "bg-dark-200 text-text-secondary",
  };

  const methodColors: Record<string, string> = {
    GET: "text-success-fg",
    POST: "text-warning-600",
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-disabled">
        <span>Docs</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-accent-fg font-bold">API Reference</span>
      </div>

      <div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-4">API Reference</h1>
        <p className="text-lg text-text-secondary">
          All HTTP endpoints exposed by the SpendGuard backend.
        </p>
      </div>

      <div className="bg-accent-glow/30 border border-accent-fg/20 rounded-xl p-4">
        <p className="text-accent-fg text-sm">
          <strong>Interactive docs:</strong> Run the backend and visit{" "}
          <code className="bg-surface-card/50 px-1 rounded text-xs">http://localhost:3001/api/docs</code> for the full Swagger UI
          where you can test endpoints directly.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Base URL</h2>
        <pre className="bg-dark-50 p-4 rounded-xl border border-surface-border font-mono text-sm text-text-primary"><code>http://localhost:3001</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Endpoints</h2>
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div
              key={ep.path + ep.method}
              className="bg-surface-card p-4 rounded-xl border border-surface-border shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={`font-mono font-bold text-sm ${methodColors[ep.method]}`}>
                  {ep.method}
                </span>
                <code className="text-text-primary text-sm">{ep.path}</code>
                <span className={`text-xs px-2 py-0.5 rounded ${tagColors[ep.tag]}`}>
                  {ep.tag}
                </span>
              </div>
              <p className="text-text-secondary text-sm">{ep.desc}</p>
              {ep.params && (
                <p className="text-text-secondary/60 text-xs mt-1">
                  Params: <code className="bg-dark-200 px-1 rounded text-xs">{ep.params}</code>
                </p>
              )}
              {ep.body && (
                <pre className="bg-dark-50 border border-surface-border rounded-lg mt-2 p-2 text-xs font-mono text-text-primary">
                  <code>{ep.body}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Error Codes</h2>
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-200 text-text-secondary text-[10px] font-mono uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">HTTP</th>
                <th className="px-4 py-3 text-left">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-error-fg">INVALID_AMOUNT</code></td><td className="px-4 py-2 text-text-secondary">400</td><td className="px-4 py-2 text-text-secondary">Amount is zero, negative, or invalid</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-error-fg">INVALID_ADDRESS</code></td><td className="px-4 py-2 text-text-secondary">400</td><td className="px-4 py-2 text-text-secondary">Stellar address format is invalid</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-error-fg">UNAUTHORIZED</code></td><td className="px-4 py-2 text-text-secondary">401</td><td className="px-4 py-2 text-text-secondary">Missing or invalid owner auth</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-error-fg">CONTRACT_PAUSED</code></td><td className="px-4 py-2 text-text-secondary">409</td><td className="px-4 py-2 text-text-secondary">Contract is paused</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-error-fg">EXCEEDS_LIMIT</code></td><td className="px-4 py-2 text-text-secondary">422</td><td className="px-4 py-2 text-text-secondary">Exceeds daily limit or max tx</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-error-fg">INSUFFICIENT_BALANCE</code></td><td className="px-4 py-2 text-text-secondary">422</td><td className="px-4 py-2 text-text-secondary">Balance too low</td></tr>
              <tr><td className="px-4 py-2"><code className="text-xs font-bold text-error-fg">STELLAR_ERROR</code></td><td className="px-4 py-2 text-text-secondary">502</td><td className="px-4 py-2 text-text-secondary">Stellar network error</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">OpenAPI Spec</h2>
        <p className="text-text-secondary mb-3">Download the full OpenAPI 3.0 spec:</p>
        <pre className="bg-dark-50 p-4 rounded-xl border border-surface-border font-mono text-sm text-text-primary"><code>{`curl http://localhost:3001/api/openapi.json`}</code></pre>
      </section>
    </div>
  );
}
