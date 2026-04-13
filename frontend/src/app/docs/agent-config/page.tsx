import Link from "next/link";

export default function AgentConfigPage() {
  const profiles = [
    {
      name: "Conservative",
      use: "Unattended overnight jobs, experimental agents",
      daily: "$1.00",
      maxTx: "$0.10",
      merchants: "2-3 trusted endpoints",
      color: "bg-success-glow text-success-fg border-success/30",
    },
    {
      name: "Balanced",
      use: "Production agents with human-in-the-loop review",
      daily: "$25.00",
      maxTx: "$2.00",
      merchants: "5-10 verified merchants",
      color: "bg-accent-glow/40 text-accent-fg border-accent-fg/30",
    },
    {
      name: "Aggressive",
      use: "High-volume known workloads, tightly-monitored",
      daily: "$250.00",
      maxTx: "$25.00",
      merchants: "Curated whitelist, reviewed weekly",
      color: "bg-warning-glow text-warning-fg border-warning-fg/30",
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-disabled">
        <span>Docs</span>
        <span translate="no" className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-accent-fg font-bold">Guides</span>
        <span translate="no" className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-accent-fg font-bold">Agent Configuration</span>
      </div>

      <div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-4">
          Agent Configuration
        </h1>
        <p className="text-lg text-text-secondary">
          SpendGuard has four policy levers: <strong className="text-text-primary">daily limit</strong>,{" "}
          <strong className="text-text-primary">max per-transaction value</strong>,{" "}
          <strong className="text-text-primary">merchant whitelist</strong>, and the{" "}
          <strong className="text-text-primary">pause flag</strong>. How you tune them decides how much
          risk you hand your agent. This page walks through opinionated defaults, scaling
          patterns, and incident response.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">The four levers</h2>
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-200 text-text-secondary text-[10px] font-mono uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Lever</th>
                <th className="px-4 py-3 text-left">Question it answers</th>
                <th className="px-4 py-3 text-left">Failure mode if too loose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary">daily_limit</td>
                <td className="px-4 py-3 text-text-secondary">How much can go wrong in 24h?</td>
                <td className="px-4 py-3 text-text-secondary">Runaway loop drains a month&apos;s budget overnight</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary">max_tx_value</td>
                <td className="px-4 py-3 text-text-secondary">What&apos;s the biggest single blunder?</td>
                <td className="px-4 py-3 text-text-secondary">Single misplaced decimal wipes the balance</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary">whitelist</td>
                <td className="px-4 py-3 text-text-secondary">Who is the agent allowed to pay?</td>
                <td className="px-4 py-3 text-text-secondary">Agent pays attacker-controlled endpoint</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary">paused</td>
                <td className="px-4 py-3 text-text-secondary">Do I need to stop everything right now?</td>
                <td className="px-4 py-3 text-text-secondary">Incident response is blocked by deploy lag</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-text-secondary text-sm mt-4">
          Rule of thumb: <strong className="text-text-primary">max_tx_value should be 5-20% of
          daily_limit</strong>. Tighter than that and the agent can&apos;t do useful work. Looser and
          a single bad call exhausts the day&apos;s budget.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Three baseline profiles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <div
              key={p.name}
              className={`p-5 rounded-xl border ${p.color}`}
            >
              <h3 className="font-bold text-lg mb-3">{p.name}</h3>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">{p.use}</p>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-text-muted uppercase tracking-wider font-mono text-[10px]">Daily</dt>
                  <dd className="font-mono font-bold text-text-primary">{p.daily}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted uppercase tracking-wider font-mono text-[10px]">Max Tx</dt>
                  <dd className="font-mono font-bold text-text-primary">{p.maxTx}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted uppercase tracking-wider font-mono text-[10px]">Merchants</dt>
                  <dd className="text-text-primary text-right text-[11px]">{p.merchants}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Applying a profile via the SDK</h2>
        <pre className="bg-dark-50 p-6 rounded-xl border border-surface-border font-mono text-sm text-text-primary overflow-x-auto"><code>{`import { SpendGuardClient } from "@spendguard/sdk";

const admin = new SpendGuardClient({
  apiUrl: process.env.SPENDGUARD_URL!,
  apiKey: process.env.ADMIN_API_KEY,
});

// Balanced profile
async function applyBalanced(merchants: string[]) {
  // ORDER MATTERS: pause → reconfigure → whitelist → unpause
  // Pausing first prevents in-flight payments from racing the new limits.
  await admin.pause();

  await admin.setDailyLimit(25);
  await admin.setMaxTx(2);

  // Reset whitelist by removing any not in the new list, then adding
  const status = await admin.getStatus();
  // (Contract tracks whitelist as Map — enumerate via getStatus if needed)
  for (const m of merchants) {
    await admin.whitelistMerchant(m);
  }

  await admin.unpause();
  console.log("Balanced profile active");
}`}</code></pre>
        <div className="bg-warning-glow border border-warning-fg/20 rounded-xl p-4 mt-4">
          <p className="text-warning-fg text-sm">
            <strong>Why pause first?</strong> If the agent is mid-loop when you shrink the
            daily limit, an in-flight payment might land between your reads and writes. The
            pause flag is cheap, instant, and on-chain — use it as a lock around any
            multi-step reconfiguration.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          Scaling up: from sandbox to production
        </h2>
        <p className="text-text-secondary mb-3">
          Start tight. Watch the audit log for a week. Only raise a limit when you have
          evidence the agent is being blocked on legitimate work — not because &quot;it feels
          slow.&quot;
        </p>
        <ol className="text-text-secondary space-y-2 list-decimal list-inside">
          <li>
            <strong className="text-text-primary">Week 1 — Shadow mode.</strong> Conservative
            profile. Agent runs, most attempts fail with{" "}
            <code className="bg-dark-200 px-1 rounded text-xs">ExceedsMaxTx</code>. You review
            every blocked call and decide whether it <em>should</em> have been allowed.
          </li>
          <li>
            <strong className="text-text-primary">Week 2 — Calibrate.</strong> Raise{" "}
            <code className="bg-dark-200 px-1 rounded text-xs">max_tx_value</code> to cover
            90% of legitimate calls. Keep the daily limit at 10× the max tx — no higher.
          </li>
          <li>
            <strong className="text-text-primary">Week 3 — Widen whitelist.</strong> Add
            merchants one at a time. Every addition is an irreversible trust decision, so
            think like a firewall admin.
          </li>
          <li>
            <strong className="text-text-primary">Week 4+ — Steady state.</strong> Set a
            calendar reminder to review the audit log monthly. Raise limits only when
            workload actually demands it.
          </li>
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Incident response playbook</h2>
        <p className="text-text-secondary mb-3">
          Something looks wrong on the dashboard. Here&apos;s the order of operations:
        </p>
        <div className="space-y-3">
          <div className="bg-error-glow border border-error/20 rounded-xl p-4">
            <h3 className="text-error-fg font-bold text-sm mb-2">1. Pause immediately</h3>
            <pre className="bg-dark-50 p-3 rounded-lg font-mono text-xs text-text-primary"><code>await admin.pause();</code></pre>
            <p className="text-text-secondary text-xs mt-2">
              This rejects any new{" "}
              <code className="bg-dark-200 px-1 rounded text-[10px]">authorize_payment</code> call.
              In-flight Stellar transactions that already reached the ledger are final and
              cannot be reversed — pause stops <em>new</em> bleeding, it doesn&apos;t undo old.
            </p>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <h3 className="text-text-primary font-bold text-sm mb-2">2. Read the audit log</h3>
            <pre className="bg-dark-50 p-3 rounded-lg font-mono text-xs text-text-primary"><code>{`const { transactions } = await client.getTransactions(50);
const suspicious = transactions.filter(
  (t) => !trustedMerchants.has(t.merchant)
);`}</code></pre>
            <p className="text-text-secondary text-xs mt-2">
              Open the Stellar Expert link for anything that looks wrong. Every payment is
              immutably recorded on-chain — you have ground truth.
            </p>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <h3 className="text-text-primary font-bold text-sm mb-2">3. Tighten, don&apos;t delete</h3>
            <pre className="bg-dark-50 p-3 rounded-lg font-mono text-xs text-text-primary"><code>{`// Drop limits to conservative while investigating
await admin.setDailyLimit(1);
await admin.setMaxTx(0.10);
// Remove compromised merchants
await admin.removeMerchant("GBAD...");`}</code></pre>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <h3 className="text-text-primary font-bold text-sm mb-2">4. Unpause when safe</h3>
            <pre className="bg-dark-50 p-3 rounded-lg font-mono text-xs text-text-primary"><code>await admin.unpause();</code></pre>
            <p className="text-text-secondary text-xs mt-2">
              If root cause is outside the contract (compromised agent key, bad merchant
              URL), rotate the agent address via{" "}
              <code className="bg-dark-200 px-1 rounded text-[10px]">set_agent</code> on the
              contract before unpausing.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">What you cannot configure</h2>
        <p className="text-text-secondary mb-3">
          Some things are deliberately NOT policy levers. They&apos;re hardcoded in the contract to
          protect the invariants:
        </p>
        <ul className="text-text-secondary space-y-1 list-disc list-inside">
          <li>The 24h window length — it&apos;s always 86400 seconds (no rolling windows, no custom periods)</li>
          <li>Agent self-service — the agent can never raise its own limits or whitelist a merchant</li>
          <li>Retroactive refunds — a rejected payment is rejected; there&apos;s no appeal path</li>
          <li>Per-merchant sub-limits — all merchants share the same daily / max-tx envelope</li>
        </ul>
        <p className="text-text-secondary text-sm mt-3">
          If you find yourself wishing for one of these, you probably want multiple SpendGuard
          contracts (one per merchant class) rather than a more expressive policy language.
          Simpler enforcement = fewer attack vectors.
        </p>
      </section>

      <section>
        <div className="bg-accent-glow/30 border border-accent-fg/20 rounded-xl p-4">
          <h3 className="text-accent-fg font-bold text-sm mb-2">Related</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>
              <Link href="/docs/contract-spec" className="text-accent-fg hover:underline">
                Contract specification
              </Link>{" "}
              — every function, invariant, and error code
            </li>
            <li>
              <Link href="/docs/sdk" className="text-accent-fg hover:underline">
                SDK reference
              </Link>{" "}
              — the <code className="bg-dark-200 px-1 rounded text-xs">SpendGuardClient</code>{" "}
              methods used above
            </li>
            <li>
              <Link href="/docs/architecture" className="text-accent-fg hover:underline">
                Architecture
              </Link>{" "}
              — why the policy levers live on-chain and not in the backend
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
