import Link from "next/link";

export default function IntroductionPage() {
  return (
    <div className="flex flex-col gap-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-disabled">
        <span>Docs</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-accent-fg font-bold">Introduction</span>
      </div>

      {/* Hero Section */}
      <section className="max-w-3xl">
        <h1 className="text-5xl font-black text-text-primary tracking-tighter mb-6 leading-tight">
          The Financial Architecture for AI Agents.
        </h1>
        <p className="text-xl text-text-secondary leading-relaxed font-normal">
          SpendGuard is a Soroban smart contract that governs how AI agents spend{" "}
          <span className="font-mono font-bold text-accent-fg">USDC</span> via the{" "}
          <span className="font-mono bg-accent-glow px-1.5 py-0.5 rounded text-accent-fg">x402</span>{" "}
          protocol on Stellar.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/docs/installation"
            className="px-6 py-3 bg-primary text-white rounded-lg font-mono text-sm uppercase tracking-widest hover:shadow-lg transition-all"
          >
            Get Started
          </Link>
          <Link
            href="/docs/architecture"
            className="px-6 py-3 bg-dark-200 text-text-primary rounded-lg font-mono text-sm uppercase tracking-widest hover:bg-dark-200 transition-all"
          >
            Protocol Whitepaper
          </Link>
        </div>
      </section>

      {/* Key Capabilities Grid (Bento Style) */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Key Capabilities</h2>
          <span className="h-px flex-1 mx-8 bg-dark-200" />
          <span className="text-[10px] font-mono text-text-disabled uppercase tracking-widest">Core Features 01-05</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {/* Daily spending limit */}
          <div className="md:col-span-2 lg:col-span-3 bg-surface-card p-8 rounded-xl shadow-card border border-surface-border flex flex-col justify-between group hover:border-accent-fg/40 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-lg bg-accent-glow flex items-center justify-center mb-6 text-accent-fg">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  calendar_today
                </span>
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Daily spending limit</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Define hard caps on a rolling 24-hour window. Ensure agents stay within allocated operational budgets without manual intervention.
              </p>
            </div>
            <div className="mt-8 text-[10px] font-mono text-accent-fg uppercase tracking-widest font-bold">
              Policy: Temporal Constraint
            </div>
          </div>

          {/* Per-transaction cap */}
          <div className="md:col-span-1 lg:col-span-3 bg-primary-600 p-8 rounded-xl text-white shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-surface-card/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  payments
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2">Per-transaction cap</h3>
              <p className="text-sm text-white leading-relaxed">
                Mitigate risk by limiting the maximum value of any single transaction. Prevents catastrophic errors or unauthorized bulk transfers.
              </p>
            </div>
            <div className="mt-8 text-[10px] font-mono text-success-fg uppercase tracking-widest font-bold">
              Protocol: x402-Atomic
            </div>
          </div>

          {/* Merchant whitelist */}
          <div className="md:col-span-1 lg:col-span-2 bg-surface-card p-8 rounded-xl shadow-card border border-surface-border flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded bg-success-glow flex items-center justify-center mb-6 text-text-secondary">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
              </div>
              <h3 className="text-md font-bold text-text-primary mb-2">Merchant whitelist</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Restrict agents to interacting only with verified smart contracts and merchant addresses.
              </p>
            </div>
          </div>

          {/* Emergency kill switch */}
          <div className="md:col-span-1 lg:col-span-2 bg-surface-card p-8 rounded-xl shadow-card border border-surface-border flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded bg-error-glow flex items-center justify-center mb-6 text-error-fg">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  gpp_maybe
                </span>
              </div>
              <h3 className="text-md font-bold text-text-primary mb-2">Emergency kill switch</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Instantly freeze all agent spending permissions via a single signed multi-sig transaction.
              </p>
            </div>
          </div>

          {/* On-chain audit trail */}
          <div className="md:col-span-1 lg:col-span-2 bg-surface-card p-8 rounded-xl shadow-card border border-surface-border flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded bg-dark-200 flex items-center justify-center mb-6 text-text-primary">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  list_alt
                </span>
              </div>
              <h3 className="text-md font-bold text-text-primary mb-2">On-chain audit trail</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Every transaction and policy update is immutably recorded on the Stellar ledger for compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Detail / Protocol Snippet */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">The Architecture</h2>
          <p className="text-text-secondary leading-relaxed">
            The SpendGuard framework operates as a middleware layer between the AI agent&apos;s wallet and the Stellar network.
            By utilizing the <span className="font-mono font-bold">x402 protocol</span>, we enable programmatic trust.
            <a
              href="https://www.deegalabs.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent-fg hover:underline"
            >
              DeegaLabs
            </a>{" "}
            has engineered this to be the standard for autonomous financial agents.
          </p>

          <div className="p-6 bg-dark-50 rounded-xl border border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                Protocol implementation (x402)
              </span>
              <span className="material-symbols-outlined text-sm text-text-disabled cursor-pointer hover:text-text-primary transition-colors">
                content_copy
              </span>
            </div>
            <pre className="font-mono text-sm text-text-primary overflow-x-auto whitespace-pre-wrap">
              <code>{`fn authorize_spend(env: Env, agent: Address, amount: i128) -> bool {
    // Check daily limit status
    let current_spend = get_daily_total(env, agent);
    if (current_spend + amount) > DAILY_CAP {
        panic!("SpendGuard: Limit Exceeded");
    }
    true
}`}</code>
            </pre>
          </div>
        </div>

        <div className="bg-surface-card p-6 rounded-xl border border-surface-border shadow-sm self-start">
          <h4 className="text-xs font-mono uppercase tracking-widest text-text-disabled mb-6">Quick References</h4>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
              <span className="text-sm font-medium text-text-primary">Soroban SDK v22.0.0</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
              <span className="text-sm font-medium text-text-primary">Stellar Testnet Ready</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
              <span className="text-sm font-medium text-text-primary">x402 Protocol Compatible</span>
            </li>
          </ul>
          <div className="mt-8 pt-8 border-t border-surface-border">
            <div className="rounded-lg w-full h-32 bg-gradient-to-br from-primary-600 to-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white/40 text-[64px]">hub</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
