"use client";

import { useState } from "react";
import { useContractStatus } from "@/hooks/useContractStatus";
import { simulatePayment } from "@/lib/api";

const TIERS = [
  { label: "Starter", amount: 1000, highlight: false },
  { label: "Enterprise", amount: 5000, highlight: true },
];

export default function LiquidityPage() {
  const { balance, refresh } = useContractStatus();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [autoRefill, setAutoRefill] = useState(true);
  const [refillThreshold, setRefillThreshold] = useState(200);

  async function handleTopUp(depositAmount?: number) {
    const usd = depositAmount ?? Number(amount);
    if (!usd || usd <= 0) return;

    setBusy(true);
    setResult(null);
    try {
      await simulatePayment(usd);
      setResult({ ok: true, text: `$${usd.toFixed(2)} deposited successfully (Test Mode)` });
      setAmount("");
      refresh();
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  const onChainUsdc = balance?.balance_usdc ?? "0.00";

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Liquidity Bridge</h2>
        <p className="text-on-surface-variant mt-1 max-w-2xl">
          Manage institutional liquidity flows between fiat gateways and your autonomous smart agent clusters.
        </p>
      </div>

      {/* Vault Overview (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 card flex flex-col justify-between">
          <div>
            <p className="stat-label">Total Available Balance</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-4xl font-bold text-primary font-mono tracking-tight">
                ${Number(onChainUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-lg font-semibold text-secondary font-mono">USDC</span>
            </div>
          </div>
          <div className="flex gap-8 mt-8 border-t border-surface-container pt-6">
            <div className="flex flex-col">
              <span className="text-[11px] text-on-surface-variant font-medium">ON-CHAIN (STELLAR)</span>
              <span className="font-mono font-bold text-primary">
                {Number(onChainUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-on-surface-variant font-medium">FIAT GATEWAY (STRIPE)</span>
              <span className="font-mono font-bold text-primary">0.00 USD</span>
            </div>
          </div>
        </div>

        <div className="bg-primary-container p-8 rounded-xl flex flex-col justify-between text-on-primary-container">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-primary-container/60 font-bold">Network Health</span>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse-slow" />
              <span className="text-xl font-medium text-white">Bridge Active</span>
            </div>
          </div>
          <div className="bg-white/10 p-4 rounded-lg mt-4">
            <p className="text-xs text-white/80 leading-relaxed italic">
              &ldquo;Last settlement confirmed 4m ago via Stellar Anchor Protocol.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Action Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Top Up with Stripe */}
        <div className="space-y-6">
          <section className="card">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-semibold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">bolt</span>
                Initialize Bridge
              </h4>
              <span className="badge-info">SECURE PCI-DSS</span>
            </div>

            {/* Tier selection */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {TIERS.map((tier) => (
                <button
                  key={tier.label}
                  onClick={() => setAmount(String(tier.amount))}
                  className={`p-4 rounded-lg border-2 text-left transition-all group ${
                    amount === String(tier.amount) || tier.highlight
                      ? "border-secondary bg-secondary/5"
                      : "border-surface-container hover:border-secondary"
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase ${
                    amount === String(tier.amount) || tier.highlight
                      ? "text-secondary"
                      : "text-on-surface-variant group-hover:text-secondary"
                  }`}>
                    {tier.label}
                  </span>
                  <span className="text-xl font-bold text-primary font-mono block mt-1">
                    ${tier.amount.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom deposit */}
            <div className="mb-4">
              <label className="stat-label block mb-1.5">Custom Deposit Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field pl-8 pr-16 text-lg"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-on-surface-variant">USD</span>
              </div>
            </div>

            <button
              onClick={() => handleTopUp()}
              disabled={busy || !amount || Number(amount) <= 0}
              className="btn-primary w-full justify-center py-4 text-base"
            >
              <span className="material-symbols-outlined text-lg">bolt</span>
              {busy ? "Processing..." : "Initialize Secure Deposit"}
            </button>

            {result && (
              <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm animate-slide-up ${
                result.ok
                  ? "bg-tertiary-container text-tertiary-fixed-dim"
                  : "bg-error-container text-on-error-container"
              }`}>
                <span className={`w-2 h-2 rounded-full ${result.ok ? "bg-tertiary-fixed-dim" : "bg-error"}`} />
                {result.text}
              </div>
            )}
          </section>

          {/* Recent Transfers */}
          <section className="card">
            <h4 className="font-semibold text-primary mb-4 text-sm">Recent Transfers</h4>
            <div className="space-y-3">
              {[
                { id: "TX-9283-LP", date: "Apr 5, 2026 \u2022 14:22", amount: "$1,200.00" },
                { id: "TX-9271-LP", date: "Apr 4, 2026 \u2022 09:10", amount: "$5,000.00" },
                { id: "TX-9255-LP", date: "Apr 3, 2026 \u2022 18:45", amount: "$800.00" },
              ].map((tx, i) => (
                <div key={tx.id} className={`flex items-center justify-between py-2 ${i < 2 ? "border-b border-surface" : ""}`}>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface font-mono">#{tx.id}</span>
                    <span className="text-[10px] text-on-surface-variant">{tx.date}</span>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="font-mono text-sm font-bold text-primary">{tx.amount}</span>
                    <span className="badge-success uppercase tracking-wider text-[9px]">Settled</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Column 2: Auto-Refill Logic */}
        <div className="space-y-6">
          <section className="card">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="font-semibold text-primary">Auto-Refill Logic</h4>
                <p className="text-xs text-on-surface-variant">Enable autonomous liquidity replenishment.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefill}
                  onChange={() => setAutoRefill(!autoRefill)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
                <span className="ml-3 text-[10px] font-bold text-secondary uppercase">
                  {autoRefill ? "Active" : "Off"}
                </span>
              </label>
            </div>

            <div className="space-y-10">
              {/* Slider Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="stat-label">Trigger Threshold</label>
                  <span className="text-xl font-bold text-primary font-mono">${refillThreshold.toFixed(2)}</span>
                </div>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="50"
                    value={refillThreshold}
                    onChange={(e) => setRefillThreshold(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer accent-secondary"
                  />
                  <div className="flex justify-between mt-2 text-[9px] font-mono text-on-surface-variant uppercase">
                    <span>$0</span>
                    <span>$1,000 Critical</span>
                  </div>
                </div>
              </div>

              {/* Refill Input */}
              <div className="space-y-2">
                <label className="stat-label block">Replenishment Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono">$</span>
                  <input
                    type="text"
                    defaultValue="500.00"
                    className="input-field pl-8 pr-16 text-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-on-surface-variant">USD</span>
                </div>
                <p className="text-[10px] text-on-surface-variant italic">Refill will execute from verified bank account on file.</p>
              </div>

              {/* Info Box */}
              <div className="bg-secondary/5 border-l-4 border-secondary p-4 rounded-r-lg">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-secondary text-sm">info</span>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-primary">Operational Gas Warning</h5>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Current XLM prices fluctuate. We recommend maintaining at least $50 in surplus to cover agent execution fees during high network congestion periods.
                    </p>
                  </div>
                </div>
              </div>

              <button className="w-full py-3 border-2 border-secondary text-secondary font-bold rounded-lg hover:bg-secondary hover:text-white transition-all text-sm">
                Update Refill Parameters
              </button>
            </div>
          </section>

          {/* Predictive Liquidity */}
          <section className="card flex items-center justify-between cursor-pointer hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-surface-container rounded">
                <span className="material-symbols-outlined text-primary">analytics</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-primary">Predictive Liquidity Mode</h4>
                <p className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">AI-Driven Cash Flow Optimization</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </section>
        </div>
      </div>

      {/* Footer Stats */}
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant pt-8 text-[11px] text-on-surface-variant uppercase tracking-widest font-mono">
        <div className="flex gap-8">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-on-surface-variant/40">Audit Trail ID</span>
            <span className="text-primary font-bold">SHA-256:7B92..41A</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-on-surface-variant/40">Agent Uptime</span>
            <span className="text-tertiary-fixed-dim font-bold">99.998%</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-on-surface-variant/40">API Status</span>
            <span className="text-primary font-bold">V0.1 STABLE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim" />
          <span>All Systems Operational</span>
        </div>
      </footer>
    </div>
  );
}
