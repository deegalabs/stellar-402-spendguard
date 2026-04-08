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
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400">
        <span>Docs</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-secondary font-bold">Configuration</span>
      </div>

      <div>
        <h1 className="text-4xl font-black text-primary tracking-tighter mb-4">Configuration</h1>
        <p className="text-lg text-on-surface-variant">
          All environment variables needed to run SpendGuard.
        </p>
      </div>

      <div className="bg-error-container border border-error/20 rounded-xl p-4">
        <p className="text-on-error-container text-sm">
          <strong>Security:</strong> Never commit secret keys (<code className="bg-white/50 px-1 rounded text-xs">*_SECRET_KEY</code>)
          to the repository. Use <code className="bg-white/50 px-1 rounded text-xs">.env</code> files which are gitignored.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Backend (.env)</h2>
        <pre className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary"><code>{`cp backend/.env.example backend/.env`}</code></pre>

        <div className="overflow-x-auto rounded-xl border border-outline-variant/30 mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[10px] font-mono uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Variable</th>
                <th className="px-4 py-3 text-left">Default</th>
                <th className="px-4 py-3 text-left">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {envVars.map((v) => (
                <tr key={v.name}>
                  <td className="px-4 py-2">
                    <code className={`text-xs font-bold ${v.secret ? "text-error" : "text-primary"}`}>{v.name}</code>
                  </td>
                  <td className="px-4 py-2"><code className="text-xs text-on-surface-variant">{v.value}</code></td>
                  <td className="px-4 py-2 text-on-surface-variant">{v.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Frontend (.env.local)</h2>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ADDRESS=CCABMNFY3VKK7BI3YBWXJEE2EXX2NW5S573NASTCFXA6KBXR5PDWFD6E`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Stripe (Test Mode)</h2>
        <p className="text-on-surface-variant mb-4">
          Stripe integration is simulated in Test Mode. You need Stripe test keys to enable the Liquidity screen:
        </p>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...`}</code></pre>

        <div className="bg-warning-50 border border-warning-300/30 rounded-xl p-4 mt-4">
          <p className="text-warning-600 text-sm">
            <strong>Note:</strong> Stripe is optional. The core spending governance works without it — Stripe only powers the simulated USDC deposit flow.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Verify Configuration</h2>
        <p className="text-on-surface-variant mb-4">After setting up your <code className="bg-surface-container px-1 rounded text-xs">.env</code>, verify with:</p>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`cd backend
npm run dev
# Should print:
# SpendGuard backend running on port 3001
# Network: testnet
# Contract: CCAB...FD6E
# API Docs: http://localhost:3001/api/docs`}</code></pre>
        <p className="text-on-surface-variant mt-3">Then check the status endpoint:</p>
        <pre className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary"><code>{`curl http://localhost:3001/api/status | jq`}</code></pre>
      </section>
    </div>
  );
}
