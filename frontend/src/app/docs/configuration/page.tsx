export default function ConfigurationPage() {
  const envVars = [
    { name: "STELLAR_NETWORK", value: "testnet", desc: "Target Stellar network" },
    { name: "STELLAR_RPC_URL", value: "https://soroban-testnet.stellar.org", desc: "Soroban RPC endpoint" },
    { name: "HORIZON_URL", value: "https://horizon-testnet.stellar.org", desc: "Horizon API endpoint" },
    { name: "NETWORK_PASSPHRASE", value: "Test SDF Network ; September 2015", desc: "Network passphrase" },
    { name: "CONTRACT_ADDRESS", value: "CCAB...FD6E", desc: "Deployed BudgetGuard contract" },
    { name: "USDC_SAC_ADDRESS", value: "CADU...27SN", desc: "USDC Stellar Asset Contract" },
    { name: "OWNER_PUBLIC_KEY", value: "G...", desc: "Owner Stellar public key" },
    { name: "OWNER_SECRET_KEY", value: "S...", desc: "Owner secret key (never commit!)", secret: true },
    { name: "AGENT_PUBLIC_KEY", value: "G...", desc: "Agent Stellar public key" },
    { name: "AGENT_SECRET_KEY", value: "S...", desc: "Agent secret key (never commit!)", secret: true },
    { name: "BACKEND_PORT", value: "3001", desc: "Express server port" },
    { name: "FRONTEND_URL", value: "http://localhost:3000", desc: "Frontend URL (CORS)" },
  ];

  return (
    <article className="prose prose-invert max-w-none">
      <h1>Configuration</h1>
      <p className="lead text-slate-300 text-lg">
        All environment variables needed to run SpendGuard.
      </p>

      <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 my-4">
        <p className="text-red-300 mb-0">
          <strong>Security:</strong> Never commit secret keys (<code>*_SECRET_KEY</code>)
          to the repository. Use <code>.env</code> files which are gitignored.
        </p>
      </div>

      <h2>Backend (.env)</h2>
      <pre className="bg-slate-800 border border-slate-700"><code>{`cp backend/.env.example backend/.env`}</code></pre>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Variable</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {envVars.map((v) => (
              <tr key={v.name}>
                <td>
                  <code className={v.secret ? "text-red-400" : ""}>{v.name}</code>
                </td>
                <td><code className="text-xs">{v.value}</code></td>
                <td>{v.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Frontend (.env.local)</h2>
      <pre className="bg-slate-800 border border-slate-700"><code>{`# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ADDRESS=CCABMNFY3VKK7BI3YBWXJEE2EXX2NW5S573NASTCFXA6KBXR5PDWFD6E`}</code></pre>

      <h2>Stripe (Test Mode)</h2>
      <p>
        Stripe integration is simulated in Test Mode. You need Stripe test keys
        to enable the Liquidity screen:
      </p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...`}</code></pre>

      <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mt-4">
        <p className="text-yellow-300 mb-0">
          <strong>Note:</strong> Stripe is optional. The core spending governance
          works without it — Stripe only powers the simulated USDC deposit flow.
        </p>
      </div>

      <h2>Verify Configuration</h2>
      <p>After setting up your <code>.env</code>, verify with:</p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`cd backend
npm run dev
# Should print:
# SpendGuard backend running on port 3001
# Network: testnet
# Contract: CCAB...FD6E
# API Docs: http://localhost:3001/api/docs`}</code></pre>

      <p>
        Then check the status endpoint:
      </p>
      <pre className="bg-slate-800 border border-slate-700"><code>{`curl http://localhost:3001/api/status | jq`}</code></pre>
    </article>
  );
}
