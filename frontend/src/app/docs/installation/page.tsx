export default function InstallationPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Installation</h1>
      <p className="lead text-slate-300 text-lg">
        Deploy your own SpendGuard instance in under 10 minutes.
      </p>

      <h2>Prerequisites</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Minimum</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rust</td>
              <td>1.77+</td>
              <td>With <code>wasm32-unknown-unknown</code> target</td>
            </tr>
            <tr>
              <td>Node.js</td>
              <td>20+</td>
              <td>LTS recommended</td>
            </tr>
            <tr>
              <td>Stellar CLI</td>
              <td>Latest</td>
              <td><code>cargo install stellar-cli</code></td>
            </tr>
            <tr>
              <td>Freighter</td>
              <td>Latest</td>
              <td>Browser extension, set to Testnet</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>1. Clone and Build the Contract</h2>
      <pre className="bg-slate-800 border border-slate-700"><code>{`git clone https://github.com/deegalabs/stellar-402-spendguard.git
cd stellar-402-spendguard/contracts/budget-guard

# Build the WASM
cargo build --target wasm32-unknown-unknown --release

# Run tests (37 should pass)
cargo test`}</code></pre>

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 my-4">
        <p className="text-blue-300 mb-0">
          <strong>Tip:</strong> You can also download the precompiled WASM from the{" "}
          <a
            href="https://github.com/deegalabs/stellar-402-spendguard/releases"
            className="text-blue-400 hover:text-blue-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Releases
          </a>{" "}
          page and skip the build step.
        </p>
      </div>

      <h2>2. Create Stellar Accounts</h2>
      <p>You need three accounts on Stellar Testnet:</p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Owner</strong></td>
              <td>Controls the contract — sets limits, whitelists, kill switch</td>
            </tr>
            <tr>
              <td><strong>Agent</strong></td>
              <td>Executes payments — can only call <code>authorize_payment</code></td>
            </tr>
            <tr>
              <td><strong>Merchant</strong></td>
              <td>Receives payments — must be whitelisted</td>
            </tr>
          </tbody>
        </table>
      </div>
      <pre className="bg-slate-800 border border-slate-700"><code>{`# Generate keypairs using Stellar Laboratory or CLI
# Fund each account via Friendbot:
curl "https://friendbot.stellar.org?addr=G...YOUR_PUBLIC_KEY"`}</code></pre>

      <h2>3. Deploy the Contract</h2>
      <pre className="bg-slate-800 border border-slate-700"><code>{`stellar contract deploy \\
  --wasm target/wasm32-unknown-unknown/release/budget_guard.wasm \\
  --source <OWNER_SECRET_KEY> \\
  --network testnet`}</code></pre>
      <p>
        Save the returned contract address — you&apos;ll need it for the{" "}
        <a href="/docs/configuration" className="text-blue-400">Configuration</a> step.
      </p>

      <h2>4. Initialize the Contract</h2>
      <pre className="bg-slate-800 border border-slate-700"><code>{`stellar contract invoke \\
  --id <CONTRACT_ADDRESS> \\
  --source <OWNER_SECRET_KEY> \\
  --network testnet \\
  -- initialize \\
  --owner <OWNER_PUBLIC_KEY> \\
  --agent <AGENT_PUBLIC_KEY> \\
  --usdc_token <USDC_SAC_ADDRESS> \\
  --daily_limit 50000000 \\
  --max_tx_value 10000000`}</code></pre>

      <h2>5. Run the Backend</h2>
      <pre className="bg-slate-800 border border-slate-700"><code>{`cd backend
cp .env.example .env
# Fill in your keys (see Configuration docs)
npm install
npm run dev`}</code></pre>

      <h2>6. Run the Frontend</h2>
      <pre className="bg-slate-800 border border-slate-700"><code>{`cd frontend
cp .env.example .env.local
npm install
npm run dev`}</code></pre>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mt-6">
        <h3 className="text-green-400 mt-0">You&apos;re running!</h3>
        <ul className="mb-0">
          <li>Frontend: <code>http://localhost:3000</code></li>
          <li>Backend: <code>http://localhost:3001</code></li>
          <li>API Docs: <code>http://localhost:3001/api/docs</code></li>
        </ul>
      </div>
    </article>
  );
}
