"use client";

import { useEffect, useState } from "react";
import { useContractStatus } from "@/hooks/useContractStatus";
import { simulatePayment, getTransactions } from "@/lib/api";
import { stroopsToUsdc, relativeTime, shortAddress } from "@/lib/format";
import type { TransactionEvent } from "@/lib/types";

const TIERS = [
  { label: "Starter", amount: 1000, highlight: false },
  { label: "Enterprise", amount: 5000, highlight: true },
];

export default function LiquidityPage() {
  const { status, balance, refresh } = useContractStatus();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [recentTxs, setRecentTxs] = useState<TransactionEvent[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      getTransactions(20)
        .then((r) => {
          if (!active) return;
          setRecentTxs(r.transactions);
          setLastSyncAt(new Date().toISOString());
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  async function handleTopUp(depositAmount?: number) {
    const usd = depositAmount ?? Number(amount);
    if (!usd || usd <= 0) return;

    setBusy(true);
    setResult(null);
    try {
      await simulatePayment(usd);
      setResult({ ok: true, text: `$${usd.toFixed(2)} simulated deposit broadcast to testnet` });
      setAmount("");
      refresh();
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  const onChainUsdc = balance?.balance_usdc ?? "0.00";
  const dailyLimitUsdc = status ? stroopsToUsdc(status.daily_limit) : "0.00";
  const spentUsdc = status ? stroopsToUsdc(status.spent_today) : "0.00";
  const headroomUsdc = (Number(dailyLimitUsdc) - Number(spentUsdc)).toFixed(2);
  const settledRecent = recentTxs.filter((t) => t.status === "settled").slice(0, 5);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-text-primary">Liquidity Bridge</h2>
        <p className="text-text-muted text-sm mt-1 max-w-2xl">
          Fund the vault with testnet USDC so the agent has balance to pay merchants through the x402 flow.
        </p>
      </div>

      {/* Vault Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="col-span-1 md:col-span-2 card flex flex-col justify-between">
          <div>
            <p className="stat-label">Vault Balance (On-Chain)</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-3xl lg:text-4xl font-bold text-text-primary font-mono tracking-tight">
                ${Number(onChainUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-lg font-semibold text-text-muted font-mono">USDC</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mt-6 lg:mt-8 border-t border-surface-border pt-6">
            <div className="flex flex-col">
              <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">Daily Headroom</span>
              <span className="font-mono font-bold text-text-primary">
                {Number(headroomUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">Spent Today</span>
              <span className="font-mono font-bold text-text-primary">
                {Number(spentUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary-600 to-accent-600 p-6 lg:p-8 rounded-xl flex flex-col justify-between text-white">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Network</span>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${status ? "bg-success-400 animate-pulse" : "bg-warning-400"}`} />
              <span className="text-lg lg:text-xl font-medium text-white uppercase">
                Stellar {status?.network ?? "—"}
              </span>
            </div>
          </div>
          <div className="bg-white/10 p-4 rounded-lg mt-4">
            <p className="text-xs text-white/80 leading-relaxed">
              {settledRecent.length > 0
                ? `Last settlement ${relativeTime(settledRecent[0].timestamp)} on Horizon.`
                : "No settlements broadcast yet. Fund the vault and run the demo to generate activity."}
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Action Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Column 1: Testnet Funding */}
        <div className="space-y-6">
          <section className="card">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-semibold text-text-primary flex items-center gap-2">
                <span translate="no" className="material-symbols-outlined text-[20px] text-primary-fg">bolt</span>
                Fund Vault
              </h4>
              <span className="badge-info">TESTNET</span>
            </div>

            {/* Tier selection */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {TIERS.map((tier) => (
                <button
                  key={tier.label}
                  onClick={() => setAmount(String(tier.amount))}
                  className={`p-4 rounded-lg border-2 text-left transition-all group ${
                    amount === String(tier.amount)
                      ? "border-accent-400 bg-accent-400/10"
                      : "border-surface-border hover:border-accent-400/50"
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase ${
                    amount === String(tier.amount)
                      ? "text-accent-fg"
                      : "text-text-muted group-hover:text-accent-fg"
                  }`}>
                    {tier.label}
                  </span>
                  <span className="text-xl font-bold text-text-primary font-mono block mt-1">
                    ${tier.amount.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom deposit */}
            <div className="mb-4">
              <label className="stat-label block mb-1.5">Custom Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field pl-8 pr-16 text-lg"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-text-muted">USDC</span>
              </div>
            </div>

            <button
              onClick={() => handleTopUp()}
              disabled={busy || !amount || Number(amount) <= 0}
              className="btn-primary w-full justify-center py-4 text-base"
            >
              <span translate="no" className="material-symbols-outlined text-lg">bolt</span>
              {busy ? "Broadcasting..." : "Simulate Deposit"}
            </button>

            <p className="text-[10px] text-text-disabled italic mt-3">
              Uses the backend&apos;s <span className="font-mono">simulatePayment</span> endpoint to mint testnet USDC to the vault. No real funds move.
            </p>

            {result && (
              <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm animate-slide-up ${
                result.ok
                  ? "bg-success-glow text-success-fg"
                  : "bg-error-glow text-error-fg"
              }`}>
                <span className={`w-2 h-2 rounded-full ${result.ok ? "bg-success-400" : "bg-error-500"}`} />
                {result.text}
              </div>
            )}
          </section>
        </div>

        {/* Column 2: Recent On-Chain Activity */}
        <div className="space-y-6">
          <section className="card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-text-primary text-sm">Recent On-Chain Activity</h4>
              <span className="text-[9px] font-mono uppercase tracking-wider text-text-disabled">
                {lastSyncAt ? `Synced ${relativeTime(lastSyncAt)}` : "Syncing…"}
              </span>
            </div>
            {settledRecent.length === 0 ? (
              <p className="text-xs text-text-muted italic py-6 text-center">
                No settled payments yet. Fund the vault and run the demo to see live activity.
              </p>
            ) : (
              <div className="space-y-3">
                {settledRecent.map((tx, i) => (
                  <div
                    key={tx.id}
                    className={`flex items-center justify-between py-2 ${
                      i < settledRecent.length - 1 ? "border-b border-surface-border" : ""
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <a
                        href={tx.stellar_expert_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-accent-fg font-mono hover:underline"
                      >
                        {tx.tx_hash.slice(0, 8)}...{tx.tx_hash.slice(-4)}
                      </a>
                      <span className="text-[10px] text-text-muted">
                        {tx.merchant ? shortAddress(tx.merchant) : "—"} · {relativeTime(tx.timestamp)}
                      </span>
                    </div>
                    <div className="text-right flex items-center gap-3 shrink-0">
                      <span className="font-mono text-sm font-bold text-text-primary">
                        ${Number(stroopsToUsdc(tx.amount)).toFixed(2)}
                      </span>
                      <span className="badge-success uppercase tracking-wider text-[9px]">Settled</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Info Box */}
          <div className="bg-accent-400/5 border-l-4 border-accent-400 p-4 rounded-r-lg">
            <div className="flex gap-3">
              <span translate="no" className="material-symbols-outlined text-accent-fg text-sm">info</span>
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-text-primary">Operational Gas Note</h5>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  The vault also needs a small XLM reserve to cover Soroban transaction fees. Use the Stellar testnet friendbot to fund the contract account with XLM if the agent starts failing transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
