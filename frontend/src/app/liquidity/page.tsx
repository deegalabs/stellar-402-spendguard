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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-headline text-neutral-900">Liquidity Bridge</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Manage institutional liquidity flows between fiat gateways and your autonomous smart agent clusters.
        </p>
      </div>

      {/* Top row: Balance + Network Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <p className="stat-label">Total Available Balance</p>
          <p className="text-display text-neutral-900 mt-2">
            ${Number(onChainUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            <span className="text-lg font-normal text-neutral-400 ml-2">USDC</span>
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-100">
            <div>
              <p className="stat-label">On-chain (Stellar)</p>
              <p className="text-lg font-bold text-neutral-900 mt-1">
                {Number(onChainUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
              </p>
            </div>
            <div>
              <p className="stat-label">Fiat Gateway (Stripe)</p>
              <p className="text-lg font-bold text-neutral-900 mt-1">0.00 USD</p>
            </div>
          </div>
        </div>

        <div className="card bg-primary text-white">
          <p className="text-xs uppercase tracking-widest text-primary-200 font-semibold">Network Health</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="w-3 h-3 bg-accent rounded-full animate-pulse-slow" />
            <span className="text-lg font-bold">Bridge Active</span>
          </div>
          <div className="mt-4 bg-primary-800 rounded-lg p-3">
            <p className="text-xs text-primary-200 italic">
              &ldquo;Last settlement confirmed 4m ago via Stellar Anchor Protocol.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Bottom row: Initialize Bridge + Auto-Refill */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Initialize Bridge */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-title text-neutral-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Initialize Bridge
            </h3>
            <span className="badge-info">Secure PCI-DSS</span>
          </div>

          {/* Tier selection */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {TIERS.map((tier) => (
              <button
                key={tier.label}
                onClick={() => setAmount(String(tier.amount))}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  amount === String(tier.amount)
                    ? "border-secondary bg-secondary-50"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <p className="text-xs font-semibold text-neutral-500 uppercase">
                  {tier.label}
                </p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  ${tier.amount.toLocaleString()}
                </p>
              </button>
            ))}
          </div>

          {/* Custom deposit */}
          <p className="stat-label mb-2">Custom Deposit Amount</p>
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold">$</span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field pl-7 pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">USD</span>
          </div>

          <button
            onClick={() => handleTopUp()}
            disabled={busy || !amount || Number(amount) <= 0}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            {busy ? "Processing..." : "Initialize Secure Deposit"}
          </button>

          {result && (
            <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm animate-slide-up ${
              result.ok
                ? "bg-accent-50 text-accent-700 border border-accent-200"
                : "bg-danger-50 text-danger-700 border border-danger-200"
            }`}>
              <span className={`w-2 h-2 rounded-full ${result.ok ? "bg-accent" : "bg-danger"}`} />
              {result.text}
            </div>
          )}

          {/* Recent Transfers */}
          <div className="mt-6 pt-4 border-t border-neutral-100">
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">Recent Transfers</h4>
            <div className="space-y-3">
              {[
                { id: "TX-9283-LP", date: "Apr 5, 2026 14:22", amount: "$1,200.00" },
                { id: "TX-9271-LP", date: "Apr 4, 2026 09:10", amount: "$5,000.00" },
                { id: "TX-9255-LP", date: "Apr 3, 2026 18:45", amount: "$800.00" },
              ].map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono font-semibold text-neutral-900">#{tx.id}</p>
                    <p className="text-xs text-neutral-400">{tx.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900">{tx.amount}</span>
                    <span className="badge-success">Settled</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Auto-Refill Logic */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title text-neutral-900">Auto-Refill Logic</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoRefill(!autoRefill)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    autoRefill ? "bg-secondary" : "bg-neutral-300"
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    autoRefill ? "left-[26px]" : "left-0.5"
                  }`} />
                </button>
                <span className={`text-xs font-bold ${autoRefill ? "text-accent" : "text-neutral-400"}`}>
                  {autoRefill ? "ACTIVE" : "OFF"}
                </span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              Enable autonomous liquidity replenishment.
            </p>

            {/* Trigger Threshold */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="stat-label">Trigger Threshold</p>
                <span className="text-lg font-bold text-neutral-900">
                  ${refillThreshold.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                value={refillThreshold}
                onChange={(e) => setRefillThreshold(Number(e.target.value))}
                className="w-full accent-secondary"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>$0</span>
                <span>$1,000 Critical</span>
              </div>
            </div>

            {/* Replenishment Amount */}
            <div className="mb-6">
              <p className="stat-label mb-2">Replenishment Amount</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold">$</span>
                <input
                  type="number"
                  defaultValue={500}
                  className="input-field pl-7 pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">USD</span>
              </div>
              <p className="text-[10px] text-neutral-400 italic mt-2">
                Refill will execute from verified bank account on file.
              </p>
            </div>

            <button className="btn-secondary w-full justify-center">
              Update Refill Parameters
            </button>
          </div>

          {/* Operational Warning */}
          <div className="card border-secondary-200 bg-secondary-50/30">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Operational Gas Warning</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Current XLM prices fluctuate. We recommend maintaining at least $50
                  in surplus to cover agent execution fees during high network
                  congestion periods.
                </p>
              </div>
            </div>
          </div>

          {/* Predictive Liquidity */}
          <div className="card-hover flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">Predictive Liquidity Mode</p>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400">AI-driven cash flow optimization</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="stat-label">Audit Trail ID</p>
          <p className="text-xs font-mono font-bold text-neutral-900 mt-1">SHA-256:7B92..41A</p>
        </div>
        <div className="card text-center">
          <p className="stat-label">Agent Uptime</p>
          <p className="text-sm font-bold text-accent mt-1">99.998%</p>
        </div>
        <div className="card text-center">
          <p className="stat-label">API Status</p>
          <p className="text-sm font-bold text-neutral-900 mt-1">V0.1 Stable</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 bg-accent rounded-full" />
            <p className="text-xs font-bold text-neutral-900">All Systems Operational</p>
          </div>
        </div>
      </div>
    </div>
  );
}
