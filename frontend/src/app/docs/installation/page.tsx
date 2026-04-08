import Link from "next/link";

export default function InstallationPage() {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400">
        <span>Docs</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-secondary font-bold">Installation</span>
      </div>

      <div>
        <h1 className="text-4xl font-black text-primary tracking-tighter mb-4">Installation</h1>
        <p className="text-lg text-on-surface-variant">
          Deploy your own SpendGuard instance in under 10 minutes.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Prerequisites</h2>
        <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[10px] font-mono uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Requirement</th>
                <th className="px-4 py-3 text-left">Minimum</th>
                <th className="px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              <tr><td className="px-4 py-3">Rust</td><td className="px-4 py-3 font-mono">1.77+</td><td className="px-4 py-3 text-on-surface-variant">With <code className="bg-surface-container px-1 rounded text-xs">wasm32-unknown-unknown</code> target</td></tr>
              <tr><td className="px-4 py-3">Node.js</td><td className="px-4 py-3 font-mono">20+</td><td className="px-4 py-3 text-on-surface-variant">LTS recommended</td></tr>
              <tr><td className="px-4 py-3">Stellar CLI</td><td className="px-4 py-3 font-mono">Latest</td><td className="px-4 py-3 text-on-surface-variant"><code className="bg-surface-container px-1 rounded text-xs">cargo install stellar-cli</code></td></tr>
              <tr><td className="px-4 py-3">Freighter</td><td className="px-4 py-3 font-mono">Latest</td><td className="px-4 py-3 text-on-surface-variant">Browser extension, set to Testnet</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">1. Clone and Build the Contract</h2>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`git clone https://github.com/deegalabs/stellar-402-spendguard.git
cd stellar-402-spendguard/contracts/budget-guard

# Build the WASM
cargo build --target wasm32-unknown-unknown --release

# Run tests (37 should pass)
cargo test`}</code></pre>

        <div className="bg-secondary-fixed/30 border border-secondary/20 rounded-xl p-4 mt-4">
          <p className="text-secondary text-sm">
            <strong>Tip:</strong> You can also download the precompiled WASM from the{" "}
            <a href="https://github.com/deegalabs/stellar-402-spendguard/releases" className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">
              GitHub Releases
            </a>{" "}
            page and skip the build step.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">2. Create Stellar Accounts</h2>
        <p className="text-on-surface-variant mb-4">You need three accounts on Stellar Testnet:</p>
        <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[10px] font-mono uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Account</th>
                <th className="px-4 py-3 text-left">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              <tr><td className="px-4 py-3 font-bold">Owner</td><td className="px-4 py-3 text-on-surface-variant">Controls the contract — sets limits, whitelists, kill switch</td></tr>
              <tr><td className="px-4 py-3 font-bold">Agent</td><td className="px-4 py-3 text-on-surface-variant">Executes payments — can only call <code className="bg-surface-container px-1 rounded text-xs">authorize_payment</code></td></tr>
              <tr><td className="px-4 py-3 font-bold">Merchant</td><td className="px-4 py-3 text-on-surface-variant">Receives payments — must be whitelisted</td></tr>
            </tbody>
          </table>
        </div>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto mt-4"><code>{`# Generate keypairs using Stellar Laboratory or CLI
# Fund each account via Friendbot:
curl "https://friendbot.stellar.org?addr=G...YOUR_PUBLIC_KEY"`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">3. Deploy the Contract</h2>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`stellar contract deploy \\
  --wasm target/wasm32-unknown-unknown/release/budget_guard.wasm \\
  --source <OWNER_SECRET_KEY> \\
  --network testnet`}</code></pre>
        <p className="text-on-surface-variant mt-3">
          Save the returned contract address — you&apos;ll need it for the{" "}
          <Link href="/docs/configuration" className="text-secondary hover:underline">Configuration</Link> step.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">4. Initialize the Contract</h2>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`stellar contract invoke \\
  --id <CONTRACT_ADDRESS> \\
  --source <OWNER_SECRET_KEY> \\
  --network testnet \\
  -- initialize \\
  --owner <OWNER_PUBLIC_KEY> \\
  --agent <AGENT_PUBLIC_KEY> \\
  --usdc_token <USDC_SAC_ADDRESS> \\
  --daily_limit 50000000 \\
  --max_tx_value 10000000`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">5. Run the Backend</h2>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`cd backend
cp .env.example .env
# Fill in your keys (see Configuration docs)
npm install
npm run dev`}</code></pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">6. Run the Frontend</h2>
        <pre className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 font-mono text-sm text-primary overflow-x-auto"><code>{`cd frontend
cp .env.example .env.local
npm install
npm run dev`}</code></pre>

        <div className="bg-tertiary-fixed/20 border border-on-tertiary-container/20 rounded-xl p-4 mt-4">
          <h3 className="text-on-tertiary-container font-bold text-sm mb-2">You&apos;re running!</h3>
          <ul className="text-sm text-on-surface-variant space-y-1">
            <li>Frontend: <code className="bg-surface-container px-1 rounded text-xs">http://localhost:3000</code></li>
            <li>Backend: <code className="bg-surface-container px-1 rounded text-xs">http://localhost:3001</code></li>
            <li>API Docs: <code className="bg-surface-container px-1 rounded text-xs">http://localhost:3001/api/docs</code></li>
          </ul>
        </div>
      </section>
    </div>
  );
}
